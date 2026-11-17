import AppKit
import CoreText
import SwiftUI
import WebKit

final class PetPanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

/// Sits behind the web view and accepts file drags; the web view ignores them,
/// so AppKit walks up to this view as the drop destination.
final class DropView: NSView {
    var onFilesDropped: (([URL]) -> Void)?
    var onDragActiveChanged: ((Bool) -> Void)?

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        registerForDraggedTypes([.fileURL])
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        registerForDraggedTypes([.fileURL])
    }

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        let urls = TrashService.fileURLs(from: sender)
        DropLog.write("web enter urls=\(urls.count)")
        guard !urls.isEmpty else { return [] }
        onDragActiveChanged?(true)
        return .copy
    }

    override func draggingUpdated(_ sender: NSDraggingInfo) -> NSDragOperation {
        let urls = TrashService.fileURLs(from: sender)
        return urls.isEmpty ? [] : .copy
    }

    override func draggingExited(_ sender: NSDraggingInfo?) {
        DropLog.write("web exit")
        onDragActiveChanged?(false)
    }

    override func prepareForDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let urls = TrashService.fileURLs(from: sender)
        DropLog.write("web prepare urls=\(urls.count)")
        return !urls.isEmpty
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let urls = TrashService.fileURLs(from: sender)
        DropLog.write("web perform urls=\(urls.count)")
        onDragActiveChanged?(false)
        guard !urls.isEmpty else { return false }
        onFilesDropped?(urls)
        return true
    }

    override func concludeDragOperation(_ sender: NSDraggingInfo?) {
        DropLog.write("web conclude")
    }
}

final class PetView: WKWebView {
    var send: (String) -> Void = { _ in }
    var menuForPet: () -> NSMenu = { NSMenu() }
    /// Runs right after the panel moves, in the same drag event, so attached
    /// cards are repositioned before the next frame instead of trailing the pet.
    var onMove: () -> Void = {}
    var onDragStart: (NSPoint) -> Void = { _ in }
    var onDragEnd: (NSPoint) -> Void = { _ in }
    /// True while the focus card is pinned: the pet stays put when dragged.
    var isLocked: () -> Bool = { false }
    private(set) var isDragging = false
    private var start: NSPoint?
    private var origin: NSPoint = .zero
    private var previousX: CGFloat = 0
    private var previousDragTimestamp: TimeInterval = 0

    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    // WKWebView is the hit view for the whole panel, so it has to be the drop
    // destination itself; a view underneath never sees the drag.
    var onFilesDropped: (([URL]) -> Void)?
    var onDragActiveChanged: ((Bool) -> Void)?

    override init(frame: NSRect, configuration: WKWebViewConfiguration) {
        super.init(frame: frame, configuration: configuration)
        registerForDraggedTypes([.fileURL])
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        registerForDraggedTypes([.fileURL])
    }

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        let urls = TrashService.fileURLs(from: sender)
        DropLog.write("web enter urls=\(urls.count)")
        guard !urls.isEmpty else { return [] }
        onDragActiveChanged?(true)
        return .copy
    }

    override func draggingUpdated(_ sender: NSDraggingInfo) -> NSDragOperation {
        let urls = TrashService.fileURLs(from: sender)
        return urls.isEmpty ? [] : .copy
    }

    override func draggingExited(_ sender: NSDraggingInfo?) {
        DropLog.write("web exit")
        onDragActiveChanged?(false)
    }

    override func prepareForDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let urls = TrashService.fileURLs(from: sender)
        DropLog.write("web prepare urls=\(urls.count)")
        return !urls.isEmpty
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let urls = TrashService.fileURLs(from: sender)
        DropLog.write("web perform urls=\(urls.count)")
        onDragActiveChanged?(false)
        guard !urls.isEmpty else { return false }
        onFilesDropped?(urls)
        return true
    }

    override func concludeDragOperation(_ sender: NSDraggingInfo?) {
        DropLog.write("web conclude")
    }

    override func mouseDown(with event: NSEvent) {
        guard !isLocked(), let window else { return }
        let point = window.convertPoint(toScreen: event.locationInWindow)
        start = point
        isDragging = false
        previousX = point.x
        previousDragTimestamp = event.timestamp
        send("beginDrag()")
    }

    override func mouseDragged(with event: NSEvent) {
        guard !isLocked(), let start, let window else { return }
        let point = window.convertPoint(toScreen: event.locationInWindow)
        if !isDragging {
            guard hypot(point.x - start.x, point.y - start.y) >= 4 else { return }
            isDragging = true
            onDragStart(start)
            origin = window.frame.origin
        }
        window.setFrameOrigin(NSPoint(x: origin.x + point.x - start.x, y: origin.y + point.y - start.y))
        onMove()
        let dx = point.x - previousX
        let elapsed = max(1, (event.timestamp - previousDragTimestamp) * 1000)
        send("drag(\(dx),\(elapsed))")
        previousX = point.x
        previousDragTimestamp = event.timestamp
    }

    override func mouseUp(with event: NSEvent) {
        let moved = isDragging
        start = nil
        isDragging = false
        send("release()")
        if moved, !isLocked(), let window { onDragEnd(window.convertPoint(toScreen: event.locationInWindow)) }
    }

    override func rightMouseDown(with event: NSEvent) {
        NSMenu.popUpContextMenu(menuForPet(), with: event, for: self)
    }
}

final class DesktopPet: NSObject, NSApplicationDelegate, WKNavigationDelegate, NSWindowDelegate {
    private let panel = PetPanel(
        contentRect: NSRect(x: 0, y: 0, width: 240, height: 240),
        styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false
    )
    private var edgePlacement: PetEdgePlacement?
    private var browserFollowTimer: Timer?
    private let web: PetView = {
        let config = WKWebViewConfiguration()
        // The bundled renderer compares custom edits to its local sprite layers.
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        return PetView(frame: .zero, configuration: config)
    }()
    private let preview: WKWebView = {
        let config = WKWebViewConfiguration()
        // This view only loads bundled content. Pixel editing needs canvas readback.
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        return WKWebView(frame: .zero, configuration: config)
    }()
    private let workbenchState = WorkbenchState()
    private let typingActivity = TypingActivity()
    private var workbenchWindow: NSWindow?
    private var previewReady = false
    private var appliedConfig: [String: Any]?
    private var draftTemplate: [String: Any] = [:]
    private struct CustomSelection {
        let id: String
        let url: URL
        let snapshot: PixelEditSnapshot
    }
    private var previewCustom: CustomSelection?
    private var appliedCustom: CustomSelection?
    private var customSelectionRequest = 0
    private var presetRequest = 0
    private let status = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private var keyboardTap: CFMachPort?
    private var tapSource: CFRunLoopSource?
    private var localMonitor: Any?
    private var typingRetry: Timer?
    private var typingAlert: NSAlert?
    private var requestedTypingPermission = false
    private var ready = false
    private var suppressWorkbenchReopen = false
    private var reopenSuppressionToken = 0
    private var eyeFollow = true
    private var gazeTimer: Timer?
    private var petGaze: (x: Int, y: Int)?
    private var previewGaze: (x: Int, y: Int)?
    private let reminderList = ReminderListModel()
    private var reminderListHost: ReminderHostingView<ReminderListCard>?
    private var reminderWindow: ReminderPanel?
    private var reminderInputWindow: ReminderPanel?
    private var reminderInputPetOrigin: NSPoint?
    private var isHidingReminderInput = false
    private var reminderClickMonitor: Any?
    private var reminderInputShiftedOrigin: NSPoint?
    private let reminderInput = ReminderInputModel()
    private var reminderObserver: NSObjectProtocol?
    private let focus = FocusModel(automaticTimer: !CommandLine.arguments.contains("--self-test"))
    private var focusHost: ReminderHostingView<FocusCard>?
    private var focusWindow: ReminderPanel?
    private let focusMinutesInput = FocusMinutesModel()
    private var focusMinutesWindow: ReminderPanel?
    private let weather = WeatherModel()
    private var weatherWindow: ReminderPanel?
    private let weatherCityInput = WeatherCityModel()
    private var weatherCityWindow: ReminderPanel?
    private var weatherTimer: Timer?
    private var weatherRetryAt: Date?
    private let music = MusicWatcher()
    private var musicWindow: ReminderPanel?
    private let clipboard = ClipboardStore()
    private var clipboardWindow: ReminderPanel?
    private var clipboardClickMonitor: Any?
    private let translationEngine = TranslationEngine()
    private var translateButtonWindow: ReminderPanel?
    private var translationWindow: ReminderPanel?
    private var pendingSelection: String?
    private var currentTranslation: String?
    private var selectionDownPoint: NSPoint?
    private var selectionUpMonitor: Any?
    private var selectionDownMonitor: Any?
    private var translationDismissMonitor: Any?
    private var translationTrustRequested = false
    private let chatMemory = PetMemory()
    private lazy var chatBrain = ChatBrain(memory: chatMemory)
    private var chatModel: ChatModel?
    private var chatWindow: ReminderPanel?
    private var chatDismissMonitor: Any?
    private var dropView: DropView?
    private var pixelEditorWindow: NSWindow?
    private var dropChoiceWindow: ReminderPanel?
    private var dropChoiceURL: URL?
    private var dropChoiceKind: FileKind = .unsupported
    private var dropChoiceMonitor: Any?
    private var dropChoiceLocalMonitor: Any?
    private lazy var fileOrganizer = FileOrganizerWindow(activate: { [weak self] in self?.activateForPetUI() })
    private var quickBarWindow: ReminderPanel?
    private var quickBarTimer: Timer?
    private var quickBarLeaveAt: Date?
    private var quickBarPetOrigin: NSPoint?
    private var quickBarAdjusting = false
    private var trashToastWindow: ReminderPanel?
    private var trashToastHide: DispatchWorkItem?
    private var isTest: Bool { CommandLine.arguments.contains("--self-test") }

    func applicationDidFinishLaunching(_ notification: Notification) {
        registerPixelFont()
        installApplicationMenu()
        panel.isExcludedFromWindowsMenu = true
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        web.setValue(false, forKey: "drawsBackground")
        web.navigationDelegate = self
        web.send = { [weak self] in self?.send($0) }
        web.menuForPet = { [weak self] in self?.makeMenu() ?? NSMenu() }
        let container = DropView(frame: panel.contentRect(forFrameRect: panel.frame))
        container.autoresizingMask = [.width, .height]
        container.onFilesDropped = { [weak self] urls in self?.handleFileDrop(urls) }
        container.onDragActiveChanged = { [weak self] active in
            if active {
                self?.showTrashToast("松手选择操作", tone: .hint, autoHide: nil)
            } else {
                self?.hideTrashToast()
            }
        }
        web.frame = container.bounds
        web.autoresizingMask = [.width, .height]
        container.addSubview(web)
        panel.contentView = container
        dropView = container
        web.onFilesDropped = { [weak self] urls in self?.handleFileDrop(urls) }
        web.onDragActiveChanged = { [weak self] active in
            if active {
                self?.showTrashToast("松手选择操作", tone: .hint, autoHide: nil)
            } else {
                self?.hideTrashToast()
            }
        }
        web.onMove = { [weak self] in self?.layoutReminder() }
        web.onDragStart = { [weak self] in self?.beginPetDrag(at: $0) }
        web.onDragEnd = { [weak self] in self?.finishPetDrag(at: $0) }
        web.isLocked = { [weak self] in self?.focus.pinned ?? false }
        configureWorkbench()
        let prefs = UserDefaults.standard
        eyeFollow = prefs.object(forKey: "shibaEyeFollow") as? Bool ?? true
        workbenchState.eyeFollow = eyeFollow
        loadReminders()
        workbenchState.visible = prefs.object(forKey: "shibaVisible") as? Bool ?? (prefs.string(forKey: "shibaConfig") != nil)
        let savedSize = prefs.object(forKey: "shibaSize") as? Double ?? 240
        workbenchState.petSize = min(320, max(120, savedSize))
        panel.setContentSize(NSSize(width: workbenchState.petSize, height: workbenchState.petSize))
        resetPosition()
        reminderObserver = NotificationCenter.default.addObserver(
            forName: NSWindow.didMoveNotification, object: panel, queue: .main
        ) { [weak self] _ in
            self?.layoutReminder()
        }

        focus.onChange = { [weak self] in self?.focusSessionChanged() }
        weather.onChange = { [weak self] in
            guard let self else { return }
            self.status.menu = self.makeMenu()
        }
        clipboard.onChange = { [weak self] in
            guard let self else { return }
            self.status.menu = self.makeMenu()
        }
        music.onChange = { [weak self] name in
            guard let self else { return }
            self.status.menu = self.makeMenu()
            if let name {
                self.showMusicBadge(app: name)
            } else {
                self.hideMusicBadge()
            }
        }

        status.button?.title = ""
        status.button?.image = makeStatusIcon()
        status.button?.imagePosition = .imageOnly
        status.button?.toolTip = "桌宠"
        status.button?.setAccessibilityLabel("桌宠")
        status.menu = makeMenu()
        guard let resources = Bundle.main.resourceURL else { NSApp.terminate(nil); return }
        web.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        preview.setValue(false, forKey: "drawsBackground")
        preview.navigationDelegate = self
        preview.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        if isTest { createWorkbench() } else { openWorkbench() }
        runChatSmokeIfRequested()
        startWeatherTimer()
        music.start()
        clipboard.start()
        startSelectionWatcher()
        if !isTest { startQuickBarTimer() }
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if let self, !self.hasActiveKeyboardTap { self.recordKey(event) }
            return event
        }
        reminderClickMonitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
            self?.dismissTransientReminderUI(at: NSEvent.mouseLocation)
            return event
        }
        if !isTest {
            setupTypingSync()
            startGazeTimer()
        }
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        if !isTest { refreshTypingListener() }
    }

    func applicationDidResignActive(_ notification: Notification) {
        hideReminderInput()
        if reminderList.isAdding {
            reminderList.isAdding = false
            reminderList.draft = ""
        }
    }

    func applicationDidChangeScreenParameters(_ notification: Notification) {
        if edgePlacement != nil { layoutEdgePet(size: workbenchState.petSize) }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        // Focusing the pet's reminder input must not pull the workbench forward.
        guard !suppressWorkbenchReopen else { return true }
        openWorkbench()
        return true
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if webView === preview {
            previewReady = true
            loadAppearance()
        } else if webView === web {
            ready = true
            if let appliedConfig { configurePet(appliedConfig) }
            if let appliedCustom { applyCustomOverlay(appliedCustom.snapshot, in: web) }
            if !isTest && workbenchState.visible {
                panel.orderFrontRegardless()
                if !reminderList.items.isEmpty { showReminders() }
            }
            runSelfTestIfReady()
        }
    }

    private func registerPixelFont() {
        guard let url = Bundle.main.url(forResource: "ArkPixel12", withExtension: "ttf") else { return }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }

    private func configureWorkbench() {
        workbenchState.choosePreset = { [weak self] id in
            self?.choosePreset(id)
        }
        workbenchState.openPixelEditor = { [weak self] in self?.showPixelEditor() }
        workbenchState.chooseCustom = { [weak self] preset in self?.previewCustomPreset(preset) }
        workbenchState.clearCustom = { [weak self] in self?.clearCustomPreview() }
        workbenchState.deleteCustom = { [weak self] preset in self?.confirmDeleteCustom(preset) }
        if !isTest {
            do {
                try PixelPresetStore.migrateCheckoutPresets()
            } catch {
                workbenchState.message = "迁移旧自定义形象失败"
            }
        }
        reloadCustomPresets()
        workbenchState.refresh = { [weak self] in self?.refreshPreview() }
        workbenchState.apply = { [weak self] in self?.applyDraft() }
        workbenchState.reset = { [weak self] in self?.resetPosition() }
        workbenchState.enableTyping = { [weak self] in self?.enableTyping() }
        workbenchState.setSize = { [weak self] size in self?.resizePet(size) }
        workbenchState.setVisibility = { [weak self] visible in self?.showPet(visible) }
        workbenchState.setEyeFollow = { [weak self] enabled in self?.setEyeFollow(enabled) }
    }

    private func createWorkbench() {
        guard workbenchWindow == nil else { return }
        let host = NSHostingController(
            rootView: WorkbenchView(state: workbenchState, preview: preview, typingActivity: typingActivity)
        )
        let window = NSWindow(contentViewController: host)
        window.title = "桌宠工作台"
        window.styleMask = [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView]
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        // Background dragging swallows SwiftUI drag gestures (the size slider);
        // the header carries an explicit WindowDragArea instead.
        window.isMovableByWindowBackground = false
        window.setContentSize(NSSize(width: 960, height: 760))
        window.contentMinSize = NSSize(width: 900, height: 700)
        window.center()
        window.isReleasedWhenClosed = false
        workbenchWindow = window
    }

    @objc private func openWorkbench() {
        createWorkbench()
        NSApp.activate(ignoringOtherApps: true)
        if workbenchWindow?.isMiniaturized == true { workbenchWindow?.deminiaturize(nil) }
        workbenchWindow?.makeKeyAndOrderFront(nil)
    }

    private func installApplicationMenu() {
        let menu = NSMenu()
        let appItem = NSMenuItem()
        let appMenu = NSMenu(title: "桌宠")
        let open = appMenu.addItem(withTitle: "打开工作台", action: #selector(openWorkbench), keyEquivalent: "0")
        open.target = self
        appMenu.addItem(.separator())
        let quitItem = appMenu.addItem(withTitle: "退出桌宠", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        quitItem.target = NSApp
        appItem.submenu = appMenu
        menu.addItem(appItem)

        let fileItem = NSMenuItem()
        let fileMenu = NSMenu(title: "文件")
        fileMenu.addItem(withTitle: "关闭窗口", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileItem.submenu = fileMenu
        menu.addItem(fileItem)
        NSApp.mainMenu = menu
    }

    private func loadAppearance() {
        preview.callAsyncJavaScript(
            """
            const fallback = window.pet.preset(isTest ? "preset_m1_12" : "preset_cat_orange");
            let config = fallback;
            try {
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const normalized = window.pet.normalize(parsed);
                    // 当前只保留猫形象：旧的犬配置回落到默认猫预设。
                    if (normalized.frame === fallback.frame) {
                        config = {...normalized, breed: parsed.breed};
                    }
                }
            } catch {}
            await window.pet.check();
            return JSON.stringify({config, catalog: window.pet.catalog()});
            """,
            arguments: ["isTest": isTest, "saved": isTest ? "" : UserDefaults.standard.string(forKey: "shibaConfig") ?? ""],
            in: nil, in: .page
        ) { [weak self] result in
            guard let self else { return }
            guard case .success(let value) = result, let json = value as? String,
                  let result = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any],
                  let config = result["config"] as? [String: Any],
                  let catalog = result["catalog"],
                  let data = try? JSONSerialization.data(withJSONObject: catalog),
                  let decoded = try? JSONDecoder().decode(AppearanceCatalog.self, from: data) else {
                self.workbenchState.message = "形象加载失败"
                if self.isTest { exit(1) }
                return
            }
            self.workbenchState.catalog = decoded
            self.workbenchState.preset = self.matchingPreset(config)
            self.setDraft(config)
            self.appliedConfig = config
            self.configurePet(config)
            self.restoreCustomOverlay()
            self.runSelfTestIfReady()
        }
    }

    private var selfTestStarted = false
    private func runSelfTestIfReady() {
        guard isTest, ready, workbenchState.catalog != nil, workbenchWindow != nil, !selfTestStarted else { return }
        selfTestStarted = true
        guard verifyCustomPresetMigration() else {
            fputs("Custom presets failed to migrate to private storage\n", stderr)
            exit(1)
        }
        workbenchState.appearance["palette"] = "C06"
        applyDraft { [weak self] success in
            guard let self, success, self.appliedConfig?["palette"] as? String == "C06" else {
                fputs("Workbench could not apply the selected appearance\n", stderr)
                exit(1)
            }
            self.web.callAsyncJavaScript("return await window.pet.check()", arguments: [:], in: nil, in: .page) { result in
                guard case .success(let value) = result, value as? String == "ready" else {
                    fputs("Desktop renderer failed: \(result)\n", stderr)
                    exit(1)
                }
                self.checkCatWorkbench()
            }
        }
    }

    private func checkCatWorkbench() {
        guard let catalog = workbenchState.catalog else { exit(1) }
        for group in ["CAT", "CAT_ORANGE"] {
            let fields = catalog.fieldsByFrame[group]
            guard fields?["nose"]?.map(\.id) == ["NO02", "NO05", "NO06", "NO07", "NO08"],
                  fields?["mouth"]?.map(\.id) == ["CN08", "CN09", "CN05", "CN06", "CN07"],
                  let noseColors = fields?["noseColor"],
                  fields?["ear"]?.count == 5,
                  fields?["earColor"]?.map(\.id) == noseColors.map(\.id),
                  fields?["earColor"]?.first(where: { $0.id == "charcoal" })?.colors?.count == 1,
                  noseColors.contains(where: { $0.id == "natural" }),
                  noseColors.contains(where: { $0.id == "plum" && $0.colors?.count == 1 }) else {
                fputs("Workbench could not load the ear, nose and mouth appearance menus\n", stderr)
                exit(1)
            }
        }
        let breeds = catalog.presets.filter { $0.frame == "CAT" }
        guard !breeds.isEmpty, breeds.allSatisfy({ breed in
            guard let palette = breed.palette,
                  let swatch = catalog.fieldsByFrame["CAT"]?["palette"]?.first(where: { $0.id == palette })?.colors,
                  !swatch.isEmpty else { return false }
            return catalog.matchingPreset(["frame": "CAT", "palette": palette, "name": "预览"]) == breed.id
        }) else {
            fputs("Workbench could not restore a cat breed and its swatch from the catalog\n", stderr)
            exit(1)
        }
        // Switching a breed restores its complete default appearance, even
        // after the previous selection used a different coat combination.
        let pupilChoices = [
            "leftEyeColor": "blue", "leftInnerPupil": "none", "leftInnerEyeColor": "amber",
            "rightEyeColor": "green", "rightInnerPupil": "round", "rightInnerEyeColor": "rose"
        ]
        workbenchState.appearance["coat"] = "honey"
        workbenchState.appearance["leftEyeColor"] = "violet"
        choosePreset("preset_cat_calico") { [weak self] selected in
            guard let self, selected, self.workbenchState.appearance["frame"] == "CAT",
                  self.workbenchState.appearance["palette"] == "CC03",
                  self.workbenchState.appearance["coat"] == "native",
                  self.workbenchState.appearance["bodyPattern"] == "native",
                  self.workbenchState.appearance["pattern"] == "P00",
                  self.workbenchState.appearance["leftEyeColor"] == nil else {
                fputs("Workbench did not restore the cat breed's default appearance\n", stderr)
                exit(1)
            }
            self.workbenchState.appearance["palette"] = "CC02"
            self.workbenchState.appearance["coat"] = "honey"
            self.workbenchState.appearance["bodyPattern"] = "classic"
            self.workbenchState.appearance["eye"] = "Y03"
            self.workbenchState.appearance["innerPupil"] = "round"
            self.workbenchState.appearance["innerEyeColor"] = "amber"
            self.workbenchState.appearance["eyeColor"] = "violet"
            for (key, value) in pupilChoices { self.workbenchState.appearance[key] = value }
            self.workbenchState.appearance["ear"] = "CE05"
            self.workbenchState.appearance["earColor"] = "charcoal"
            self.workbenchState.appearance["nose"] = "NO08"
            self.workbenchState.appearance["noseColor"] = "plum"
            self.workbenchState.appearance["mouth"] = "CN09"
            self.workbenchState.appearance["pattern"] = "P06"
            self.applyDraft { applied in
                guard applied, self.appliedConfig?["palette"] as? String == "CC02",
                      self.appliedConfig?["coat"] as? String == "honey",
                      self.appliedConfig?["bodyPattern"] as? String == "classic",
                      self.appliedConfig?["eye"] as? String == "Y03",
                      self.appliedConfig?["innerPupil"] as? String == "round",
                      self.appliedConfig?["innerEyeColor"] as? String == "amber",
                      self.appliedConfig?["eyeColor"] as? String == "violet",
                      self.appliedConfig?["ear"] as? String == "CE05",
                      self.appliedConfig?["earColor"] as? String == "charcoal",
                      self.appliedConfig?["nose"] as? String == "NO08",
                      self.appliedConfig?["noseColor"] as? String == "plum",
                      self.appliedConfig?["mouth"] as? String == "CN09",
                      self.appliedConfig?["pattern"] as? String == "P06",
                      pupilChoices.allSatisfy({ self.appliedConfig?[$0.key] as? String == $0.value }) else {
                    fputs("Workbench could not apply the configured cat\n", stderr)
                    exit(1)
                }
                self.web.callAsyncJavaScript(
                    "await window.pet.check(); return await window.pet.checkCat()",
                    arguments: [:], in: nil, in: .page
                ) { result in
                    guard case .success(let value) = result, value as? String == "cat actions ready" else {
                        fputs("Cat renderer failed: \(result)\n", stderr)
                        exit(1)
                    }
                    self.checkWorkbenchReopen()
                    guard pupilChoices.allSatisfy({ self.workbenchState.appearance[$0.key] == $0.value }) else {
                        fputs("Independent pupil settings did not survive reopening the workbench\n", stderr)
                        exit(1)
                    }
                    guard self.verifyGazeTracking() else {
                        fputs("Mouse movement did not produce the expected gaze offsets\n", stderr)
                        exit(1)
                    }
                    guard self.verifyPetEdgeDragging() else {
                        fputs("Dragging did not snap to the screen edge or restore the full pet\n", stderr)
                        exit(1)
                    }
                    guard self.verifyReminderPanel() else {
                        fputs("Reminder card failed to position above the pet\n", stderr)
                        exit(1)
                    }
                    guard self.verifyFocusSession() else {
                        fputs("Focus session did not run through focus, break and dismissal\n", stderr)
                        exit(1)
                    }
                    guard self.verifyWeather() else {
                        fputs("Weather advice or card layout failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyMusic() else {
                        fputs("Music detection or badge layout failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyClipboard() else {
                        fputs("Clipboard history failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyTranslation() else {
                        fputs("Translation helpers or panels failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyChatBrain() else {
                        fputs("Chat routing or memory failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyTrash() else {
                        fputs("Trash move failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyQuickBar() else {
                        fputs("Quick bar hover or layout failed\n", stderr)
                        exit(1)
                    }
                    guard self.verifyFileActions() else {
                        fputs("File actions failed\n", stderr)
                        exit(1)
                    }
                    self.refreshPreview()
                    self.capturePixelPreview { snapshot in
                        guard let snapshot, self.verifyPixelEditor(png: snapshot.png) else {
                            fputs("Pixel editor failed to load or edit the workbench preview\n", stderr)
                            exit(1)
                        }
                        self.verifySavedPixelEdits(snapshot: snapshot) { saved in
                            guard saved else {
                                fputs("Pixel editor failed to save and read part-based pixel edits\n", stderr)
                                exit(1)
                            }
                            print("PASS: native workbench close and reopen, dog and cat configuration, cat recolor, face and eyes, walk mirror, edge dragging, typing and motion transitions, focus and break session, weather advice and card, music detection, clipboard history, translation panels, chat routing, trash, quick bar, file actions, pixel editor preview and part-based preset storage")
                            NSApp.terminate(nil)
                        }
                    }
                }
            }
        }
    }

    private func verifyReminderPanel() -> Bool {
        let savedItems = reminderList.items
        let savedAdding = reminderList.isAdding
        let savedDraft = reminderList.draft
        reminderList.items = ["自检提醒 A", "自检提醒 B"]
        showReminders()
        defer {
            hideReminderInput()
            hideReminders()
            reminderList.items = savedItems
            reminderList.isAdding = savedAdding
            reminderList.draft = savedDraft
            if !savedItems.isEmpty { showReminders() }
        }
        guard let list = reminderWindow, list.frame.minY >= panel.frame.maxY - 1, list.frame.height >= 60 else {
            return false
        }
        showReminderInput()
        guard let input = reminderInputWindow, input.frame.maxY <= panel.frame.minY + 1,
              input.frame.width >= 200 else {
            return false
        }
        return true
    }

    private func verifyCustomPresetMigration() -> Bool {
        let files = FileManager.default
        let temp = files.temporaryDirectory.appendingPathComponent("pet-presets-\(UUID().uuidString)")
        defer { try? files.removeItem(at: temp) }
        let legacy = temp.appendingPathComponent("legacy")
        let library = temp.appendingPathComponent("custom")
        var cells = [UInt32](repeating: 0, count: PixelEditorModel.side * PixelEditorModel.side)
        cells[0] = 0xFFEFB373
        let source = Data("{\"frame\":0}".utf8)
        guard let old = PixelPresetStore.save(name: "猫猫", cells: cells, source: nil, in: legacy),
              let cached = try? PixelPresetStore.read(old),
              let oldConflict = PixelPresetStore.save(name: "同名", cells: cells, source: source, in: legacy) else {
            return false
        }
        cells[0] = 0xFF63ADDF
        guard let current = PixelPresetStore.save(name: "同名", cells: cells, source: nil, in: library),
              let currentBytes = try? Data(contentsOf: current) else { return false }
        do {
            // An older checkout build could leave a private copy without a manifest entry.
            let cachedURL = library.appendingPathComponent(old.lastPathComponent)
            try PixelPresetStore.write(PixelEditSnapshot(png: cached.png, source: source), to: cachedURL)
            let oldBytes = try Data(contentsOf: oldConflict)
            try PixelPresetStore.migrateLegacyPresets(from: legacy, to: library)
            try PixelPresetStore.migrateLegacyPresets(from: legacy, to: library)
            let list = PixelPresetStore.load(from: library)
            let imported = try PixelPresetStore.read(cachedURL)
            guard list.count == 3, imported.png == cached.png, imported.source == source,
                  try Data(contentsOf: current) == currentBytes,
                  let conflict = list.first(where: { $0.id == "同名-legacy-1" }),
                  try Data(contentsOf: conflict.url) == oldBytes,
                  !files.fileExists(atPath: legacy.path),
                  try files.contentsOfDirectory(atPath: temp.appendingPathComponent("legacy-custom-backups").path).count == 1
            else { return false }
            return PixelPresetStore.delete(conflict) && PixelPresetStore.load(from: library).count == 2
        } catch {
            fputs("Custom preset migration error: \(error)\n", stderr)
            return false
        }
    }

    private func verifyPixelEditor(png: Data) -> Bool {
        guard let model = PixelEditorModel(previewPNG: png),
              let firstPainted = model.cells.firstIndex(where: { $0 != 0 }),
              model.cells.prefix(8).allSatisfy({ $0 == 0 }) else { return false }
        let original = model.cells
        let side = PixelEditorModel.side

        guard model.brushSize == 8, model.brushShape == .square, model.pixelChanges.isEmpty else { return false }
        if original[firstPainted] >> 24 == 0xFF {
            model.brushSize = 1
            model.chooseColor(original[firstPainted] & 0xFFFFFF)
            model.paint(column: firstPainted % side, row: firstPainted / side)
            model.endStroke()
            guard model.cells == original,
                  model.pixelChanges == [[UInt32(firstPainted), original[firstPainted]]] else { return false }
            model.undo()
            guard model.cells == original, model.pixelChanges.isEmpty else { return false }
        }
        model.brushSize = 1
        model.isErasing = true
        model.paint(column: firstPainted % side, row: firstPainted / side)
        model.endStroke()
        var expected = original
        expected[firstPainted] = 0
        guard model.cells == expected, model.pixelChanges == [[UInt32(firstPainted), 0]] else { return false }
        model.undo()
        guard model.cells == original, model.pixelChanges.isEmpty else { return false }

        model.chooseColor(0xEFB373)
        model.paint(column: 0, row: 0)
        model.paint(column: 7, row: 0)
        model.endStroke()
        expected = original
        expected.replaceSubrange(0..<8, with: repeatElement(0xFFEFB373, count: 8))
        guard model.cells == expected,
              model.pixelChanges == (0..<8).map({ [UInt32($0), 0xFFEFB373] }),
              let exported = PixelPresetStore.renderPNG(cells: model.cells),
              let bitmap = NSBitmapImageRep(data: exported),
              bitmap.pixelsWide == side, bitmap.pixelsHigh == side,
              let loaded = PixelEditorModel(previewPNG: exported),
              loaded.cells == expected else { return false }

        model.undo()
        guard model.cells == original, model.pixelChanges.isEmpty else { return false }
        model.brushSize = 5
        for shape in PixelBrushShape.allCases {
            model.brushShape = shape
            model.chooseColor(0x63ADDF)
            model.paint(column: 0, row: 0)
            model.endStroke()
            expected = original
            for row in 0...2 {
                let start = row * side
                expected.replaceSubrange(start..<(start + 3), with: repeatElement(0xFF63ADDF, count: 3))
            }
            if shape == .round { expected[2 * side + 2] = original[2 * side + 2] }
            guard model.cells == expected else { return false }
            model.isErasing = true
            model.paint(column: 0, row: 0)
            model.endStroke()
            guard model.cells == original else { return false }
            model.undo()
            guard model.cells == expected else { return false }
            model.undo()
            guard model.cells == original else { return false }
        }

        model.clear()
        let erased = original.indices.compactMap { original[$0] != 0 ? [UInt32($0), 0] : nil }
        guard model.cells.allSatisfy({ $0 == 0 }), model.pixelChanges == erased else { return false }
        model.undo()
        return model.cells == original && model.pixelChanges.isEmpty
    }

    private func verifySavedPixelEdits(snapshot: PixelEditSnapshot, completion: @escaping (Bool) -> Void) {
        let files = FileManager.default
        let folder = files.temporaryDirectory.appendingPathComponent("pet-ink-\(UUID().uuidString)")
        guard snapshot.source != nil, let model = makePixelEditor(snapshot: snapshot) else {
            completion(false)
            return
        }
        model.name = "test-erased-cat"
        model.clear()
        model.save(in: folder) { url in
            defer { try? files.removeItem(at: folder) }
            guard let url, PixelPresetStore.load(from: folder).first?.url == url,
                  let saved = try? PixelPresetStore.read(url),
                  let cells = PixelPresetStore.pixels(from: saved.png), cells.allSatisfy({ $0 == 0 }),
                  let data = saved.source,
                  let source = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
                  let edits = source["pixelEdits"] as? [String: Any],
                  let parts = edits["parts"] as? [String: Any], !parts.isEmpty else {
                completion(false)
                return
            }
            self.applyCustomOverlay(saved, in: self.preview) { selection in
                guard let json = selection?["source"] as? String,
                      let loaded = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any],
                      let loadedEdits = loaded["pixelEdits"] as? [String: Any],
                      NSDictionary(dictionary: edits).isEqual(to: loadedEdits) else {
                    completion(false)
                    return
                }
                self.capturePixelPreview { reopened in
                    let reopenedPixels = reopened.flatMap { PixelPresetStore.pixels(from: $0.png) }
                    completion(reopenedPixels?.allSatisfy { $0 == 0 } == true)
                }
            }
        }
    }

    private func verifyFileActions() -> Bool {
        guard let organization = makeMenu().item(withTitle: "整理文件")?.submenu,
              organization.items.map(\.action) == [#selector(organizeDesktopFiles), #selector(chooseFileOrganizationFolder)]
        else { return false }
        let folder = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("pet-file-test")
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)

        // zip
        let text = folder.appendingPathComponent("sample.txt")
        try? "hello".write(to: text, atomically: true, encoding: .utf8)
        guard let archive = FileTools.zip(text),
              FileManager.default.fileExists(atPath: archive.path),
              (try? Data(contentsOf: archive))?.count ?? 0 > 0 else { return false }

        // text → pdf
        guard let pdf = FileTools.convert(text, to: .pdf),
              let pdfData = try? Data(contentsOf: pdf), pdfData.count > 4 else { return false }
        guard String(data: pdfData.prefix(4), encoding: .ascii) == "%PDF" else { return false }

        // png → jpg (draw with CGContext so it also works headless)
        guard let context = CGContext(
            data: nil,
            width: 32,
            height: 32,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return false }
        context.setFillColor(NSColor.systemRed.cgColor)
        context.fill(CGRect(x: 0, y: 0, width: 32, height: 32))
        guard let cgImage = context.makeImage(),
              let pngData = NSBitmapImageRep(cgImage: cgImage).representation(using: .png, properties: [:]) else { return false }
        let png = folder.appendingPathComponent("shot.png")
        try? pngData.write(to: png)
        guard FileKind.of(png) == .image,
              FileTools.formats(for: .image).count == 2,
              let jpg = FileTools.convert(png, to: .jpg),
              let jpgData = try? Data(contentsOf: jpg), jpgData.count > 2 else { return false }
        guard jpgData[0] == 0xFF, jpgData[1] == 0xD8 else { return false }

        // panel
        dropChoiceURL = text
        dropChoiceKind = .document
        showDropChoices()
        guard let bar = dropChoiceWindow, bar.isVisible,
              !bar.frame.intersects(panel.frame.insetBy(dx: -1, dy: -1)) else { return false }
        hideDropChoice()
        guard !(dropChoiceWindow?.isVisible ?? false) else { return false }

        try? FileManager.default.removeItem(at: folder)
        return true
    }

    private func verifyQuickBar() -> Bool {
        quickBarTick(at: NSPoint(x: panel.frame.midX, y: panel.frame.midY))
        guard let bar = quickBarWindow, bar.isVisible,
              !bar.frame.intersects(panel.frame) else { return false }
        guard bar.frame.maxY <= panel.frame.minY + 1 else { return false }
        let far = NSPoint(x: 4, y: 4)
        quickBarTick(at: far)
        RunLoop.main.run(until: Date().addingTimeInterval(0.45))
        quickBarTick(at: far)
        guard !(quickBarWindow?.isVisible ?? false) else { return false }
        guard panel.frame.origin.y == 58 + (NSScreen.main?.visibleFrame.minY ?? 0) else {
            // The nudge must be undone when the bar hides.
            return abs(panel.frame.origin.y - (58 + (NSScreen.main?.visibleFrame.minY ?? 0))) < 1
        }
        return true
    }

    private func verifyTrash() -> Bool {
        let folder = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("pet-trash-test")
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let file = folder.appendingPathComponent("drop-me-\(UUID().uuidString).txt")
        try? "bye".write(to: file, atomically: true, encoding: .utf8)
        let outcome = TrashService.trash([file])
        guard outcome.trashed == [file], outcome.failed.isEmpty,
              !FileManager.default.fileExists(atPath: file.path) else { return false }

        let missing = folder.appendingPathComponent("does-not-exist-\(UUID().uuidString).txt")
        let failure = TrashService.trash([missing])
        guard failure.trashed.isEmpty, failure.failed == [missing] else { return false }

        showTrashToast("已移到废纸篓：测试", tone: .normal, autoHide: nil)
        guard let toast = trashToastWindow, toast.isVisible else { return false }
        hideTrashToast()
        guard !(trashToastWindow?.isVisible ?? false) else { return false }
        return true
    }

    private func verifyChatBrain() -> Bool {
        guard ChatBrain.keywordDecision("今天北京天气怎么样") == .search,
              ChatBrain.keywordDecision("今天有什么新闻") == .search,
              ChatBrain.keywordDecision("股票怎么样") == .search,
              ChatBrain.keywordDecision("你叫什么") == nil,
              ChatBrain.keywordDecision("我喜欢喝什么") == nil else { return false }

        let path = NSTemporaryDirectory() + "pet-memory-test-\(UUID().uuidString).sqlite"
        try? FileManager.default.removeItem(atPath: path)
        let memory = PetMemory(path: path)
        memory.remember(from: "我叫小林，我喜欢喝美式")
        memory.remember(from: "我每天七点起床")
        guard memory.value(for: .name) == "小林",
              memory.value(for: .likes)?.contains("美式") == true,
              memory.value(for: .routine)?.contains("起床") == true else { return false }
        let summary = memory.summary()
        guard summary.contains("名字"), summary.contains("美式"), summary.contains("起床") else { return false }
        try? FileManager.default.removeItem(atPath: path)
        return true
    }

    private func verifyTranslation() -> Bool {
        guard SelectionText.isEnglish("Hello world, this is a test."),
              SelectionText.isEnglish("The quick brown fox"),
              !SelectionText.isEnglish("你好，世界"),
              !SelectionText.isEnglish("Hello 世界"),
              !SelectionText.isEnglish("12345"),
              !SelectionText.isEnglish("a") else { return false }

        let long = String(repeating: "a", count: 600)
        let prepared = SelectionText.prepare(long)
        guard prepared.text.count == SelectionText.maxLength, prepared.truncated else { return false }
        let short = SelectionText.prepare("short text")
        guard short.text == "short text", !short.truncated else { return false }

        let point = NSPoint(x: panel.frame.midX, y: panel.frame.midY)
        pendingSelection = "Hello"
        showTranslateButton(at: point)
        guard let button = translateButtonWindow, button.isVisible else { return false }
        hideTranslateButton()
        guard !(translateButtonWindow?.isVisible ?? false) else { return false }

        showTranslation(.result(original: "Hello world", translated: "你好，世界", truncated: false))
        guard let bubble = translationWindow, bubble.isVisible,
              !bubble.frame.intersects(panel.frame.insetBy(dx: -1, dy: -1)) else { return false }
        hideTranslation()
        guard !(translationWindow?.isVisible ?? false) else { return false }
        return true
    }

    private func verifyClipboard() -> Bool {
        let board = NSPasteboard.withUniqueName()
        let store = ClipboardStore()

        board.clearContents()
        board.setString("第一段文案", forType: .string)
        store.poll(board)
        guard store.items.first?.text == "第一段文案" else { return false }

        board.clearContents()
        board.setString("第二段", forType: .string)
        store.poll(board)
        guard store.items.count == 2, store.items.first?.text == "第二段" else { return false }

        store.add("第一段文案")
        guard store.items.count == 2, store.items.first?.text == "第一段文案" else { return false }

        for index in 0..<20 { store.add("item \(index)") }
        guard store.items.count == ClipboardStore.limit else { return false }

        guard let removable = store.items.first else { return false }
        let beforeRemove = store.items.count
        store.remove(removable)
        guard store.items.count == beforeRemove - 1,
              !store.items.contains(where: { $0.id == removable.id }) else { return false }

        board.clearContents()
        board.setString("secret", forType: .string)
        board.setString("1", forType: NSPasteboard.PasteboardType("org.nspasteboard.ConcealedType"))
        let before = store.items.count
        store.poll(board)
        guard store.items.count == before else { return false }

        if let workbench = workbenchWindow, workbench.isVisible {
            workbench.orderOut(nil)
            showClipboard()
            RunLoop.main.run(until: Date().addingTimeInterval(0.4))
            let stayedHidden = !workbench.isVisible
            hideClipboard()
            workbench.orderFront(nil)
            guard stayedHidden else { return false }
        }

        showClipboard()
        guard let panel = clipboardWindow, panel.isVisible,
              !panel.frame.intersects(self.panel.frame.insetBy(dx: -1, dy: -1)) else { return false }
        hideClipboard()
        guard !(clipboardWindow?.isVisible ?? false) else { return false }
        return true
    }

    private func verifyMusic() -> Bool {
        guard MusicCatalog.name(bundleID: "com.tencent.QQMusicMac", processName: nil) == "QQ音乐",
              MusicCatalog.name(bundleID: "com.apple.Music", processName: nil) == "Apple Music",
              MusicCatalog.name(bundleID: "com.google.Chrome", processName: "Google Chrome") == nil else {
            return false
        }

        let watcher = MusicWatcher(enabled: true)

        var changes: [String?] = []
        watcher.onChange = { changes.append($0) }
        watcher.evaluate(names: ["Apple Music"])
        guard watcher.activeApp == nil else { return false }
        watcher.evaluate(names: ["Apple Music"])
        guard watcher.activeApp == "Apple Music" else { return false }
        watcher.evaluate(names: [])
        watcher.evaluate(names: [])
        guard watcher.activeApp == nil, changes == ["Apple Music", nil] else { return false }

        showMusicBadge(app: "QQ音乐")
        guard let badge = musicWindow, badge.isVisible else { return false }
        guard !badge.frame.intersects(panel.frame.insetBy(dx: -1, dy: -1)) else { return false }
        hideMusicBadge()
        guard !(musicWindow?.isVisible ?? false) else { return false }
        return true
    }

    private func verifyWeather() -> Bool {
        let cold = WeatherSnapshot(
            city: "北京", temperature: 2, apparent: -3, humidity: 20,
            wind: 5, rainChance: 10, low: -6, high: 4, code: 0
        )
        let coldAdvice = WeatherRules.advice(for: cold)
        guard coldAdvice.contains(where: { $0.contains("羽绒服") }),
              coldAdvice.contains(where: { $0.contains("温差") }),
              coldAdvice.contains(where: { $0.contains("多喝热水") }) else { return false }

        let hot = WeatherSnapshot(
            city: "广州", temperature: 30, apparent: 32, humidity: 88,
            wind: 3, rainChance: 60, low: 28, high: 34, code: 3
        )
        let hotAdvice = WeatherRules.advice(for: hot)
        guard hotAdvice.contains(where: { $0.contains("伞") }),
              hotAdvice.contains(where: { $0.contains("闷热") }) else { return false }

        let mild = WeatherSnapshot(
            city: "上海", temperature: 21, apparent: 21, humidity: 50,
            wind: 8, rainChance: 5, low: 19, high: 23, code: 1
        )
        guard WeatherRules.advice(for: mild) == ["舒适，正常穿就好。"] else { return false }

        showWeatherCard(snapshot: mild, failure: nil)
        guard let card = weatherWindow, card.isVisible,
              abs(card.frame.midX - panel.frame.midX) <= 1,
              makeMenu().items.contains(where: { item in
                  item.title == "天气" && (item.submenu?.items.contains { $0.title == "看看天气" } ?? false)
              }) else { return false }
        hideWeatherCard()
        guard !(weatherWindow?.isVisible ?? false) else { return false }
        return true
    }

    private func verifyFocusSession() -> Bool {
        guard focus.phase == .idle else { return false }
        guard makeMenu().items.contains(where: { $0.title == "开始专注" }) else { return false }
        focus.startFocus()
        guard focus.phase == .focusing,
              focus.remaining == focus.focusMinutes * 60,
              let card = focusWindow, card.isVisible,
              card.frame.minY >= panel.frame.maxY - 1,
              makeMenu().items.contains(where: { $0.title == "结束专注" }) else {
            return false
        }
        guard let resting = focusWindow,
              abs(resting.frame.midX - panel.frame.midX) <= 1 else { return false }

        focus.togglePin()
        guard focus.pinned,
              makeMenu().items.contains(where: { $0.title == "取消钉住" }) else { return false }
        focus.togglePin()
        guard !focus.pinned else { return false }

        // Cards follow the pet inside the same drag event, not on the async
        // didMove notification. Measured away from the screen edge, where the
        // card is clamped on purpose so it stays visible.
        if let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame {
            let petOrigin = panel.frame.origin
            panel.setFrameOrigin(NSPoint(
                x: screen.midX - panel.frame.width / 2,
                y: screen.minY + 120
            ))
            web.onMove()
            guard let centred = focusWindow else {
                panel.setFrameOrigin(petOrigin)
                return false
            }
            let before = centred.frame.origin.x
            panel.setFrameOrigin(NSPoint(x: panel.frame.origin.x - 40, y: panel.frame.origin.y))
            web.onMove()
            let tracked = abs(centred.frame.origin.x - (before - 40)) <= 1
            panel.setFrameOrigin(petOrigin)
            web.onMove()
            guard tracked else { return false }
        }

        focus.hideCard()
        guard !card.isVisible else { return false }
        focus.revealCard()
        guard let shown = focusWindow, shown.isVisible else { return false }
        let full = focus.remaining
        focus.togglePause()
        focus.tick(seconds: 60)
        guard focus.remaining == full else { return false }
        focus.togglePause()
        focus.extend(minutes: 5)
        guard focus.remaining == full + 5 * 60 else { return false }
        focus.tick(seconds: focus.remaining)
        guard focus.phase == .idle, focus.result == .focusFinished,
              let finished = focusWindow, finished.isVisible else {
            return false
        }
        focus.startBreak()
        guard focus.phase == .resting, focus.remaining == focus.breakMinutes * 60 else { return false }
        focus.tick(seconds: focus.remaining)
        guard focus.phase == .idle, focus.result == .breakFinished else { return false }
        focus.dismiss()
        guard focus.result == nil, !(focusWindow?.isVisible ?? false) else { return false }

        let savedMinutes = focus.focusMinutes
        defer { focus.setFocusMinutes(savedMinutes) }
        focus.setFocusMinutes(37)
        guard focus.focusMinutes == 37 else { return false }
        focus.startFocus()
        guard focus.remaining == 37 * 60 else { return false }
        focus.togglePin()
        focus.stop()
        guard !focus.pinned else { return false }
        focus.setFocusMinutes(0)
        guard focus.focusMinutes == FocusModel.minuteRange.lowerBound else { return false }
        focus.setFocusMinutes(9_999)
        guard focus.focusMinutes == FocusModel.minuteRange.upperBound else { return false }
        guard makeMenu().items.contains(where: { item in
            item.title == "开始专注" && (item.submenu?.items.contains { $0.title == "自定义…" } ?? false)
        }) else { return false }

        showFocusMinutesInput()
        guard focusMinutesWindow?.isVisible ?? false else { return false }
        hideFocusMinutesInput()
        guard !(focusMinutesWindow?.isVisible ?? false) else { return false }
        return true
    }

    private func checkWorkbenchReopen() {
        guard let window = workbenchWindow, NSApp.activationPolicy() == .regular else {
            fputs("Desktop pet does not have a regular application window\n", stderr)
            exit(1)
        }
        window.makeKeyAndOrderFront(nil)
        window.performClose(nil)
        guard !window.isVisible, !applicationShouldTerminateAfterLastWindowClosed(NSApp),
              applicationShouldHandleReopen(NSApp, hasVisibleWindows: false),
              window.isVisible else {
            fputs("Desktop workbench could not reopen after closing\n", stderr)
            exit(1)
        }
    }

    // MARK: Eye tracking

    private func setEyeFollow(_ enabled: Bool) {
        eyeFollow = enabled
        UserDefaults.standard.set(enabled, forKey: "shibaEyeFollow")
        // Tracking mode can change even when the pointer is at the neutral position.
        petGaze = nil
        previewGaze = nil
        if enabled {
            pollGaze()
        } else {
            if ready { web.evaluateJavaScript("window.pet.gaze(0, 0)") }
            if previewReady { preview.evaluateJavaScript("window.pet.gaze(0, 0)") }
        }
    }

    private func startGazeTimer() {
        guard gazeTimer == nil else { return }
        // Common mode keeps the glints tracking while windows are being dragged.
        let timer = Timer(timeInterval: 1.0 / 60.0, repeats: true) { [weak self] _ in
            self?.pollGaze()
        }
        RunLoop.main.add(timer, forMode: .common)
        gazeTimer = timer
    }

    private func pollGaze() {
        guard eyeFollow else { return }
        let mouse = NSEvent.mouseLocation
        if ready, panel.isVisible {
            sendGaze(gazeOffset(for: web, mouse: mouse), to: web, last: &petGaze)
        }
        if previewReady, preview.window?.isVisible == true {
            sendGaze(gazeOffset(for: preview, mouse: mouse), to: preview, last: &previewGaze)
        }
    }

    private func sendGaze(_ offset: (x: Int, y: Int), to view: WKWebView, last: inout (x: Int, y: Int)?) {
        guard last?.x != offset.x || last?.y != offset.y else { return }
        last = offset
        view.evaluateJavaScript("window.pet.trackPointer(\(offset.x), \(offset.y))")
    }

    private func gazeOffset(for view: NSView, mouse: NSPoint) -> (x: Int, y: Int) {
        guard let window = view.window else { return (0, 0) }
        let frameOnScreen = window.convertToScreen(view.convert(view.bounds, to: nil))
        if view === web, let edge = edgePlacement?.edge {
            return Self.gazeOffset(for: mouse, in: frameOnScreen, eyes: edge.eyeCenter, units: edge.size(for: 160))
        }
        return Self.gazeOffset(for: mouse, in: frameOnScreen)
    }

    private static func gazeOffset(for mouse: NSPoint, in frameOnScreen: NSRect,
                                   eyes: NSPoint = NSPoint(x: 75.0 / 160, y: 58.0 / 160),
                                   units: NSSize = NSSize(width: 160, height: 160)) -> (x: Int, y: Int) {
        guard frameOnScreen.width > 0, frameOnScreen.height > 0 else { return (0, 0) }
        let normalizedX = (mouse.x - frameOnScreen.minX) / frameOnScreen.width
        let normalizedY = (mouse.y - frameOnScreen.minY) / frameOnScreen.height
        // Keep the angle from the eyes and cap only the length of that vector.
        let dx = (normalizedX - eyes.x) * units.width
        let dy = (1 - normalizedY - eyes.y) * units.height
        let distance = hypot(dx, dy)
        guard distance > 3 else { return (0, 0) }
        let factor = 100 * min(1, (distance - 3) / 32) / distance
        return (Int((dx * factor).rounded()), Int((dy * factor).rounded()))
    }

    private func verifyGazeTracking() -> Bool {
        let frame = NSRect(x: 0, y: 0, width: 160, height: 160)
        let center = Self.gazeOffset(for: NSPoint(x: 75, y: 102), in: frame)
        let nearLeft = Self.gazeOffset(for: NSPoint(x: 68, y: 102), in: frame)
        let shallow = Self.gazeOffset(for: NSPoint(x: 120, y: 115), in: frame)
        let steep = Self.gazeOffset(for: NSPoint(x: 88, y: 147), in: frame)
        let farLeft = Self.gazeOffset(for: NSPoint(x: 28, y: 102), in: frame)
        let nearRight = Self.gazeOffset(for: NSPoint(x: 82, y: 102), in: frame)
        return center.x == 0 && center.y == 0
            && nearLeft.x < 0 && nearLeft.y == 0
            && shallow.x > -shallow.y && shallow.y < 0
            && steep.x > 0 && steep.x < -steep.y
            && farLeft.x == -100 && farLeft.y == 0 && nearRight.x > 0
    }

    // MARK: Reminder

    func windowDidResignKey(_ notification: Notification) {
        guard let window = notification.object as? NSWindow else { return }
        if window === clipboardWindow {
            hideClipboard()
        } else if window === weatherCityWindow {
            hideWeatherCityInput()
        } else if window === focusMinutesWindow {
            hideFocusMinutesInput()
        } else if window === reminderInputWindow {
            hideReminderInput()
        } else if window === reminderWindow, reminderList.isAdding {
            reminderList.isAdding = false
            reminderList.draft = ""
        }
    }

    private func dismissTransientReminderUI(at point: NSPoint) {
        if let input = reminderInputWindow, input.isVisible, !input.frame.contains(point) {
            hideReminderInput()
        }
        if reminderList.isAdding, let card = reminderWindow, card.isVisible, !card.frame.contains(point) {
            reminderList.isAdding = false
            reminderList.draft = ""
        }
    }

    private func loadReminders() {
        let defaults = UserDefaults.standard
        if let stored = defaults.stringArray(forKey: "shibaReminders") {
            reminderList.items = stored
        } else if let legacy = defaults.string(forKey: "shibaReminder"), !legacy.isEmpty {
            reminderList.items = [legacy]
            defaults.removeObject(forKey: "shibaReminder")
            saveReminders()
        }
    }

    private func saveReminders() {
        UserDefaults.standard.set(reminderList.items, forKey: "shibaReminders")
    }

    @objc private func addReminder() {
        if reminderList.items.isEmpty {
            reminderInput.text = ""
            showReminderInput()
        } else {
            beginInlineAdd()
        }
    }

    @objc private func clearReminders() {
        guard !reminderList.items.isEmpty else { return }
        reminderList.items.removeAll()
        reminderList.isAdding = false
        reminderList.draft = ""
        saveReminders()
        hideReminderInput()
        hideReminders()
    }

    private func appendReminder(_ text: String) {
        let value = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(120))
        guard !value.isEmpty else { return }
        reminderList.items.append(value)
        saveReminders()
        showReminders()
    }

    private func submitReminder() {
        let value = reminderInput.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return }
        hideReminderInput()
        appendReminder(value)
    }

    private func closeReminder(at index: Int) {
        guard reminderList.items.indices.contains(index) else { return }
        reminderList.items.remove(at: index)
        saveReminders()
        if reminderList.items.isEmpty {
            reminderList.isAdding = false
            hideReminders()
        } else {
            showReminders()
        }
    }

    private func activateForPetUI() {
        let workbenchWasKey = workbenchWindow?.isKeyWindow ?? false
        suppressWorkbenchReopen = true
        NSApp.activate(ignoringOtherApps: true)
        if !workbenchWasKey, let window = workbenchWindow, window.isVisible {
            window.orderBack(nil)
        }
        // AppKit delivers the reopen event after the activation settles, which
        // can be later than a few hundred milliseconds; keep the suppression
        // through that window so the workbench stays closed.
        reopenSuppressionToken &+= 1
        let token = reopenSuppressionToken
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            guard let self, self.reopenSuppressionToken == token else { return }
            self.suppressWorkbenchReopen = false
        }
    }

    private func beginInlineAdd() {
        guard !reminderList.items.isEmpty else {
            reminderInput.text = ""
            showReminderInput()
            return
        }
        showReminders()
        reminderList.isAdding = true
        activateForPetUI()
        reminderWindow?.makeKeyAndOrderFront(nil)
    }

    private func showReminders() {
        guard !reminderList.items.isEmpty else {
            hideReminders()
            return
        }
        let host: ReminderHostingView<ReminderListCard>
        if let existing = reminderListHost {
            host = existing
        } else {
            let created = ReminderHostingView(rootView: ReminderListCard(
                model: reminderList,
                onAdd: { [weak self] text in self?.appendReminder(text) },
                onClose: { [weak self] index in self?.closeReminder(at: index) },
                onBeginAdd: { [weak self] in self?.beginInlineAdd() },
                onHeightChange: { [weak self] height in self?.resizeReminderList(height: height) }
            ))
            fitCardHost(created, fallback: NSSize(width: 240, height: 64))
            reminderListHost = created
            host = created
        }
        let panel = reminderWindow ?? makeReminderPanel()
        if reminderWindow == nil {
            panel.setContentSize(host.frame.size)
            panel.contentView = host
            reminderWindow = panel
        }
        panel.orderFrontRegardless()
        layoutReminder()
    }

    private func resizeReminderList(height: CGFloat) {
        guard let panel = reminderWindow, height > 1 else { return }
        guard abs(panel.frame.height - height) > 0.5 else { return }
        panel.setContentSize(NSSize(width: 240, height: height))
        layoutReminder()
    }

    private func hideReminders() {
        reminderWindow?.orderOut(nil)
        layoutFocusCard()
    }

    // MARK: Focus session

    private func focusSessionChanged() {
        status.menu = makeMenu()
        if focus.showsCard {
            showFocusCard()
        } else {
            hideFocusCard()
        }
    }

    private func showFocusCard() {
        let host: ReminderHostingView<FocusCard>
        if let existing = focusHost {
            host = existing
        } else {
            let created = ReminderHostingView(rootView: FocusCard(
                model: focus,
                onTogglePause: { [weak self] in self?.focus.togglePause() },
                onStop: { [weak self] in self?.focus.stop() },
                onStartBreak: { [weak self] in self?.focus.startBreak() },
                onStartFocus: { [weak self] in self?.focus.startFocus() },
                onSkipBreak: { [weak self] in self?.focus.skipBreak() },
                onDismiss: { [weak self] in self?.focus.dismiss() },
                onHideCard: { [weak self] in self?.focus.hideCard() },
                onTogglePin: { [weak self] in self?.focus.togglePin() },
                onHeightChange: { [weak self] height in self?.resizeFocusCard(height: height) }
            ))
            fitCardHost(created, fallback: NSSize(width: 252, height: 96))
            focusHost = created
            host = created
        }
        let card = focusWindow ?? makeReminderPanel()
        if focusWindow == nil {
            card.setContentSize(host.frame.size)
            card.contentView = host
            focusWindow = card
        }
        card.orderFrontRegardless()
        layoutFocusCard()
    }

    private func hideFocusCard() {
        focusWindow?.orderOut(nil)
    }

    private func resizeFocusCard(height: CGFloat) {
        guard let card = focusWindow, height > 1 else { return }
        guard abs(card.frame.height - height) > 0.5 else { return }
        card.setContentSize(NSSize(width: FocusCard.width, height: height))
        layoutFocusCard()
    }

    private func layoutFocusCard() {
        guard let card = focusWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        let stackTop = (reminderWindow?.isVisible ?? false)
            ? (reminderWindow?.frame.maxY ?? panel.frame.maxY)
            : panel.frame.maxY
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: stackTop + 8)
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    /// QA hook: `PET_CHAT_SMOKE=1` answers one question through the real local
    /// runtime and exits, so the bundled model can be checked headlessly.
    private func runChatSmokeIfRequested() {
        guard ProcessInfo.processInfo.environment["PET_CHAT_SMOKE"] == "1" else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            LocalRuntime.shared.prepare(progress: { print("SMOKE:", $0) }) { ok in
                print("SMOKE runtime ok:", ok, "url:", LocalRuntime.shared.baseURL.absoluteString,
                      "embedded:", LocalRuntime.shared.isEmbedded)
                OllamaClient.shared.check { running, model in
                    print("SMOKE running:", running, "model:", model ?? "nil")
                    OllamaClient.shared.chat(
                        messages: [["role": "user", "content": "你叫什么"]]
                    ) { answer in
                        print("SMOKE answer:", answer ?? "nil")
                        LocalRuntime.shared.shutdown()
                        NSApp.terminate(nil)
                    }
                }
            }
        }
    }

    /// A paw for the menu bar, drawn as a template image so macOS tints it for
    /// light and dark menu bars.
    private func makeStatusIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size)
        image.lockFocus()
        NSColor.black.setFill()
        NSBezierPath(ovalIn: NSRect(x: 4.1, y: 1.4, width: 9.8, height: 7.8)).fill()
        let toes: [(CGFloat, CGFloat, CGFloat)] = [
            (2.9, 9.7, 1.65),
            (6.6, 11.7, 1.8),
            (11.4, 11.7, 1.8),
            (15.1, 9.7, 1.65),
        ]
        for (x, y, radius) in toes {
            NSBezierPath(ovalIn: NSRect(
                x: x - radius, y: y - radius, width: radius * 2, height: radius * 2
            )).fill()
        }
        image.unlockFocus()
        image.isTemplate = true
        return image
    }

    // MARK: Pixel editor

    private func capturePixelPreview(completion: @escaping (PixelEditSnapshot?) -> Void) {
        preview.callAsyncJavaScript(
            """
            const {png, source} = await window.pet.previewSnapshot();
            return {png, source: source ? JSON.stringify(source) : null};
            """,
            arguments: [:], in: nil, in: .page
        ) { result in
            let prefix = "data:image/png;base64,"
            guard case .success(let value) = result, let snapshot = value as? [String: Any],
                  let url = snapshot["png"] as? String, url.hasPrefix(prefix),
                  let png = Data(base64Encoded: String(url.dropFirst(prefix.count))) else {
                completion(nil)
                return
            }
            let source = (snapshot["source"] as? String).map { Data($0.utf8) }
            completion(PixelEditSnapshot(png: png, source: source))
        }
    }

    private func makePixelEditor(snapshot: PixelEditSnapshot) -> PixelEditorModel? {
        PixelEditorModel(previewPNG: snapshot.png, source: snapshot.source) { [weak self] source, changes, completion in
            guard let self else { completion(nil); return }
            self.resolvePixelEdits(source: source, changes: changes, completion: completion)
        }
    }

    private func resolvePixelEdits(source: Data, changes: [[UInt32]], completion: @escaping (Data?) -> Void) {
        guard let json = String(data: source, encoding: .utf8),
              let encoded = try? JSONEncoder().encode(changes),
              let touches = String(data: encoded, encoding: .utf8) else {
            completion(nil)
            return
        }
        preview.callAsyncJavaScript(
            """
            const result = await window.pet.savePixelEdits(JSON.parse(source), JSON.parse(changes));
            return result?.pixelEdits ? JSON.stringify(result) : null;
            """,
            arguments: ["source": json, "changes": touches], in: nil, in: .page
        ) { result in
            guard case .success(let value) = result, let json = value as? String else {
                completion(nil)
                return
            }
            completion(Data(json.utf8))
        }
    }

    private func showPixelEditor() {
        if let window = pixelEditorWindow, window.isVisible {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        guard previewReady, !draftTemplate.isEmpty, !workbenchState.openingPixelEditor,
              !workbenchState.loadingCustom else { return }
        workbenchState.openingPixelEditor = true
        capturePixelPreview { [weak self] snapshot in
            guard let self else { return }
            self.workbenchState.openingPixelEditor = false
            guard self.workbenchWindow?.isVisible == true else { return }
            guard let snapshot, let model = self.makePixelEditor(snapshot: snapshot) else {
                self.workbenchState.message = "无法读取左侧预览，请重试"
                return
            }
            self.openPixelEditor(model)
        }
    }

    private func openPixelEditor(_ model: PixelEditorModel) {
        let host = NSHostingView(rootView: PixelEditorView(model: model, onSaved: { [weak self] _ in
            self?.reloadCustomPresets()
        }))
        host.frame = NSRect(origin: .zero, size: host.fittingSize)
        let window = NSWindow(
            contentRect: host.frame,
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        window.title = "像素编辑"
        window.contentView = host
        window.isReleasedWhenClosed = false
        window.center()
        pixelEditorWindow = window
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
    }

    private var savedCustomAppearances: [String: [String: Any]] {
        get { UserDefaults.standard.dictionary(forKey: "customSpriteAppearances") as? [String: [String: Any]] ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: "customSpriteAppearances") }
    }

    private func reloadCustomPresets() {
        workbenchState.customPresets = PixelPresetStore.load()
        if let selected = workbenchState.customSelected,
           !workbenchState.customPresets.contains(where: { $0.id == selected }) {
            clearCustomPreview()
        }
    }

    private func confirmDeleteCustom(_ preset: CustomPresetInfo) {
        let alert = NSAlert()
        alert.messageText = "删除自定义形象「\(preset.name)」？"
        alert.informativeText = "会一起删掉导出的 PNG 和预设记录，删除后无法恢复。"
        alert.alertStyle = .warning
        alert.addButton(withTitle: "删除")
        alert.addButton(withTitle: "取消")
        NSApp.activate(ignoringOtherApps: true)
        guard alert.runModal() == .alertFirstButtonReturn else { return }
        guard PixelPresetStore.delete(preset) else {
            workbenchState.message = "删除自定义形象失败"
            return
        }
        savedCustomAppearances.removeValue(forKey: preset.id)
        if UserDefaults.standard.string(forKey: "customSpriteName") == preset.id {
            storeAppliedCustom(nil)
            if ready { applyCustomOverlay(nil, in: web) }
        }
        reloadCustomPresets()
    }

    private func previewCustomPreset(_ preset: CustomPresetInfo) {
        guard previewReady, !workbenchState.applying else { return }
        guard let snapshot = try? PixelPresetStore.read(preset.url) else {
            workbenchState.message = "读取自定义形象失败"
            return
        }
        selectCustom(snapshot, id: preset.id, url: preset.url, label: preset.name)
    }

    private func selectCustom(
        _ snapshot: PixelEditSnapshot, id: String, url: URL, label: String? = nil, restoring: Bool = false
    ) {
        presetRequest += 1
        customSelectionRequest += 1
        let request = customSelectionRequest
        let saved = savedCustomAppearances[id]
        workbenchState.loadingCustom = true
        applyCustomOverlay(snapshot, in: preview, savedAppearance: saved) { [weak self] selection in
            guard let self, request == self.customSelectionRequest else { return }
            self.workbenchState.loadingCustom = false
            guard let reference = selection?["source"] as? String,
                  var config = selection?["appearance"] as? [String: Any] else {
                self.applyCustomOverlay(self.previewCustom?.snapshot, in: self.preview)
                self.workbenchState.message = "无法显示自定义形象"
                return
            }
            let resolved = PixelEditSnapshot(png: snapshot.png, source: Data(reference.utf8))
            if saved == nil,
               let legacy = UserDefaults.standard.dictionary(forKey: "customSpriteEyeColors")?[id] as? String {
                config["eyeColor"] = legacy
            }
            config["breed"] = saved?["breed"]
            let breed = self.matchingPreset(config)
            config["breed"] = breed
            config["name"] = self.appliedConfig?["name"] ?? config["name"]
            let chosen = CustomSelection(id: id, url: url, snapshot: resolved)
            self.previewCustom = chosen
            self.workbenchState.customSelected = id
            self.workbenchState.preset = breed
            self.setDraft(config)
            if restoring {
                self.appliedCustom = chosen
                self.appliedConfig = config
                self.configurePet(config)
                if self.ready { self.applyCustomOverlay(resolved, in: self.web) }
            }
            if let label { self.workbenchState.message = "正在预览：\(label)" }
        }
    }

    private func applyCustomOverlay(
        _ snapshot: PixelEditSnapshot?, in view: WKWebView,
        savedAppearance: [String: Any]? = nil,
        completion: (([String: Any]?) -> Void)? = nil
    ) {
        let png = snapshot.map { "data:image/png;base64,\($0.png.base64EncodedString())" }
        let source = snapshot?.source.flatMap { String(data: $0, encoding: .utf8) }
        view.callAsyncJavaScript(
            """
            let decoded;
            try { decoded = source ? JSON.parse(source) : null; } catch { decoded = null; }
            const reference = await window.pet.setCustom(png, decoded);
            if (!reference) return null;
            let appearance = window.pet.normalize(reference.config);
            if (savedAppearance) {
                try {
                    const saved = window.pet.normalize(savedAppearance);
                    if (saved.frame === 'CAT') appearance = saved;
                } catch {}
            }
            return {source: JSON.stringify(reference), appearance};
            """,
            arguments: ["png": png as Any? ?? NSNull(), "source": source as Any? ?? NSNull(),
                        "savedAppearance": savedAppearance as Any? ?? NSNull()],
            in: nil, in: .page
        ) { [weak self] result in
            switch result {
            case .success(let value): completion?(value as? [String: Any])
            case .failure:
                if let completion { completion(nil) }
                else { self?.workbenchState.message = "无法显示自定义形象" }
            }
        }
    }

    private func clearCustomPreview() {
        customSelectionRequest += 1
        previewCustom = nil
        workbenchState.customSelected = nil
        workbenchState.loadingCustom = false
        if previewReady { applyCustomOverlay(nil, in: preview) }
        workbenchState.message = "已取消预览叠加"
    }

    private func storeAppliedCustom(_ selection: CustomSelection?) {
        appliedCustom = selection
        guard !isTest else { return }
        UserDefaults.standard.set(selection?.url.path, forKey: "customSpritePath")
        UserDefaults.standard.set(selection?.id, forKey: "customSpriteName")
    }

    private func restoreCustomOverlay() {
        guard !isTest, let id = UserDefaults.standard.string(forKey: "customSpriteName") else { return }
        let previousPath = UserDefaults.standard.string(forKey: "customSpritePath").map { URL(fileURLWithPath: $0) }
        let listed = workbenchState.customPresets.first { $0.id == id }?.url
        let privateFolder = PixelPresetStore.folder.standardizedFileURL.path
        let privateCopy = previousPath.flatMap { url in
            url.standardizedFileURL.deletingLastPathComponent().path == privateFolder ? url : nil
        }
        guard let url = listed ?? privateCopy else { return }
        guard let snapshot = try? PixelPresetStore.read(url) else { return }
        UserDefaults.standard.set(url.path, forKey: "customSpritePath")
        selectCustom(snapshot, id: id, url: url, restoring: true)
    }

    // MARK: Quick bar

    private func startQuickBarTimer() {
        guard quickBarTimer == nil else { return }
        let timer = Timer(timeInterval: 0.2, repeats: true) { [weak self] _ in
            self?.quickBarTick(at: NSEvent.mouseLocation)
        }
        RunLoop.main.add(timer, forMode: .common)
        quickBarTimer = timer
    }

    /// Visible only while the pointer is on the pet (or on the bar itself).
    private func quickBarTick(at point: NSPoint) {
        guard workbenchState.visible, !web.isDragging else {
            hideQuickBar()
            return
        }
        if !isTest, !panel.isVisible {
            hideQuickBar()
            return
        }
        let petZone = panel.frame.insetBy(dx: -10, dy: -10)
        let barVisible = quickBarWindow?.isVisible ?? false
        let barZone = quickBarWindow?.frame.insetBy(dx: -6, dy: -6) ?? .zero
        let over = petZone.contains(point) || (barVisible && barZone.contains(point))
        if over {
            quickBarLeaveAt = nil
            if !barVisible { showQuickBar() }
        } else if barVisible {
            if let leaveAt = quickBarLeaveAt {
                if Date().timeIntervalSince(leaveAt) > 0.35 { hideQuickBar() }
            } else {
                quickBarLeaveAt = Date()
            }
        }
    }

    private func showQuickBar() {
        let host = ReminderHostingView(rootView: QuickBar(
            name: (appliedConfig?["name"] as? String) ?? "",
            onChat: { [weak self] in
                self?.hideQuickBar()
                self?.showChat()
            },
            onClipboard: { [weak self] in
                self?.hideQuickBar()
                self?.showClipboard()
            },
            onFocus: { [weak self] in self?.handleQuickFocus() }
        ))
        fitCardHost(host, fallback: NSSize(width: 110, height: 40))
        let panel = quickBarWindow ?? makeReminderPanel()
        panel.ignoresMouseEvents = false
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        quickBarWindow = panel
        layoutQuickBar()
        layoutDropChoice()
        panel.orderFrontRegardless()
    }

    private func hideQuickBar() {
        quickBarLeaveAt = nil
        quickBarWindow?.orderOut(nil)
        if let origin = quickBarPetOrigin {
            quickBarPetOrigin = nil
            quickBarAdjusting = true
            panel.setFrameOrigin(origin)
            layoutReminder()
            quickBarAdjusting = false
        }
    }

    private func layoutQuickBar() {
        guard let card = quickBarWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        guard !quickBarAdjusting, !web.isDragging else { return }
        let size = card.frame.size
        if let edge = edgePlacement?.edge {
            let rightOfPet = panel.frame.maxX + 6
            let leftOfPet = panel.frame.minX - size.width - 6
            let x = edge == .bottom ? panel.frame.midX - size.width / 2 : edge == .left ? rightOfPet : leftOfPet
            let y = edge == .bottom ? panel.frame.maxY + 6 : panel.frame.midY - size.height / 2
            card.setFrameOrigin(NSPoint(x: min(max(x, screen.minX + 6), screen.maxX - size.width - 6),
                                        y: min(max(y, screen.minY + 6), screen.maxY - size.height - 6)))
            return
        }

        // Always below the pet. When the pet sits too low for the bar, lift the
        // pet just enough and put it back when the bar hides.
        if panel.frame.minY - size.height - 6 < screen.minY + 6 {
            quickBarAdjusting = true
            if quickBarPetOrigin == nil { quickBarPetOrigin = panel.frame.origin }
            let deficit = screen.minY + 6 - (panel.frame.minY - size.height - 6)
            panel.setFrameOrigin(NSPoint(x: panel.frame.origin.x, y: panel.frame.origin.y + deficit))
            layoutReminder()
            quickBarAdjusting = false
        }

        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.minY - size.height - 6)
        origin.x = min(max(origin.x, screen.minX + 6), screen.maxX - size.width - 6)
        origin.y = max(origin.y, screen.minY + 6)
        card.setFrameOrigin(origin)
    }

    private func handleQuickFocus() {
        switch focus.phase {
        case .idle:
            focus.startFocus()
        case .focusing:
            focus.togglePause()
        case .resting:
            focus.skipBreak()
        }
        hideQuickBar()
    }

    // MARK: Trash

    private func handleFileDrop(_ urls: [URL]) {
        guard urls.count == 1 else {
            showTrashToast("一次只处理一个文件", tone: .hint, autoHide: 2.2)
            return
        }
        let url = urls[0]
        dropChoiceURL = url
        dropChoiceKind = FileKind.of(url)
        showDropChoices()
    }

    private func showDropChoices() {
        guard let url = dropChoiceURL else { return }
        let host = ReminderHostingView(rootView: DropActionBar(
            fileName: url.lastPathComponent,
            onTrash: { [weak self] in self?.performTrash() },
            onZip: { [weak self] in self?.performZip() },
            onConvert: { [weak self] in self?.showFormatChoices() }
        ))
        presentDropPanel(host: host, fallback: NSSize(width: 236, height: 92))
    }

    private func showFormatChoices() {
        guard let url = dropChoiceURL else { return }
        let formats = FileTools.formats(for: dropChoiceKind)
        guard !formats.isEmpty else {
            hideDropChoice()
            showTrashToast("不支持这种文件", tone: .failure, autoHide: 2.2)
            return
        }
        let host = ReminderHostingView(rootView: DropFormatBar(
            formats: formats,
            fileName: url.lastPathComponent,
            onPick: { [weak self] format in self?.performConvert(format) }
        ))
        presentDropPanel(host: host, fallback: NSSize(width: 220, height: 84))
    }

    private func performTrash() {
        guard let url = dropChoiceURL else { return }
        let ok = FileTools.trash(url)
        hideDropChoice()
        showTrashToast(ok ? "已移到垃圾桶" : "操作失败", tone: ok ? .normal : .failure, autoHide: 2.4)
    }

    private func performZip() {
        guard let url = dropChoiceURL else { return }
        let ok = FileTools.zip(url) != nil
        hideDropChoice()
        showTrashToast(ok ? "已压缩" : "操作失败", tone: ok ? .normal : .failure, autoHide: 2.4)
    }

    private func performConvert(_ format: ConvertFormat) {
        guard let url = dropChoiceURL else { return }
        let ok = FileTools.convert(url, to: format) != nil
        hideDropChoice()
        showTrashToast(
            ok ? "已转换" : "操作失败",
            tone: ok ? .normal : .failure,
            autoHide: 2.4
        )
    }

    private func presentDropPanel<Content: View>(host: NSHostingView<Content>, fallback: NSSize) {
        fitCardHost(host, fallback: fallback)
        let panel = dropChoiceWindow ?? makeReminderPanel()
        panel.ignoresMouseEvents = false
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        dropChoiceWindow = panel
        panel.orderFrontRegardless()
        layoutDropChoice()
        installDropChoiceMonitor()
    }

    private func layoutDropChoice() {
        guard let card = dropChoiceWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    private func hideDropChoice() {
        dropChoiceWindow?.orderOut(nil)
        dropChoiceURL = nil
        dropChoiceKind = .unsupported
        if let dropChoiceMonitor {
            NSEvent.removeMonitor(dropChoiceMonitor)
            self.dropChoiceMonitor = nil
        }
        if let dropChoiceLocalMonitor {
            NSEvent.removeMonitor(dropChoiceLocalMonitor)
            self.dropChoiceLocalMonitor = nil
        }
    }

    private func installDropChoiceMonitor() {
        guard dropChoiceMonitor == nil else { return }
        dropChoiceMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown]
        ) { [weak self] _ in
            guard let self, let card = self.dropChoiceWindow, card.isVisible else { return }
            if !card.frame.contains(NSEvent.mouseLocation) { self.hideDropChoice() }
        }
        dropChoiceLocalMonitor = NSEvent.addLocalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown]
        ) { [weak self] event in
            guard let self, let card = self.dropChoiceWindow, card.isVisible else { return event }
            if !card.frame.contains(NSEvent.mouseLocation) { self.hideDropChoice() }
            return event
        }
    }

    private func showTrashToast(_ text: String, tone: TrashToast.Tone, autoHide: TimeInterval?) {
        let host = ReminderHostingView(rootView: TrashToast(text: text, tone: tone))
        fitCardHost(host, fallback: NSSize(width: 220, height: 30))
        let panel = trashToastWindow ?? makeReminderPanel()
        panel.ignoresMouseEvents = true
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        trashToastWindow = panel
        panel.orderFrontRegardless()
        layoutTrashToast()
        trashToastHide?.cancel()
        trashToastHide = nil
        if let autoHide {
            let item = DispatchWorkItem { [weak self] in self?.hideTrashToast() }
            trashToastHide = item
            DispatchQueue.main.asyncAfter(deadline: .now() + autoHide, execute: item)
        }
    }

    private func hideTrashToast() {
        trashToastHide?.cancel()
        trashToastHide = nil
        trashToastWindow?.orderOut(nil)
    }

    private func layoutTrashToast() {
        guard let card = trashToastWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    // MARK: Chat

    private func showChat() {
        hideQuickBar()
        if chatModel == nil {
            let model = ChatModel(brain: chatBrain)
            model.prepare()
            chatModel = model
        }
        guard let model = chatModel else { return }
        let host = ReminderHostingView(rootView: ChatCard(
            model: model,
            onClose: { [weak self] in self?.hideChat() },
            onHeightChange: { [weak self] height in self?.resizeChat(height: height) }
        ))
        fitCardHost(host, fallback: NSSize(width: 306, height: 300))
        let panel = chatWindow ?? makeReminderPanel()
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        chatWindow = panel
        activateForPetUI()
        panel.makeKeyAndOrderFront(nil)
        layoutChat()
        layoutTrashToast()
        layoutQuickBar()
        layoutDropChoice()
        installChatDismissMonitor()
    }

    private func hideChat() {
        chatWindow?.orderOut(nil)
        if let chatDismissMonitor {
            NSEvent.removeMonitor(chatDismissMonitor)
            self.chatDismissMonitor = nil
        }
    }

    private func resizeChat(height: CGFloat) {
        guard let panel = chatWindow, height > 1 else { return }
        guard abs(panel.frame.height - height) > 0.5 else { return }
        panel.setContentSize(NSSize(width: 306, height: height))
        layoutChat()
        layoutTrashToast()
        layoutQuickBar()
        layoutDropChoice()
    }

    private func layoutChat() {
        guard let card = chatWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if let reminder = reminderWindow, reminder.isVisible {
            origin.y = max(reminder.frame.maxY + 8, origin.y)
        }
        if let focusCard = focusWindow, focusCard.isVisible {
            origin.y = max(focusCard.frame.maxY + 8, origin.y)
        }
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    private func installChatDismissMonitor() {
        guard chatDismissMonitor == nil else { return }
        chatDismissMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown]
        ) { [weak self] _ in
            guard let self, let card = self.chatWindow, card.isVisible else { return }
            if !card.frame.contains(NSEvent.mouseLocation) {
                self.hideChat()
            }
        }
    }

    // MARK: Selection translation

    private func startSelectionWatcher() {
        guard selectionUpMonitor == nil else { return }
        selectionDownMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown]) { [weak self] _ in
            self?.selectionDownPoint = NSEvent.mouseLocation
            self?.hideTranslateButton()
        }
        selectionUpMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseUp]) { [weak self] _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                self?.handleSelectionMouseUp()
            }
        }
    }

    private func handleSelectionMouseUp() {
        let upPoint = NSEvent.mouseLocation
        let downPoint = selectionDownPoint
        selectionDownPoint = nil
        // Only a drag looks like a selection; plain clicks should stay quiet.
        guard let downPoint,
              hypot(upPoint.x - downPoint.x, upPoint.y - downPoint.y) >= 3 else { return }
        guard translationEngine.isAvailable else { return }
        guard SelectionReader.isTrusted else {
            if !translationTrustRequested {
                translationTrustRequested = true
                SelectionReader.requestTrust()
            }
            return
        }
        guard let text = SelectionReader.selectedText(), SelectionText.isEnglish(text) else { return }
        pendingSelection = text
        showTranslateButton(at: upPoint)
    }

    private func showTranslateButton(at point: NSPoint) {
        let host = ReminderHostingView(rootView: TranslationButtonCard { [weak self] in
            self?.beginTranslation()
        })
        fitCardHost(host, fallback: NSSize(width: 60, height: 30))
        let panel = translateButtonWindow ?? makeReminderPanel()
        panel.ignoresMouseEvents = false
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        translateButtonWindow = panel

        let size = panel.frame.size
        let screen = NSScreen.screens.first { $0.frame.contains(point) }?.visibleFrame
            ?? NSScreen.main?.visibleFrame
        var origin = NSPoint(x: point.x + 12, y: point.y - size.height - 8)
        if let screen {
            if origin.y < screen.minY + 6 { origin.y = point.y + 10 }
            origin.x = min(max(origin.x, screen.minX + 6), screen.maxX - size.width - 6)
        }
        panel.setFrameOrigin(origin)
        panel.orderFrontRegardless()
    }

    private func hideTranslateButton() {
        translateButtonWindow?.orderOut(nil)
    }

    private func beginTranslation() {
        guard let raw = pendingSelection else { return }
        hideTranslateButton()
        let (text, truncated) = SelectionText.prepare(raw)
        currentTranslation = nil
        showTranslation(.loading)
        translationEngine.translate(text) { [weak self] result in
            DispatchQueue.main.async {
                guard let self else { return }
                let translated = result?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                if translated.isEmpty {
                    self.showTranslation(.failure)
                } else {
                    self.currentTranslation = translated
                    self.showTranslation(.result(original: raw, translated: translated, truncated: truncated))
                }
            }
        }
    }

    private func showTranslation(_ state: TranslationCardState) {
        let host = ReminderHostingView(rootView: TranslationCard(
            state: state,
            onCopy: { [weak self] in self?.copyTranslation() },
            onOpenSettings: { [weak self] in self?.openAccessibilitySettings() },
            onClose: { [weak self] in self?.hideTranslation() },
            onHeightChange: { [weak self] height in self?.resizeTranslation(height: height) }
        ))
        fitCardHost(host, fallback: NSSize(width: 286, height: 130))
        let panel = translationWindow ?? makeReminderPanel()
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        translationWindow = panel
        panel.orderFrontRegardless()
        layoutTranslationBubble()
        layoutChat()
        layoutTrashToast()
        layoutQuickBar()
        layoutDropChoice()
        installTranslationDismissMonitor()
    }

    private func resizeTranslation(height: CGFloat) {
        guard let panel = translationWindow, height > 1 else { return }
        guard abs(panel.frame.height - height) > 0.5 else { return }
        panel.setContentSize(NSSize(width: 286, height: height))
        layoutTranslationBubble()
        layoutChat()
        layoutTrashToast()
        layoutQuickBar()
        layoutDropChoice()
    }

    private func layoutTranslationBubble() {
        guard let card = translationWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if let reminder = reminderWindow, reminder.isVisible {
            origin.y = max(reminder.frame.maxY + 8, origin.y)
        }
        if let focusCard = focusWindow, focusCard.isVisible {
            origin.y = max(focusCard.frame.maxY + 8, origin.y)
        }
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    private func installTranslationDismissMonitor() {
        guard translationDismissMonitor == nil else { return }
        translationDismissMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown]
        ) { [weak self] _ in
            guard let self, let card = self.translationWindow, card.isVisible else { return }
            if !card.frame.contains(NSEvent.mouseLocation) {
                self.hideTranslation()
            }
        }
    }

    private func hideTranslation() {
        translationWindow?.orderOut(nil)
        currentTranslation = nil
        if let translationDismissMonitor {
            NSEvent.removeMonitor(translationDismissMonitor)
            self.translationDismissMonitor = nil
        }
    }

    private func copyTranslation() {
        guard let text = currentTranslation, !text.isEmpty else { return }
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }

    private func openAccessibilitySettings() {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
            NSWorkspace.shared.open(url)
        }
    }

    // MARK: Clipboard

    private func showClipboard() {
        hideQuickBar()
        let host = ReminderHostingView(rootView: ClipboardCard(
            items: clipboard.items,
            onCopy: { [weak self] item in
                self?.clipboard.copy(item)
            },
            onDelete: { [weak self] item in
                guard let self else { return }
                self.clipboard.remove(item)
                self.showClipboard()
            },
            onClear: { [weak self] in
                self?.clipboard.clear()
                self?.hideClipboard()
            },
            onClose: { [weak self] in self?.hideClipboard() }
        ))
        fitCardHost(host, fallback: NSSize(width: 300, height: 380))
        let card = clipboardWindow ?? makeReminderPanel()
        card.setContentSize(host.frame.size)
        card.contentView = host
        clipboardWindow = card
        // No activation here: activating the app triggers applicationShouldHandleReopen,
        // which pulls the workbench forward.
        card.makeKeyAndOrderFront(nil)
        layoutClipboard()
        installClipboardClickMonitor()
    }

    private func hideClipboard() {
        clipboardWindow?.orderOut(nil)
        if let clipboardClickMonitor {
            NSEvent.removeMonitor(clipboardClickMonitor)
            self.clipboardClickMonitor = nil
        }
    }

    /// The panel stays non-activating, so a click in another app has to close it.
    private func installClipboardClickMonitor() {
        guard clipboardClickMonitor == nil else { return }
        clipboardClickMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown]
        ) { [weak self] _ in
            guard let self, let card = self.clipboardWindow, card.isVisible else { return }
            if !card.frame.contains(NSEvent.mouseLocation) {
                self.hideClipboard()
            }
        }
    }

    private func layoutClipboard() {
        guard let card = clipboardWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if let reminder = reminderWindow, reminder.isVisible {
            origin.y = max(reminder.frame.maxY + 8, origin.y)
        }
        if let focusCard = focusWindow, focusCard.isVisible {
            origin.y = max(focusCard.frame.maxY + 8, origin.y)
        }
        if let weatherCard = weatherWindow, weatherCard.isVisible {
            origin.y = max(weatherCard.frame.maxY + 8, origin.y)
        }
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    // MARK: Music

    private func showMusicBadge(app: String) {
        let host = ReminderHostingView(rootView: MusicBadge(appName: app))
        fitCardHost(host, fallback: NSSize(width: 150, height: 30))
        let card = musicWindow ?? makeReminderPanel()
        card.ignoresMouseEvents = true
        card.setContentSize(host.frame.size)
        card.contentView = host
        musicWindow = card
        card.orderFrontRegardless()
        layoutMusicBadge()
    }

    private func hideMusicBadge() {
        musicWindow?.orderOut(nil)
    }

    private func layoutMusicBadge() {
        guard let card = musicWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        // Beside the pet, not above it: the cards (weather, focus, reminders) all
        // stack above the pet and would otherwise collide with this chip.
        var origin = NSPoint(
            x: panel.frame.minX - size.width - 8,
            y: panel.frame.midY - size.height / 2
        )
        if origin.x < screen.minX + 8 {
            origin.x = panel.frame.maxX + 8
        }
        if origin.x + size.width > screen.maxX - 8 {
            origin.x = panel.frame.midX - size.width / 2
            origin.y = panel.frame.maxY + 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    @objc private func openChat() {
        showChat()
    }

    @objc private func openClipboard() {
        showClipboard()
    }

    @objc private func toggleMusicWatch() {
        music.enabled.toggle()
        if !music.enabled {
            hideMusicBadge()
        } else if let app = music.activeApp {
            showMusicBadge(app: app)
        }
        status.menu = makeMenu()
    }

    // MARK: Weather

    private func startWeatherTimer() {
        guard weatherTimer == nil else { return }
        let timer = Timer(timeInterval: 60, repeats: true) { [weak self] _ in
            self?.weatherTick()
        }
        RunLoop.main.add(timer, forMode: .common)
        weatherTimer = timer
        weatherTick()
    }

    private func weatherTick() {
        guard weather.shouldRemind() else { return }
        // Keep focus time quiet; the next minute retries once the session ends.
        guard !focus.isActive else { return }
        if let weatherRetryAt, Date() < weatherRetryAt { return }
        fetchWeather(remind: true)
    }

    private func fetchWeather(remind: Bool) {
        weather.refresh { [weak self] result in
            DispatchQueue.main.async {
                guard let self else { return }
                switch result {
                case .success(let snapshot):
                    self.weatherRetryAt = nil
                    self.showWeatherCard(snapshot: snapshot, failure: nil)
                    if remind { self.weather.markShown() }
                case .failure:
                    if remind {
                        self.weatherRetryAt = Date().addingTimeInterval(10 * 60)
                    } else {
                        self.showWeatherCard(snapshot: nil, failure: "暂时取不到天气，检查网络或稍后再试。")
                    }
                }
            }
        }
    }

    @objc private func checkWeatherNow() {
        fetchWeather(remind: false)
    }

    @objc private func toggleWeatherReminder() {
        weather.setEnabled(!weather.enabled)
        if weather.enabled { fetchWeather(remind: false) }
    }

    @objc private func setWeatherReminderTime(_ sender: NSMenuItem) {
        weather.setReminderMinutes(sender.tag)
    }

    @objc private func setWeatherCity() {
        showWeatherCityInput()
    }

    @objc private func startFocusFromMenu(_ sender: NSMenuItem) {
        focus.startFocus(minutes: sender.tag)
    }

    @objc private func startFocusCustom() {
        showFocusMinutesInput()
    }

    private func showFocusMinutesInput() {
        hideQuickBar()
        focusMinutesInput.text = String(focus.focusMinutes)
        let host = ReminderHostingView(rootView: FocusMinutesCard(
            model: focusMinutesInput,
            onStart: { [weak self] in self?.submitFocusMinutes() },
            onCancel: { [weak self] in self?.hideFocusMinutesInput() }
        ))
        fitCardHost(host, fallback: NSSize(width: 252, height: 84))
        let card = focusMinutesWindow ?? makeReminderPanel()
        card.setContentSize(host.frame.size)
        card.contentView = host
        focusMinutesWindow = card
        activateForPetUI()
        card.makeKeyAndOrderFront(nil)
        layoutFocusMinutes()
    }

    private func hideFocusMinutesInput() {
        focusMinutesWindow?.orderOut(nil)
    }

    private func submitFocusMinutes() {
        guard let minutes = focusMinutesInput.value else { return }
        hideFocusMinutesInput()
        focus.startFocus(minutes: minutes)
    }

    private func layoutFocusMinutes() {
        guard let card = focusMinutesWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if let reminder = reminderWindow, reminder.isVisible {
            origin.y = max(reminder.frame.maxY + 8, origin.y)
        }
        if let card = focusWindow, card.isVisible {
            origin.y = max(card.frame.maxY + 8, origin.y)
        }
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    private func showWeatherCard(snapshot: WeatherSnapshot?, failure: String?) {
        let host = ReminderHostingView(rootView: WeatherCard(
            snapshot: snapshot,
            failure: failure,
            onDismiss: { [weak self] in self?.hideWeatherCard() },
            onOpenWeather: { [weak self] in self?.openWeatherApp() },
            onRetry: { [weak self] in
                self?.weatherRetryAt = nil
                self?.fetchWeather(remind: false)
            },
            onHeightChange: { [weak self] height in self?.resizeWeatherCard(height: height) }
        ))
        fitCardHost(host, fallback: NSSize(width: 252, height: 120))
        let card = weatherWindow ?? makeReminderPanel()
        card.setContentSize(host.frame.size)
        card.contentView = host
        weatherWindow = card
        card.orderFrontRegardless()
        layoutWeatherCard()
    }

    private func hideWeatherCard() {
        weatherWindow?.orderOut(nil)
    }

    private func resizeWeatherCard(height: CGFloat) {
        guard let card = weatherWindow, height > 1 else { return }
        guard abs(card.frame.height - height) > 0.5 else { return }
        card.setContentSize(NSSize(width: 252, height: height))
        layoutWeatherCard()
    }

    private func layoutWeatherCard() {
        guard let card = weatherWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if let reminder = reminderWindow, reminder.isVisible {
            origin.y = max(reminder.frame.maxY + 8, origin.y)
        }
        if let focusCard = focusWindow, focusCard.isVisible {
            origin.y = max(focusCard.frame.maxY + 8, origin.y)
        }
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    private func openWeatherApp() {
        let weatherApp = URL(fileURLWithPath: "/System/Applications/Weather.app")
        if FileManager.default.fileExists(atPath: weatherApp.path) {
            NSWorkspace.shared.openApplication(at: weatherApp, configuration: NSWorkspace.OpenConfiguration())
            return
        }
        if let url = URL(string: "https://www.weather.com.cn") {
            NSWorkspace.shared.open(url)
        }
    }

    private func showWeatherCityInput() {
        hideQuickBar()
        weatherCityInput.text = weather.cityOverride
        let host = ReminderHostingView(rootView: WeatherCityCard(
            model: weatherCityInput,
            current: weather.cityText,
            onSave: { [weak self] in self?.submitWeatherCity() },
            onCancel: { [weak self] in self?.hideWeatherCityInput() }
        ))
        fitCardHost(host, fallback: NSSize(width: 252, height: 96))
        let card = weatherCityWindow ?? makeReminderPanel()
        card.setContentSize(host.frame.size)
        card.contentView = host
        weatherCityWindow = card
        activateForPetUI()
        card.makeKeyAndOrderFront(nil)
        layoutWeatherCityInput()
    }

    private func hideWeatherCityInput() {
        weatherCityWindow?.orderOut(nil)
    }

    private func submitWeatherCity() {
        weather.setCityOverride(weatherCityInput.text)
        hideWeatherCityInput()
        fetchWeather(remind: false)
    }

    private func layoutWeatherCityInput() {
        guard let card = weatherCityWindow,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        let size = card.frame.size
        var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
        if let weatherCard = weatherWindow, weatherCard.isVisible {
            origin.y = max(weatherCard.frame.maxY + 8, origin.y)
        }
        if let reminder = reminderWindow, reminder.isVisible {
            origin.y = max(reminder.frame.maxY + 8, origin.y)
        }
        if origin.y + size.height > screen.maxY {
            origin.y = panel.frame.minY - size.height - 8
        }
        origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
        origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
        card.setFrameOrigin(origin)
    }

    @objc private func toggleFocusPin() {
        focus.togglePin()
    }

    @objc private func toggleFocusPause() {
        focus.togglePause()
    }

    @objc private func revealFocusCard() {
        focus.revealCard()
    }

    @objc private func extendFocus() {
        focus.extend()
    }

    @objc private func stopFocus() {
        focus.stop()
    }

    @objc private func startFocusBreak() {
        focus.startBreak()
    }

    @objc private func skipFocusBreak() {
        focus.skipBreak()
    }

    private func showReminderInput() {
        hideQuickBar()
        let host = ReminderHostingView(rootView: ReminderInputCard(
            model: reminderInput,
            onSubmit: { [weak self] in self?.submitReminder() },
            onCancel: { [weak self] in self?.hideReminderInput() }
        ))
        fitCardHost(host, fallback: NSSize(width: 288, height: 44))
        let size = host.frame.size
        if edgePlacement == nil, reminderInputPetOrigin == nil, let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame {
            // Keep the input directly under the cat even when the pet sits near the screen bottom.
            let required = screen.minY + 8 + size.height + 8 - panel.frame.minY
            let room = screen.maxY - panel.frame.maxY - 8
            let shift = min(max(required, 0), max(room, 0))
            if shift > 0.5 {
                reminderInputPetOrigin = panel.frame.origin
                let moved = NSPoint(x: panel.frame.minX, y: panel.frame.minY + shift)
                panel.setFrameOrigin(moved)
                reminderInputShiftedOrigin = moved
            }
        }
        let input = reminderInputWindow ?? makeReminderPanel()
        input.setContentSize(size)
        input.contentView = host
        reminderInputWindow = input
        activateForPetUI()
        input.makeKeyAndOrderFront(nil)
        layoutReminder()
    }

    private func hideReminderInput() {
        guard !isHidingReminderInput else { return }
        isHidingReminderInput = true
        defer { isHidingReminderInput = false }
        reminderInputWindow?.orderOut(nil)
        reminderInput.text = ""
        if let origin = reminderInputPetOrigin,
           let shifted = reminderInputShiftedOrigin,
           panel.frame.origin == shifted {
            panel.setFrameOrigin(origin)
        }
        reminderInputPetOrigin = nil
        reminderInputShiftedOrigin = nil
    }

    private func makeReminderPanel() -> ReminderPanel {
        let reminder = ReminderPanel(
            contentRect: .zero,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered, defer: false
        )
        reminder.isOpaque = false
        reminder.backgroundColor = .clear
        reminder.hasShadow = false
        reminder.level = .floating
        reminder.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        reminder.isFloatingPanel = true
        reminder.delegate = self
        return reminder
    }

    private func fitCardHost<Content: View>(_ host: NSHostingView<Content>, fallback: NSSize) {
        host.frame = NSRect(origin: .zero, size: fallback)
        host.layoutSubtreeIfNeeded()
        let fitted = host.fittingSize
        host.frame = NSRect(
            origin: .zero,
            size: NSSize(
                width: fitted.width > 1 ? fitted.width : fallback.width,
                height: fitted.height > 1 ? fitted.height : fallback.height
            )
        )
    }

    private func layoutReminder() {
        guard let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return }
        if let reminder = reminderWindow {
            let size = reminder.frame.size
            var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.maxY + 8)
            if origin.y + size.height > screen.maxY {
                origin.y = panel.frame.minY - size.height - 8
            }
            origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
            origin.y = min(max(origin.y, screen.minY + 8), screen.maxY - size.height - 8)
            reminder.setFrameOrigin(origin)
        }
        if let input = reminderInputWindow {
            let size = input.frame.size
            var origin = NSPoint(x: panel.frame.midX - size.width / 2, y: panel.frame.minY - size.height - 8)
            if origin.y < screen.minY + 8 {
                let stackTop = reminderWindow?.frame.maxY ?? panel.frame.maxY
                origin.y = stackTop + 8
            }
            origin.x = min(max(origin.x, screen.minX + 8), screen.maxX - size.width - 8)
            origin.y = min(origin.y, screen.maxY - size.height - 8)
            input.setFrameOrigin(origin)
        }
        layoutFocusCard()
        layoutFocusMinutes()
        layoutTranslationBubble()
        layoutChat()
        layoutTrashToast()
        layoutQuickBar()
        layoutDropChoice()
        layoutWeatherCard()
        layoutWeatherCityInput()
        layoutClipboard()
        layoutMusicBadge()
    }

    private func matchingPreset(_ config: [String: Any]) -> String {
        workbenchState.catalog?.matchingPreset(config)
            ?? (config["frame"] as? String == "CAT" ? "preset_cat_orange" : "preset_m1_12")
    }

    private func choosePreset(_ id: String, completion: ((Bool) -> Void)? = nil) {
        presetRequest += 1
        let request = presetRequest
        preview.callAsyncJavaScript("return window.pet.preset(id)", arguments: ["id": id], in: nil, in: .page) { [weak self] result in
            guard let self, request == self.presetRequest, case .success(let value) = result,
                  let config = value as? [String: Any] else { completion?(false); return }
            // Selecting a breed starts from all of its appearance defaults.
            // Profile fields and independent custom paint are handled separately.
            self.workbenchState.preset = id
            self.setDraft(config)
            completion?(true)
        }
    }

    private func setDraft(_ config: [String: Any]) {
        let previousName = workbenchState.appearance["name"]
        let previousDraft = workbenchState.nameText
        draftTemplate = config
        workbenchState.update(config)
        // A breed change must not touch the pet's name.
        if let previousName, !previousName.isEmpty {
            workbenchState.appearance["name"] = previousName
        }
        if workbenchState.nameDirty {
            workbenchState.nameText = previousDraft
        } else if let previousName, !previousName.isEmpty {
            workbenchState.nameText = previousName
        }
    }

    private func draftConfig() -> [String: Any] {
        var draft = draftTemplate
        for (field, value) in workbenchState.appearance {
            draft[field] = value
        }
        return draft
    }

    private func refreshPreview() {
        guard previewReady, !draftTemplate.isEmpty else { return }
        var config = draftConfig()
        // Name validation belongs to Apply; appearance stays live while editing it.
        config["name"] = "预览"
        preview.callAsyncJavaScript("window.pet.preview(config, action)",
            arguments: ["config": config, "action": workbenchState.action], in: nil, in: .page)
    }

    private func applyDraft(completion: @escaping (Bool) -> Void = { _ in }) {
        guard ready, !workbenchState.applying, !workbenchState.loadingCustom else { completion(false); return }
        var draft = draftConfig()
        draft["breed"] = workbenchState.preset
        let selection = previewCustom
        let snapshot = selection?.snapshot
        let updateOverlay = selection?.id != appliedCustom?.id
            || snapshot?.png != appliedCustom?.snapshot.png
            || snapshot?.source != appliedCustom?.snapshot.source
        let png = snapshot.map { "data:image/png;base64,\($0.png.base64EncodedString())" }
        let source = snapshot?.source.flatMap { String(data: $0, encoding: .utf8) }
        workbenchState.applying = true
        web.callAsyncJavaScript(
            """
            const valid = window.pet.normalize(config);
            if (updateOverlay) {
                let decoded;
                try { decoded = source ? JSON.parse(source) : null; } catch { decoded = null; }
                const reference = await window.pet.setCustom(png, decoded);
                if (png && !reference) throw Error('无法应用自定义形象');
            }
            window.pet.configure(valid);
            return valid;
            """,
            arguments: ["config": draft, "updateOverlay": updateOverlay,
                        "png": png as Any? ?? NSNull(), "source": source as Any? ?? NSNull()],
            in: nil, in: .page
        ) { [weak self] result in
            guard let self else { return }
            self.workbenchState.applying = false
            switch result {
            case .success(let value):
                guard var config = value as? [String: Any] else { completion(false); return }
                if updateOverlay {
                    do {
                        if let selection, !self.isTest {
                            try PixelPresetStore.write(selection.snapshot, to: selection.url)
                        }
                    } catch {
                        if let previous = self.appliedConfig { self.configurePet(previous) }
                        self.applyCustomOverlay(self.appliedCustom?.snapshot, in: self.web)
                        self.workbenchState.message = "保存自定义形象失败"
                        completion(false)
                        return
                    }
                }
                self.storeAppliedCustom(selection)
                config["breed"] = draft["breed"]
                self.storeAppliedAppearance(config, customID: selection?.id)
                if !self.isTest {
                    self.workbenchState.visible = true
                    self.showPet(true)
                }
                self.workbenchState.message = "已应用到桌宠"
                completion(true)
            case .failure(let error):
                self.workbenchState.message = (error as NSError).userInfo["WKJavaScriptExceptionMessage"] as? String ?? "无法应用配置"
                completion(false)
            }
        }
    }

    private func storeAppliedAppearance(_ config: [String: Any], customID: String?) {
        appliedConfig = config
        guard !isTest else { return }
        if let saved = try? JSONSerialization.data(withJSONObject: config) {
            UserDefaults.standard.set(String(decoding: saved, as: UTF8.self), forKey: "shibaConfig")
        }
        if let customID { savedCustomAppearances[customID] = config }
    }

    private func configurePet(_ config: [String: Any]) {
        guard ready else { return }
        if edgePlacement != nil, config["frame"] as? String != "CAT" {
            undockPet(at: NSPoint(x: panel.frame.midX, y: panel.frame.midY), keepOnScreen: true)
        }
        web.callAsyncJavaScript("window.pet.configure(config)", arguments: ["config": config], in: nil, in: .page)
    }

    private func beginPetDrag(at point: NSPoint) {
        hideQuickBar()
        hideReminderInput()
        if edgePlacement != nil { undockPet(at: point) }
    }

    private func verifyPetEdgeDragging() -> Bool {
        guard let display = NSScreen.main else { return false }
        let screen = display.visibleFrame
        let size = CGFloat(workbenchState.petSize)
        let secondDisplay = NSRect(x: -1440, y: -120, width: 1440, height: 900)
        let areaAboveDock = NSRect(x: -1440, y: -32, width: 1440, height: 780)
        let petAboveDock = NSRect(x: -840, y: areaAboveDock.minY, width: size, height: size)
        let nearDock = NSPoint(x: secondDisplay.midX, y: areaAboveDock.minY + 2)
        let nearBottom = NSPoint(x: secondDisplay.midX, y: secondDisplay.minY + 2)
        guard let dock = PetSurface.dock(in: secondDisplay, visible: areaAboveDock),
              PetSurface.nearTop(of: dock, point: nearDock, pet: petAboveDock),
              PetSurface.peekFrame(over: dock, anchor: 0.5, visibleScreens: [areaAboveDock], petSize: size)?.minY == areaAboveDock.minY,
              PetEdge.near(nearDock, pet: petAboveDock, visible: areaAboveDock, display: secondDisplay, neighbors: []) == nil,
              PetEdge.near(nearBottom, pet: petAboveDock, visible: areaAboveDock, display: secondDisplay, neighbors: []) == .bottom,
              PetEdge.bottom.frame(at: 0.5, in: areaAboveDock, display: secondDisplay, petSize: size).minY == secondDisplay.minY
        else { return false }
        let start = NSPoint(x: screen.midX, y: screen.midY)
        let resting = panel.frame
        defer {
            if edgePlacement != nil { undockPet(at: start) }
            panel.setFrame(resting, display: true)
        }

        func drag(from: NSPoint, to: NSPoint) -> Bool {
            let steps: [(NSEvent.EventType, NSPoint)] = [(.leftMouseDown, from), (.leftMouseDragged, to), (.leftMouseUp, to)]
            for (type, point) in steps {
                guard let event = NSEvent.mouseEvent(with: type, location: panel.convertPoint(fromScreen: point),
                    modifierFlags: [], timestamp: 0, windowNumber: panel.windowNumber, context: nil,
                    eventNumber: 0, clickCount: 1, pressure: 1) else { return false }
                switch type {
                case .leftMouseDown: web.mouseDown(with: event)
                case .leftMouseDragged: web.mouseDragged(with: event)
                default: web.mouseUp(with: event)
                }
            }
            return true
        }

        let tests: [(PetEdge, NSPoint)] = [(.left, NSPoint(x: screen.minX + 2, y: start.y)),
            (.right, NSPoint(x: screen.maxX - 2, y: start.y)), (.bottom, NSPoint(x: start.x, y: display.frame.minY + 2))]
        let neighbors = NSScreen.screens.filter { $0 != display }.map(\.frame)
        for (edge, point) in tests {
            if PetEdge.near(point, pet: resting, visible: screen, display: display.frame, neighbors: neighbors) != edge { continue }
            panel.setFrameOrigin(NSPoint(x: start.x - size / 2, y: start.y - size / 2))
            guard drag(from: start, to: point), let placement = edgePlacement, placement.edge == edge,
                  panel.frame.equalTo(edge.frame(at: placement.anchor, in: screen, display: display.frame, petSize: size))
            else { return false }
            let grip = NSPoint(x: panel.frame.midX, y: panel.frame.midY)
            guard drag(from: grip, to: start), edgePlacement == nil,
                  panel.frame.size == NSSize(width: size, height: size) else { return false }
        }
        return true
    }

    private func finishPetDrag(at point: NSPoint) {
        guard appliedConfig?["frame"] as? String == "CAT",
              let screen = NSScreen.screens.first(where: { $0.frame.contains(point) }) ?? panel.screen else { return }
        let visible = screen.visibleFrame
        let displayID = PetEdgePlacement.displayID(for: screen)
        let anchorPoint = NSPoint(x: panel.frame.midX, y: point.y)
        let screenEdge = PetEdge.near(point, pet: panel.frame, visible: visible, display: screen.frame,
                                     neighbors: NSScreen.screens.filter { $0 != screen }.map(\.frame))
        let reach = min(22, panel.frame.width * 0.09)
        let atDisplayBorder = screenEdge != nil
            && min(point.y - screen.frame.minY, point.x - visible.minX, visible.maxX - point.x) <= reach
        if !atDisplayBorder {
            let dock = PetSurface.dock(in: screen.frame, visible: visible)
                .flatMap { PetSurface.nearTop(of: $0, point: point, pet: panel.frame) ? $0 : nil }
            let pointerNearDock = dock.map { abs(point.y - $0.maxY) <= reach } ?? false
            if !pointerNearDock,
               let window = PetBrowserWindow.near(point, pet: panel.frame, visibleScreens: NSScreen.screens.map(\.visibleFrame)) {
                placePet(.init(edge: .bottom, surface: .browser(window, follows: false),
                               anchor: PetEdge.bottom.anchor(at: anchorPoint, in: window.frame)))
                if !isTest { offerBrowserAttachment(window) }
                return
            }
            if let dock {
                placePet(.init(edge: .bottom, surface: .dock(displayID), anchor: PetEdge.bottom.anchor(at: anchorPoint, in: dock)))
                return
            }
        }
        guard let screenEdge else { return }
        placePet(.init(edge: screenEdge, surface: .screen(displayID), anchor: screenEdge.anchor(at: anchorPoint, in: visible)))
    }

    private func placePet(_ placement: PetEdgePlacement) {
        edgePlacement = placement
        send("setEdge('\(placement.edge.rawValue)')")
        petGaze = nil
        layoutEdgePet(size: workbenchState.petSize)
        status.menu = makeMenu()
    }

    private func offerBrowserAttachment(_ window: PetBrowserWindow) {
        DispatchQueue.main.async { [weak self] in
            guard let self, case .browser(let target, false) = self.edgePlacement?.surface, target.id == window.id else { return }
            let menu = NSMenu()
            menu.addItem(self.menuItem("吸附到「\(window.name)」上沿", #selector(self.toggleBrowserAttachment)))
            let stay = menu.addItem(withTitle: "仅停在这里", action: #selector(NSMenu.cancelTracking), keyEquivalent: "")
            stay.target = menu
            menu.popUp(positioning: nil, at: NSPoint(x: self.panel.frame.midX, y: self.panel.frame.maxY), in: nil)
        }
    }

    @objc private func toggleBrowserAttachment() {
        guard var placement = edgePlacement, case .browser(let window, let isFollowing) = placement.surface else { return }
        placement.surface = .browser(window, follows: !isFollowing)
        edgePlacement = placement
        browserFollowTimer?.invalidate()
        browserFollowTimer = nil
        if !isFollowing {
            let timer = Timer(timeInterval: 1.0 / 30, repeats: true) { [weak self] _ in
                guard let self, self.workbenchState.visible else { return }
                self.layoutEdgePet(size: self.workbenchState.petSize)
            }
            RunLoop.main.add(timer, forMode: .common)
            browserFollowTimer = timer
            layoutEdgePet(size: workbenchState.petSize)
        }
        status.menu = makeMenu()
    }

    private func layoutEdgePet(size: CGFloat) {
        guard var placement = edgePlacement else { return }
        let screens = NSScreen.screens
        let frame: NSRect
        switch placement.surface {
        case .screen(let displayID):
            guard let screen = screens.first(where: { PetEdgePlacement.displayID(for: $0) == displayID }) else { resetPosition(); return }
            frame = placement.edge.frame(at: placement.anchor, in: screen.visibleFrame, display: screen.frame, petSize: size)
        case .dock(let displayID):
            guard let screen = screens.first(where: { PetEdgePlacement.displayID(for: $0) == displayID }),
                  let dock = PetSurface.dock(in: screen.frame, visible: screen.visibleFrame),
                  let above = PetSurface.peekFrame(over: dock, anchor: placement.anchor,
                                                   visibleScreens: [screen.visibleFrame], petSize: size) else { resetPosition(); return }
            frame = above
        case .browser(var window, let follows):
            if follows {
                switch window.state() {
                case .visible(let current): window.frame = current
                case .hidden: return
                case .closed:
                    undockPet(at: NSPoint(x: panel.frame.midX, y: panel.frame.midY), keepOnScreen: true)
                    return
                }
            }
            guard let above = PetSurface.peekFrame(over: window.frame, anchor: placement.anchor,
                                                   visibleScreens: screens.map(\.visibleFrame), petSize: size) else { return }
            placement.surface = .browser(window, follows: follows)
            edgePlacement = placement
            frame = above
        }
        guard panel.frame != frame else { return }
        panel.setFrame(frame, display: true)
        layoutReminder()
    }

    private func clearEdgePlacement() {
        edgePlacement = nil
        browserFollowTimer?.invalidate()
        browserFollowTimer = nil
        send("setEdge(null)")
        petGaze = nil
        status.menu = makeMenu()
    }

    private func undockPet(at point: NSPoint, keepOnScreen: Bool = false) {
        clearEdgePlacement()
        let size = CGFloat(workbenchState.petSize)
        var origin = NSPoint(x: point.x - size * 0.47, y: point.y - size * 0.64)
        if keepOnScreen, let screen = panel.screen?.visibleFrame {
            origin.x = min(max(origin.x, screen.minX), screen.maxX - size)
            origin.y = min(max(origin.y, screen.minY), screen.maxY - size)
        }
        panel.setFrame(NSRect(origin: origin, size: NSSize(width: size, height: size)), display: true)
        layoutReminder()
    }

    private func showPet(_ visible: Bool) {
        UserDefaults.standard.set(visible, forKey: "shibaVisible")
        if visible {
            panel.orderFrontRegardless()
            if !reminderList.items.isEmpty { showReminders() }
            if focus.showsCard { showFocusCard() }
            if let app = music.activeApp { showMusicBadge(app: app) }
        } else {
            panel.orderOut(nil)
            hideReminders()
            hideReminderInput()
            focus.unpin()
            hideFocusCard()
            hideMusicBadge()
            hideQuickBar()
        }
    }

    private func resizePet(_ size: Double) {
        UserDefaults.standard.set(size, forKey: "shibaSize")
        if edgePlacement != nil {
            layoutEdgePet(size: size)
            return
        }
        let corner = NSPoint(x: panel.frame.maxX, y: panel.frame.minY)
        panel.setContentSize(NSSize(width: size, height: size))
        panel.setFrameOrigin(NSPoint(x: corner.x - size, y: corner.y))
        layoutReminder()
    }

    func applicationWillTerminate(_ notification: Notification) {
        browserFollowTimer?.invalidate()
        typingRetry?.invalidate()
        typingActivity.flush()
        gazeTimer?.invalidate()
        weatherTimer?.invalidate()
        music.stop()
        clipboard.stop()
        stopListening()
        if let localMonitor { NSEvent.removeMonitor(localMonitor) }
        if let reminderClickMonitor { NSEvent.removeMonitor(reminderClickMonitor) }
        if let clipboardClickMonitor { NSEvent.removeMonitor(clipboardClickMonitor) }
        if let selectionUpMonitor { NSEvent.removeMonitor(selectionUpMonitor) }
        if let selectionDownMonitor { NSEvent.removeMonitor(selectionDownMonitor) }
        if let translationDismissMonitor { NSEvent.removeMonitor(translationDismissMonitor) }
        if let chatDismissMonitor { NSEvent.removeMonitor(chatDismissMonitor) }
        LocalRuntime.shared.shutdown()
        trashToastHide?.cancel()
        quickBarTimer?.invalidate()
        if let dropChoiceMonitor { NSEvent.removeMonitor(dropChoiceMonitor) }
        if let dropChoiceLocalMonitor { NSEvent.removeMonitor(dropChoiceLocalMonitor) }
        if let reminderObserver { NotificationCenter.default.removeObserver(reminderObserver) }
    }

    private func send(_ command: String) {
        if ready { web.evaluateJavaScript("window.pet.\(command)") }
    }

    private var hasActiveKeyboardTap: Bool {
        guard let keyboardTap, CFMachPortIsValid(keyboardTap) else { return false }
        return CGEvent.tapIsEnabled(tap: keyboardTap)
    }

    private func recordKey(_ event: NSEvent) {
        if event.modifierFlags.intersection([.command, .control]).isEmpty && !event.isARepeat {
            handleTypingKey()
        }
    }

    private func handleTypingKey() {
        if !isTest { typingActivity.recordKey() }
        send("key()")
    }

    @discardableResult
    private func startListening() -> Bool {
        if hasActiveKeyboardTap { return true }
        if let keyboardTap, CFMachPortIsValid(keyboardTap) {
            CGEvent.tapEnable(tap: keyboardTap, enable: true)
            if hasActiveKeyboardTap { return true }
        }
        stopListening()
        let mask: CGEventMask = 1 << CGEventType.keyDown.rawValue
        guard let tap = CGEvent.tapCreate(
            tap: .cgSessionEventTap, place: .tailAppendEventTap, options: .listenOnly,
            eventsOfInterest: mask, callback: { _, kind, event, context in
                guard let context else { return Unmanaged.passUnretained(event) }
                let pet = Unmanaged<DesktopPet>.fromOpaque(context).takeUnretainedValue()
                if kind == .tapDisabledByTimeout || kind == .tapDisabledByUserInput {
                    if let tap = pet.keyboardTap { CGEvent.tapEnable(tap: tap, enable: true) }
                } else if kind == .keyDown,
                          event.flags.intersection([.maskCommand, .maskControl]).isEmpty,
                          event.getIntegerValueField(.keyboardEventAutorepeat) == 0 {
                    pet.handleTypingKey()
                }
                return Unmanaged.passUnretained(event)
            }, userInfo: Unmanaged.passUnretained(self).toOpaque()
        ), let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0) else { return false }
        keyboardTap = tap
        tapSource = source
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)
        if CGEvent.tapIsEnabled(tap: tap) { return true }
        stopListening()
        return false
    }

    private func stopListening() {
        if let tapSource { CFRunLoopRemoveSource(CFRunLoopGetMain(), tapSource, .commonModes) }
        if let keyboardTap { CFMachPortInvalidate(keyboardTap) }
        tapSource = nil
        keyboardTap = nil
    }

    private func setupTypingSync() {
        refreshTypingListener()
        let timer = Timer(timeInterval: 3, repeats: true) { [weak self] _ in
            self?.refreshTypingListener()
        }
        RunLoop.main.add(timer, forMode: .common)
        typingRetry = timer

        if workbenchState.typingStatus == .needsPermission {
            DispatchQueue.main.async { [weak self] in self?.showTypingPermissionReminder() }
        }
    }

    private func refreshTypingListener() {
        typingActivity.refreshToday()
        let allowed = CGPreflightListenEventAccess()
        if !allowed { stopListening() }
        let next: TypingSyncStatus = allowed ? (startListening() ? .active : .unavailable) : .needsPermission
        if next != workbenchState.typingStatus { workbenchState.typingStatus = next }
        if next == .active, let alert = typingAlert {
            alert.window.sheetParent?.endSheet(alert.window)
        }
    }

    private func showTypingPermissionReminder() {
        guard workbenchState.typingStatus == .needsPermission,
              typingAlert == nil, let window = workbenchWindow else { return }
        let alert = NSAlert()
        alert.messageText = "开启桌宠打字同步"
        alert.informativeText = "允许「输入监控」后，小猫会跟着你在其他应用里的按键动起来。桌宠只在本机按天保存活跃打字时长和按键次数。"
        alert.addButton(withTitle: "打开输入监控")
        alert.addButton(withTitle: "稍后")
        typingAlert = alert
        alert.beginSheetModal(for: window) { [weak self] result in
            guard let self else { return }
            self.typingAlert = nil
            if result == .alertFirstButtonReturn { self.requestTypingPermission() }
        }
    }

    private func requestTypingPermission() {
        if !requestedTypingPermission {
            requestedTypingPermission = true
            _ = CGRequestListenEventAccess()
        }
        refreshTypingListener()
        if workbenchState.typingStatus == .needsPermission,
           let settings = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent") {
            NSWorkspace.shared.open(settings)
        }
    }

    private func makeMenu() -> NSMenu {
        let menu = NSMenu()
        let reminderItem = menu.addItem(withTitle: "添加重要提醒…", action: #selector(addReminder), keyEquivalent: "")
        reminderItem.target = self
        if !reminderList.items.isEmpty {
            let clearItem = menu.addItem(withTitle: "清除全部提醒", action: #selector(clearReminders), keyEquivalent: "")
            clearItem.target = self
        }
        menu.addItem(.separator())
        addFocusItems(to: menu)
        menu.addItem(.separator())
        addWeatherItems(to: menu)
        if let app = music.activeApp {
            let now = NSMenuItem(title: "听歌中：\(app)", action: nil, keyEquivalent: "")
            now.isEnabled = false
            menu.addItem(now)
        }
        let listening = menu.addItem(withTitle: "听歌状态", action: #selector(toggleMusicWatch), keyEquivalent: "")
        listening.target = self
        listening.state = music.enabled ? .on : .off
        menu.addItem(menuItem("剪贴板（\(clipboard.items.count)）", #selector(openClipboard)))
        menu.addItem(menuItem("问问桌宠…", #selector(openChat)))
        let organize = NSMenuItem(title: "整理文件", action: nil, keyEquivalent: "")
        let organizationOptions = NSMenu(title: "整理文件")
        organizationOptions.addItem(menuItem("帮我整理桌面", #selector(organizeDesktopFiles)))
        organizationOptions.addItem(menuItem("帮我整理文件夹…", #selector(chooseFileOrganizationFolder)))
        organize.submenu = organizationOptions
        menu.addItem(organize)
        menu.addItem(.separator())
        if case .browser(let window, let follows) = edgePlacement?.surface {
            menu.addItem(menuItem(follows ? "解除浏览器吸附" : "吸附到「\(window.name)」上沿", #selector(toggleBrowserAttachment)))
        }
        for (title, action) in [
            ("打开工作台", #selector(openWorkbench)),
            ("打字同步设置…", #selector(enableTyping)),
            ("将桌宠移回屏幕", #selector(resetPosition)),
            ("退出桌宠", #selector(quit)),
        ] {
            let item = menu.addItem(withTitle: title, action: action, keyEquivalent: "")
            item.target = self
        }
        return menu
    }

    @objc private func organizeDesktopFiles() { fileOrganizer.organizeDesktop() }

    @objc private func chooseFileOrganizationFolder() { fileOrganizer.chooseFolder() }

    private func addFocusItems(to menu: NSMenu) {
        if focus.pinned {
            menu.addItem(menuItem("取消钉住", #selector(toggleFocusPin)))
        }
        if focus.isActive && focus.cardHidden {
            menu.addItem(menuItem("显示计时", #selector(revealFocusCard)))
        }
        switch focus.phase {
        case .focusing:
            menu.addItem(menuItem(focus.paused ? "继续专注" : "暂停专注", #selector(toggleFocusPause)))
            menu.addItem(menuItem("延长 5 分钟", #selector(extendFocus)))
            menu.addItem(menuItem("结束专注", #selector(stopFocus)))
        case .resting:
            menu.addItem(menuItem("跳过休息", #selector(skipFocusBreak)))
        case .idle:
            let start = NSMenuItem(title: "开始专注", action: nil, keyEquivalent: "")
            let options = NSMenu()
            for minutes in FocusModel.presets {
                let option = options.addItem(
                    withTitle: "\(minutes) 分钟",
                    action: #selector(startFocusFromMenu(_:)),
                    keyEquivalent: ""
                )
                option.target = self
                option.tag = minutes
                option.state = minutes == focus.focusMinutes ? .on : .off
            }
            options.addItem(.separator())
            let custom = options.addItem(
                withTitle: "自定义…",
                action: #selector(startFocusCustom),
                keyEquivalent: ""
            )
            custom.target = self
            custom.state = FocusModel.presets.contains(focus.focusMinutes) ? .off : .on
            start.submenu = options
            menu.addItem(start)
            if focus.result == .focusFinished {
                menu.addItem(menuItem("休息 \(focus.breakMinutes) 分钟", #selector(startFocusBreak)))
            }
        }
    }

    private func addWeatherItems(to menu: NSMenu) {
        // One top-level entry: looking at the weather and configuring the
        // reminder both live inside it.
        let parent = NSMenuItem(title: "天气", action: nil, keyEquivalent: "")
        let sub = NSMenu()
        let check = sub.addItem(withTitle: "看看天气", action: #selector(checkWeatherNow), keyEquivalent: "")
        check.target = self
        sub.addItem(.separator())
        let toggle = sub.addItem(
            withTitle: weather.enabled ? "关闭提醒" : "开启提醒",
            action: #selector(toggleWeatherReminder),
            keyEquivalent: ""
        )
        toggle.target = self
        let times = NSMenuItem(title: "提醒时间", action: nil, keyEquivalent: "")
        let timeMenu = NSMenu()
        for minutes in WeatherModel.reminderPresets {
            let item = timeMenu.addItem(
                withTitle: String(format: "%02d:%02d", minutes / 60, minutes % 60),
                action: #selector(setWeatherReminderTime(_:)),
                keyEquivalent: ""
            )
            item.target = self
            item.tag = minutes
            item.state = weather.reminderMinutes == minutes ? .on : .off
        }
        times.submenu = timeMenu
        sub.addItem(times)
        sub.addItem(.separator())
        let city = sub.addItem(
            withTitle: "设置城市…（\(weather.cityText)）",
            action: #selector(setWeatherCity),
            keyEquivalent: ""
        )
        city.target = self
        parent.submenu = sub
        menu.addItem(parent)
    }

    private func menuItem(_ title: String, _ action: Selector) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: "")
        item.target = self
        return item
    }

    @objc private func enableTyping() {
        refreshTypingListener()
        switch workbenchState.typingStatus {
        case .needsPermission:
            requestTypingPermission()
        case .active:
            workbenchState.message = "已连接，可以到其他应用里打字测试。"
        case .checking, .unavailable:
            workbenchState.message = "输入监控已授权，正在重试键盘监听。"
        }
    }

    @objc private func resetPosition() {
        guard let screen = NSScreen.main?.visibleFrame else { return }
        if edgePlacement != nil {
            clearEdgePlacement()
            let size = workbenchState.petSize
            panel.setContentSize(NSSize(width: size, height: size))
        }
        // Leave room for the wider focus card so it is not clamped at rest and
        // can keep a fixed offset while the pet is dragged.
        let petWidth = panel.frame.width
        let cardInset = max(24, (FocusCard.width - petWidth) / 2 + 8)
        panel.setFrameOrigin(NSPoint(x: screen.maxX - petWidth - cardInset, y: screen.minY + 58))
    }

    @objc private func quit() { NSApp.terminate(nil) }
}

let app = NSApplication.shared
let pet = DesktopPet()
app.delegate = pet
app.setActivationPolicy(.regular)
app.run()
