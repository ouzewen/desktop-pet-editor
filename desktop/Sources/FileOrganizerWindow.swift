import AppKit
import ApplicationServices
import Darwin
import UniformTypeIdentifiers

enum FileOrganizationAccess {
    /// macOS has no public Full Disk Access preflight API. Check whether the
    /// process can open a protected user resource, without reading its contents.
    static func hasFullDiskAccess() -> Bool {
        let home = FileManager.default.homeDirectoryForCurrentUser
        for path in ["Library/Safari/History.db", "Library/Messages/chat.db", "Library/Application Support/com.apple.TCC/TCC.db"] {
            let descriptor = open(home.appendingPathComponent(path).path, O_RDONLY | O_NOFOLLOW | O_CLOEXEC)
            if descriptor >= 0 {
                close(descriptor)
                return true
            }
        }
        // Mail's protected folder also works on accounts without a populated database.
        if let directory = opendir(home.appendingPathComponent("Library/Mail").path) {
            errno = 0
            let accessible = readdir(directory) != nil || errno == 0
            closedir(directory)
            return accessible
        }
        return false
    }

    static func isOpen(_ url: URL) throws -> Bool {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/sbin/lsof")
        task.arguments = ["-w", "-nP", "-t", "-a", "-u", String(getuid()), "--", url.path]
        task.standardOutput = FileHandle.nullDevice
        task.standardError = FileHandle.nullDevice
        try task.run()
        task.waitUntilExit()
        guard task.terminationReason == .exit, [0, 1].contains(task.terminationStatus) else {
            throw OrganizationProblem.checkFailed
        }
        return task.terminationStatus == 0
    }

    static func openDocuments(from applications: [pid_t]) -> Set<String> {
        guard AXIsProcessTrusted() else { return [] }
        var paths = Set<String>()
        for pid in applications {
            let app = AXUIElementCreateApplication(pid)
            AXUIElementSetMessagingTimeout(app, 0.1)
            var value: CFTypeRef?
            guard AXUIElementCopyAttributeValue(app, kAXWindowsAttribute as CFString, &value) == .success,
                  let windows = value as? [AXUIElement] else { continue }
            for window in windows {
                var document: CFTypeRef?
                guard AXUIElementCopyAttributeValue(window, kAXDocumentAttribute as CFString, &document) == .success,
                      let raw = document as? String else { continue }
                let url = raw.hasPrefix("/") ? URL(fileURLWithPath: raw) : URL(string: raw)
                if let url, url.isFileURL { paths.insert(url.resolvingSymlinksInPath().standardizedFileURL.path) }
            }
        }
        return paths
    }
}

final class FileOrganizerWindow: NSObject, NSTableViewDataSource, NSTableViewDelegate {
    private let worker = DispatchQueue(label: "desktop-pet.file-organization", qos: .userInitiated)
    private let activate: () -> Void
    private let access: () -> Bool
    private let journal: URL
    private let fileIsOpen: FileOrganizer.OpenFileCheck
    private var busy = false
    private var window: NSPanel?
    private var picker: NSOpenPanel?
    private var tableRows: [[String]] = []

    init(activate: @escaping () -> Void, access: @escaping () -> Bool = FileOrganizationAccess.hasFullDiskAccess,
         journal: URL = FileOrganizer.journalURL, fileIsOpen: @escaping FileOrganizer.OpenFileCheck = FileOrganizationAccess.isOpen) {
        self.activate = activate
        self.access = access
        self.journal = journal
        self.fileIsOpen = fileIsOpen
    }

    func organizeDesktop() {
        guard ready(), authorized() else { return }
        let desktop = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Desktop", isDirectory: true)
        preview(desktop, desktop: true)
    }

    func chooseFolder() {
        guard ready(), authorized() else { return }
        let picker = NSOpenPanel()
        picker.title = "选择要整理的文件夹"
        picker.prompt = "选择文件夹"
        picker.canChooseDirectories = true
        picker.canChooseFiles = false
        picker.canCreateDirectories = false
        picker.allowsMultipleSelection = false
        self.picker = picker
        activate()
        picker.begin { [weak self, weak picker] response in
            guard let self else { return }
            let url = picker?.url
            self.picker = nil
            if response == .OK, let url { self.preview(url, desktop: false) }
        }
    }

    func preview(_ root: URL, desktop: Bool) {
        let title = desktop ? "桌面整理" : "文件夹整理"
        perform(title: title, progress: "正在扫描文件…") { service in
            let plan = try service.preview(root)
            let previous = try service.latestBatch(in: plan.root)
            return { self.showPreview(plan, desktop: desktop, previous: previous) }
        }
    }

    private func ready() -> Bool {
        if let picker { picker.makeKeyAndOrderFront(nil); return false }
        if busy { window?.makeKeyAndOrderFront(nil); return false }
        return true
    }

    private func authorized() -> Bool {
        if access() { return true }
        activate()
        let alert = NSAlert()
        alert.messageText = "需要先开权限"
        alert.informativeText = "在「系统设置 → 隐私与安全性 → 完全磁盘访问权限」中为桌宠开启权限。系统如提示退出，请重新打开桌宠后再整理。"
        alert.addButton(withTitle: "打开系统设置")
        alert.addButton(withTitle: "取消")
        if alert.runModal() == .alertFirstButtonReturn,
           let url = URL(string: "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_AllFiles") {
            NSWorkspace.shared.open(url)
        }
        return false
    }

    private func perform(title: String, progress: String, job: @escaping (FileOrganizer) throws -> () -> Void) {
        guard ready(), authorized() else { return }
        busy = true
        let applications = NSWorkspace.shared.runningApplications
            .filter { $0.activationPolicy == .regular && $0.processIdentifier != getpid() }.map(\.processIdentifier)
        showCard(title: title, message: progress, footer: [])
        worker.async { [self] in
            let documents = FileOrganizationAccess.openDocuments(from: applications)
            let service = FileOrganizer(journal: journal) { url in
                if documents.contains(url.resolvingSymlinksInPath().standardizedFileURL.path) { return true }
                return try self.fileIsOpen(url)
            }
            do {
                let finish = try job(service)
                DispatchQueue.main.async {
                    self.busy = false
                    finish()
                }
            } catch {
                DispatchQueue.main.async {
                    self.busy = false
                    self.showCard(title: title, message: error.localizedDescription, footer: [self.closeButton()])
                }
            }
        }
    }

    private func showPreview(_ plan: OrganizationPlan, desktop: Bool, previous: UUID?) {
        let title = desktop ? "桌面整理" : "文件夹整理"
        var rows = plan.files.map { file in
            [file.month, file.keyword ?? "—", file.category, file.name, (file.folders + [file.name]).joined(separator: "/")]
        }
        rows.append(contentsOf: plan.skipped.map { ["—", "—", "—", relativePath($0.url, in: plan.root), "没动 · \($0.reason)"] })
        let count = desktop ? "桌面上有 \(plan.fileCount) 个文件" : "选定文件夹有 \(plan.fileCount) 个文件"
        var buttons: [NSButton] = [closeButton("取消")]
        if let previous {
            buttons.append(button("撤销上次整理") { [weak self] in self?.undo(root: plan.root, id: previous) })
        }
        let start = button("开始整理", key: "\r") { [weak self] in self?.execute(plan) }
        start.isEnabled = !plan.files.isEmpty
        buttons.append(start)
        showCard(title: title, message: "\(count)，\(plan.files.count) 个待整理，\(plan.skipped.count) 项没动",
                 details: "路径相对于 \(displayPath(plan.root))", columns: ["修改月份", "关键词", "类别", "原位置", "目标位置／没动的原因"],
                 rows: rows, footer: buttons)
    }

    private func execute(_ plan: OrganizationPlan) {
        perform(title: "整理文件", progress: "正在整理文件…") { service in
            let animation = DispatchQueue.main.sync { () -> OrganizationAnimation in
                let animation = OrganizationAnimation()
                self.showCard(title: "整理文件", message: "小猫正在搬文件", extra: animation, footer: [])
                return animation
            }
            let result = try service.execute(plan) { source, destination, index, total, moved in
                DispatchQueue.main.sync {
                    animation.advance(source: source, destination: destination, index: index, total: total, moved: moved)
                }
                if moved { Thread.sleep(forTimeInterval: 0.23) }
            }
            return { self.showResult(result, root: plan.root, undo: false) }
        }
    }

    private func undo(root: URL, id: UUID) {
        perform(title: "整理文件", progress: "正在把文件放回原位…") { service in
            let result = try service.undo(root: root, id: id)
            return { self.showResult(result, root: root, undo: true) }
        }
    }

    private func showResult(_ result: OrganizationResult, root: URL, undo: Bool) {
        let remaining = result.skipped.count
        let message = undo ? "已撤销，\(result.moved) 个文件放回原位，\(remaining) 项待处理"
            : remaining == 0 ? "整理好了，\(result.moved) 个文件都分好了，0 个没动"
            : "整理好了，\(result.moved) 个文件已分好，\(remaining) 项没动"
        var buttons = [closeButton("完成")]
        if let id = result.batchID {
            buttons.append(button(undo ? "重试撤销" : "撤销") { [weak self] in self?.undo(root: root, id: id) })
        }
        showCard(title: undo ? "撤销结果" : "整理结果", message: message, details: displayPath(root),
                 columns: remaining == 0 ? [] : ["没动的几个", "原因"],
                 rows: result.skipped.map { [displayPath($0.url), $0.reason] }, footer: buttons)
    }

    private func displayPath(_ url: URL) -> String { (url.path as NSString).abbreviatingWithTildeInPath }

    private func relativePath(_ url: URL, in root: URL) -> String {
        let parent = url.deletingLastPathComponent().resolvingSymlinksInPath().path
        if parent == root.path { return url.lastPathComponent }
        if parent.hasPrefix(root.path + "/") {
            return String(parent.dropFirst(root.path.count + 1)) + "/" + url.lastPathComponent
        }
        return displayPath(url)
    }

    private func showCard(title: String, message: String, details: String? = nil,
                          columns: [String] = [], rows: [[String]] = [], extra: NSView? = nil, footer: [NSButton]) {
        let panel = window ?? NSPanel(contentRect: NSRect(x: 0, y: 0, width: 960, height: 510),
            styleMask: [.titled, .closable, .resizable], backing: .buffered, defer: false)
        let first = window == nil || !panel.isVisible
        window = panel
        panel.title = title
        panel.isReleasedWhenClosed = false
        panel.minSize = NSSize(width: 560, height: 210)
        panel.standardWindowButton(.closeButton)?.isEnabled = !busy
        let stack = NSStackView()
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 12
        stack.edgeInsets = NSEdgeInsets(top: 18, left: 20, bottom: 16, right: 20)
        let headline = NSTextField(wrappingLabelWithString: message)
        headline.font = NSFont.systemFont(ofSize: 20, weight: .semibold)
        stack.addArrangedSubview(headline)
        headline.widthAnchor.constraint(lessThanOrEqualTo: stack.widthAnchor, constant: -40).isActive = true
        if let details {
            let path = NSTextField(wrappingLabelWithString: details)
            path.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
            path.textColor = .secondaryLabelColor
            path.isSelectable = true
            stack.addArrangedSubview(path)
            path.widthAnchor.constraint(lessThanOrEqualTo: stack.widthAnchor, constant: -40).isActive = true
        }
        tableRows = rows
        if !columns.isEmpty {
            let scroll = table(columns)
            stack.addArrangedSubview(scroll)
            scroll.widthAnchor.constraint(equalTo: stack.widthAnchor, constant: -40).isActive = true
            scroll.heightAnchor.constraint(greaterThanOrEqualToConstant: 130).isActive = true
        }
        if let extra {
            stack.addArrangedSubview(extra)
            extra.widthAnchor.constraint(equalTo: stack.widthAnchor, constant: -40).isActive = true
        }
        if !footer.isEmpty {
            let spacer = NSView()
            spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
            let actions = NSStackView(views: [spacer] + footer)
            actions.orientation = .horizontal
            actions.spacing = 9
            stack.addArrangedSubview(actions)
            actions.widthAnchor.constraint(equalTo: stack.widthAnchor, constant: -40).isActive = true
        }
        panel.contentView = stack
        let size = columns.isEmpty ? NSSize(width: 650, height: extra == nil ? 220 : 255)
            : NSSize(width: 1020, height: 565)
        panel.setContentSize(size)
        if first { panel.center() }
        activate()
        panel.makeKeyAndOrderFront(nil)
    }

    private func table(_ titles: [String]) -> NSScrollView {
        let table = NSTableView()
        table.delegate = self
        table.dataSource = self
        table.rowHeight = 27
        table.usesAlternatingRowBackgroundColors = true
        table.columnAutoresizingStyle = .noColumnAutoresizing
        for (index, title) in titles.enumerated() {
            let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier(String(index)))
            column.title = title
            let isPath = titles.count == 2 || index >= 3
            let font = NSFont.systemFont(ofSize: 12)
            let widest = tableRows.map { ($0[index] as NSString).size(withAttributes: [.font: font]).width }.max() ?? 0
            column.width = isPath ? min(2300, max(index == 4 ? 355 : 240, widest + 22)) : (index == 2 ? 96 : 84)
            table.addTableColumn(column)
        }
        let scroll = NSScrollView()
        scroll.hasHorizontalScroller = true
        scroll.hasVerticalScroller = true
        scroll.autohidesScrollers = true
        scroll.borderType = .bezelBorder
        scroll.documentView = table
        return scroll
    }

    func numberOfRows(in tableView: NSTableView) -> Int { tableRows.count }

    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        guard let tableColumn, let index = Int(tableColumn.identifier.rawValue),
              tableRows.indices.contains(row), tableRows[row].indices.contains(index) else { return nil }
        let text = tableRows[row][index]
        let label = NSTextField(labelWithString: text)
        label.font = NSFont.systemFont(ofSize: 12)
        label.lineBreakMode = .byTruncatingMiddle
        label.toolTip = text
        return label
    }

    private func button(_ title: String, key: String = "", action: @escaping () -> Void) -> NSButton {
        let button = OrganizerButton(title: title, target: nil, action: #selector(OrganizerButton.performClickAction))
        button.target = button
        button.handler = action
        button.bezelStyle = .rounded
        button.keyEquivalent = key
        return button
    }

    private func closeButton(_ title: String = "关闭") -> NSButton {
        button(title, key: "\u{1b}") { [weak self] in self?.window?.close() }
    }
}

private final class OrganizerButton: NSButton {
    var handler: (() -> Void)?
    @objc func performClickAction() { handler?() }
}

private final class OrganizationAnimation: NSView {
    private let cat = NSImageView(image: NSApp.applicationIconImage)
    private let file = NSImageView(image: NSWorkspace.shared.icon(for: .data))
    private let folder = NSImageView(image: NSWorkspace.shared.icon(for: .folder))
    private let path = NSTextField(labelWithString: "准备搬文件…")
    private let gauge = NSProgressIndicator()

    init() {
        super.init(frame: .zero)
        for item in [cat, file, folder, path, gauge] { addSubview(item) }
        for item in [cat, file, folder] { item.imageScaling = .scaleProportionallyUpOrDown }
        path.lineBreakMode = .byTruncatingMiddle
        gauge.isIndeterminate = false
        gauge.minValue = 0
        gauge.maxValue = 1
        heightAnchor.constraint(equalToConstant: 106).isActive = true
    }

    required init?(coder: NSCoder) { nil }

    override func layout() {
        super.layout()
        cat.frame = NSRect(x: 6, y: 53, width: 45, height: 45)
        file.frame = NSRect(x: 41, y: 56, width: 21, height: 25)
        folder.frame = NSRect(x: max(85, bounds.width - 56), y: 53, width: 45, height: 43)
        path.frame = NSRect(x: 0, y: 25, width: bounds.width, height: 19)
        gauge.frame = NSRect(x: 0, y: 3, width: bounds.width, height: 14)
    }

    func advance(source: URL, destination: URL, index: Int, total: Int, moved: Bool) {
        gauge.maxValue = Double(total)
        gauge.doubleValue = Double(index)
        path.stringValue = "\(index) / \(total)　\(source.lastPathComponent)"
        path.toolTip = moved ? destination.path : source.path
        cat.setFrameOrigin(NSPoint(x: 6, y: 53))
        file.setFrameOrigin(NSPoint(x: 41, y: 56))
        file.alphaValue = moved ? 1 : 0
        guard moved else { return }
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.18
            cat.animator().setFrameOrigin(NSPoint(x: folder.frame.minX - 49, y: 53))
            file.animator().setFrameOrigin(NSPoint(x: folder.frame.midX - 10, y: 56))
            file.animator().alphaValue = 0.15
        }
    }
}
