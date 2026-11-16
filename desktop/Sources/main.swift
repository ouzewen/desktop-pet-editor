import AppKit
import CoreText
import SwiftUI
import WebKit

final class PetPanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

final class PetView: WKWebView {
    var send: (String) -> Void = { _ in }
    var menuForPet: () -> NSMenu = { NSMenu() }
    private var start: NSPoint?
    private var origin: NSPoint = .zero
    private var previousX: CGFloat = 0

    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    override func mouseDown(with event: NSEvent) {
        guard let window else { return }
        let point = NSEvent.mouseLocation
        start = point
        previousX = point.x
        origin = window.frame.origin
        send("beginDrag()")
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start, let window else { return }
        let point = NSEvent.mouseLocation
        window.setFrameOrigin(NSPoint(x: origin.x + point.x - start.x, y: origin.y + point.y - start.y))
        let dx = point.x - previousX
        if dx != 0 { send("drag(\(dx))") }
        previousX = point.x
    }

    override func mouseUp(with event: NSEvent) {
        start = nil
        send("release()")
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
    private let web: PetView = {
        let config = WKWebViewConfiguration()
        if CommandLine.arguments.contains("--self-test") {
            // WebKit otherwise taints pixel readback from bundled file URLs.
            config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        }
        return PetView(frame: .zero, configuration: config)
    }()
    private let preview = WKWebView(frame: .zero)
    private let workbenchState = WorkbenchState()
    private var workbenchWindow: NSWindow?
    private var previewReady = false
    private var appliedConfig: [String: Any]?
    private var draftTemplate: [String: Any] = [:]
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
    private let focus = FocusModel()
    private var focusHost: ReminderHostingView<FocusCard>?
    private var focusWindow: ReminderPanel?
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
        panel.contentView = web
        configureWorkbench()
        let prefs = UserDefaults.standard
        eyeFollow = prefs.object(forKey: "shibaEyeFollow") as? Bool ?? true
        workbenchState.eyeFollow = eyeFollow
        loadReminders()
        workbenchState.visible = prefs.object(forKey: "shibaVisible") as? Bool ?? (prefs.string(forKey: "shibaConfig") != nil)
        let savedSize = prefs.object(forKey: "shibaSize") as? Double ?? 240
        workbenchState.petSize = min(360, max(160, savedSize))
        panel.setContentSize(NSSize(width: workbenchState.petSize, height: workbenchState.petSize))
        resetPosition()
        reminderObserver = NotificationCenter.default.addObserver(
            forName: NSWindow.didMoveNotification, object: panel, queue: .main
        ) { [weak self] _ in
            self?.layoutReminder()
        }

        focus.onChange = { [weak self] in self?.focusSessionChanged() }

        status.button?.title = "桌宠"
        status.menu = makeMenu()
        guard let resources = Bundle.main.resourceURL else { NSApp.terminate(nil); return }
        web.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        preview.setValue(false, forKey: "drawsBackground")
        preview.navigationDelegate = self
        preview.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        if isTest { createWorkbench() } else { openWorkbench() }
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
        workbenchState.choosePreset = { [weak self] id in self?.choosePreset(id) }
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
        let host = NSHostingController(rootView: WorkbenchView(state: workbenchState, preview: preview))
        let window = NSWindow(contentViewController: host)
        window.title = "桌宠工作台"
        window.styleMask = [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView]
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
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
            let savedBreed = config["breed"] as? String
            self.workbenchState.preset = decoded.presets.first { $0.id == savedBreed && $0.frame == config["frame"] as? String }?.id ?? self.matchingPreset(config)
            self.setDraft(config)
            self.appliedConfig = config
            self.configurePet(config)
            self.runSelfTestIfReady()
        }
    }

    private var selfTestStarted = false
    private func runSelfTestIfReady() {
        guard isTest, ready, workbenchState.catalog != nil, workbenchWindow != nil, !selfTestStarted else { return }
        selfTestStarted = true
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
        choosePreset("preset_cat_calico") { [weak self] selected in
            guard let self, selected, self.workbenchState.appearance["frame"] == "CAT" else {
                fputs("Workbench could not select the cat preset\n", stderr)
                exit(1)
            }
            self.workbenchState.appearance["palette"] = "CC02"
            self.workbenchState.appearance["eye"] = "Y03"
            self.workbenchState.appearance["pattern"] = "P06"
            self.applyDraft { applied in
                guard applied, self.appliedConfig?["palette"] as? String == "CC02",
                      self.appliedConfig?["eye"] as? String == "Y03",
                      self.appliedConfig?["pattern"] as? String == "P06" else {
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
                    guard self.verifyReminderPanel() else {
                        fputs("Reminder card failed to position above the pet\n", stderr)
                        exit(1)
                    }
                    guard self.verifyFocusSession() else {
                        fputs("Focus session did not run through focus, break and dismissal\n", stderr)
                        exit(1)
                    }
                    print("PASS: native workbench close and reopen, dog and cat configuration, cat recolor, face and eyes, walk mirror, typing and motion transitions, focus and break session")
                    NSApp.terminate(nil)
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
        if enabled {
            pollGaze()
        } else {
            petGaze = (0, 0)
            previewGaze = (0, 0)
            if ready { web.evaluateJavaScript("window.pet.gaze(0, 0)") }
            if previewReady { preview.evaluateJavaScript("window.pet.gaze(0, 0)") }
        }
    }

    private func startGazeTimer() {
        guard gazeTimer == nil else { return }
        // Common mode keeps the pupils tracking while windows are being dragged.
        let timer = Timer(timeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            self?.pollGaze()
        }
        RunLoop.main.add(timer, forMode: .common)
        gazeTimer = timer
    }

    private func pollGaze() {
        guard eyeFollow else { return }
        if ready, panel.isVisible {
            sendGaze(gazeOffset(for: web), to: web, last: &petGaze)
        }
        if previewReady, preview.window?.isVisible == true {
            sendGaze(gazeOffset(for: preview), to: preview, last: &previewGaze)
        }
    }

    private func sendGaze(_ offset: (x: Int, y: Int), to view: WKWebView, last: inout (x: Int, y: Int)?) {
        guard last?.x != offset.x || last?.y != offset.y else { return }
        last = offset
        view.evaluateJavaScript("window.pet.gaze(\(offset.x), \(offset.y))")
    }

    private func gazeOffset(for view: NSView) -> (x: Int, y: Int) {
        guard let window = view.window else { return (0, 0) }
        let frameOnScreen = window.convertToScreen(view.convert(view.bounds, to: nil))
        guard frameOnScreen.width > 0, frameOnScreen.height > 0 else { return (0, 0) }
        let mouse = NSEvent.mouseLocation
        let normalizedX = (mouse.x - frameOnScreen.minX) / frameOnScreen.width
        let normalizedY = (mouse.y - frameOnScreen.minY) / frameOnScreen.height
        // The canvas is 160 x 160; the cat's eyes sit around (80, 58).
        let dx = normalizedX * 160 - 80
        let dy = (1 - normalizedY) * 160 - 58
        let distance = (dx * dx + dy * dy).squareRoot()
        guard distance > 6 else { return (0, 0) }
        let gx = Int((dx / distance * 2.0).rounded())
        let gy = Int((dy / distance * 1.4).rounded())
        return (max(-2, min(2, gx)), max(-2, min(1, gy)))
    }

    // MARK: Reminder

    func windowDidResignKey(_ notification: Notification) {
        guard let window = notification.object as? NSWindow else { return }
        if window === reminderInputWindow {
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
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.suppressWorkbenchReopen = false
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
                onExtend: { [weak self] in self?.focus.extend() },
                onStop: { [weak self] in self?.focus.stop() },
                onStartBreak: { [weak self] in self?.focus.startBreak() },
                onStartFocus: { [weak self] in self?.focus.startFocus() },
                onSkipBreak: { [weak self] in self?.focus.skipBreak() },
                onDismiss: { [weak self] in self?.focus.dismiss() },
                onHideCard: { [weak self] in self?.focus.hideCard() },
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
        card.setContentSize(NSSize(width: 252, height: height))
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

    @objc private func startFocusFromMenu(_ sender: NSMenuItem) {
        focus.startFocus(minutes: sender.tag)
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
        let host = ReminderHostingView(rootView: ReminderInputCard(
            model: reminderInput,
            onSubmit: { [weak self] in self?.submitReminder() },
            onCancel: { [weak self] in self?.hideReminderInput() }
        ))
        fitCardHost(host, fallback: NSSize(width: 288, height: 44))
        let size = host.frame.size
        if reminderInputPetOrigin == nil, let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame {
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
    }

    private func matchingPreset(_ config: [String: Any]) -> String {
        if config["frame"] as? String == "CAT" {
            switch config["name"] as? String {
            case "三花猫": return "preset_cat_calico"
            case "暹罗猫": return "preset_cat_siamese"
            case "黑猫": return "preset_cat_black"
            case "橘猫": return "preset_cat_orange"
            default:
                switch config["palette"] as? String {
                case "CC02": return "preset_cat_black"
                case "CC03": return "preset_cat_calico"
                case "CC04": return "preset_cat_siamese"
                default: return "preset_cat_orange"
                }
            }
        }
        switch config["name"] as? String {
        case "比格犬": return "preset_m1_13"
        case "中华田园犬": return "preset_m1_14"
        default: return "preset_m1_12"
        }
    }

    private func choosePreset(_ id: String, completion: ((Bool) -> Void)? = nil) {
        presetRequest += 1
        let request = presetRequest
        preview.callAsyncJavaScript("return window.pet.preset(id)", arguments: ["id": id], in: nil, in: .page) { [weak self] result in
            guard let self, request == self.presetRequest, case .success(let value) = result,
                  let config = value as? [String: Any] else { completion?(false); return }
            self.workbenchState.preset = id
            self.setDraft(config)
            completion?(true)
        }
    }

    private func setDraft(_ config: [String: Any]) {
        draftTemplate = config
        workbenchState.update(config)
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
        guard ready, !workbenchState.applying else { completion(false); return }
        var draft = draftConfig()
        draft["breed"] = workbenchState.preset
        workbenchState.applying = true
        web.callAsyncJavaScript(
            "const valid = window.pet.normalize(config); window.pet.configure(valid); return valid;",
            arguments: ["config": draft], in: nil, in: .page
        ) { [weak self] result in
            guard let self else { return }
            self.workbenchState.applying = false
            switch result {
            case .success(let value):
                guard var config = value as? [String: Any] else { completion(false); return }
                config["breed"] = draft["breed"]
                self.appliedConfig = config
                if !self.isTest, let saved = try? JSONSerialization.data(withJSONObject: config) {
                    UserDefaults.standard.set(String(decoding: saved, as: UTF8.self), forKey: "shibaConfig")
                }
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

    private func configurePet(_ config: [String: Any]) {
        guard ready else { return }
        web.callAsyncJavaScript("window.pet.configure(config)", arguments: ["config": config], in: nil, in: .page)
    }

    private func showPet(_ visible: Bool) {
        UserDefaults.standard.set(visible, forKey: "shibaVisible")
        if visible {
            panel.orderFrontRegardless()
            if !reminderList.items.isEmpty { showReminders() }
            if focus.showsCard { showFocusCard() }
        } else {
            panel.orderOut(nil)
            hideReminders()
            hideReminderInput()
            hideFocusCard()
        }
    }

    private func resizePet(_ size: Double) {
        let corner = NSPoint(x: panel.frame.maxX, y: panel.frame.minY)
        panel.setContentSize(NSSize(width: size, height: size))
        panel.setFrameOrigin(NSPoint(x: corner.x - size, y: corner.y))
        UserDefaults.standard.set(size, forKey: "shibaSize")
        layoutReminder()
    }

    func applicationWillTerminate(_ notification: Notification) {
        typingRetry?.invalidate()
        gazeTimer?.invalidate()
        stopListening()
        if let localMonitor { NSEvent.removeMonitor(localMonitor) }
        if let reminderClickMonitor { NSEvent.removeMonitor(reminderClickMonitor) }
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
            send("key()")
        }
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
                    pet.send("key()")
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
        alert.informativeText = "桌宠默认同步打字。允许「输入监控」后，小猫就会跟着你的按键动起来。桌宠仅使用按键时机。"
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

    private func addFocusItems(to menu: NSMenu) {
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
            for minutes in FocusModel.durations {
                let option = options.addItem(
                    withTitle: "\(minutes) 分钟",
                    action: #selector(startFocusFromMenu(_:)),
                    keyEquivalent: ""
                )
                option.target = self
                option.tag = minutes
                option.state = minutes == focus.focusMinutes ? .on : .off
            }
            start.submenu = options
            menu.addItem(start)
            if focus.result == .focusFinished {
                menu.addItem(menuItem("休息 \(focus.breakMinutes) 分钟", #selector(startFocusBreak)))
            }
        }
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
        panel.setFrameOrigin(NSPoint(x: screen.maxX - panel.frame.width - 24, y: screen.minY + 20))
    }

    @objc private func quit() { NSApp.terminate(nil) }
}

let app = NSApplication.shared
let pet = DesktopPet()
app.delegate = pet
app.setActivationPolicy(.regular)
app.run()
