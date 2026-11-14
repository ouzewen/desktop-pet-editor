import AppKit
import SwiftUI
import WebKit
import UniformTypeIdentifiers

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

final class DesktopPet: NSObject, NSApplicationDelegate, WKNavigationDelegate {
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
    private var ready = false
    private var isTest: Bool { CommandLine.arguments.contains("--self-test") }

    func applicationDidFinishLaunching(_ notification: Notification) {
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
        workbenchState.visible = prefs.object(forKey: "shibaVisible") as? Bool ?? (prefs.string(forKey: "shibaConfig") != nil)
        let savedSize = prefs.object(forKey: "shibaSize") as? Double ?? 240
        workbenchState.petSize = min(360, max(160, savedSize))
        panel.setContentSize(NSSize(width: workbenchState.petSize, height: workbenchState.petSize))
        resetPosition()

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
        if !isTest { refreshTypingListener() }
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        if !isTest { refreshTypingListener() }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
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
            if !isTest && workbenchState.visible { panel.orderFrontRegardless() }
            runSelfTestIfReady()
        }
    }

    private func configureWorkbench() {
        workbenchState.choosePreset = { [weak self] id in self?.choosePreset(id) }
        workbenchState.refresh = { [weak self] in self?.refreshPreview() }
        workbenchState.apply = { [weak self] in self?.applyDraft() }
        workbenchState.reset = { [weak self] in self?.resetPosition() }
        workbenchState.enableTyping = { [weak self] in self?.enableTyping() }
        workbenchState.importConfig = { [weak self] in self?.importConfig() }
        workbenchState.setSize = { [weak self] size in self?.resizePet(size) }
        workbenchState.setVisibility = { [weak self] visible in self?.showPet(visible) }
    }

    private func createWorkbench() {
        guard workbenchWindow == nil else { return }
        let host = NSHostingController(rootView: WorkbenchView(state: workbenchState, preview: preview))
        let window = NSWindow(contentViewController: host)
        window.title = "桌宠工作台"
        window.styleMask = [.titled, .closable, .miniaturizable, .resizable]
        window.setContentSize(NSSize(width: 940, height: 740))
        window.contentMinSize = NSSize(width: 840, height: 640)
        window.center()
        window.isReleasedWhenClosed = false
        workbenchWindow = window
    }

    @objc private func openWorkbench() {
        createWorkbench()
        NSApp.activate(ignoringOtherApps: true)
        workbenchWindow?.makeKeyAndOrderFront(nil)
    }

    private func loadAppearance() {
        preview.callAsyncJavaScript(
            """
            const fallback = window.pet.preset(isTest ? "preset_m1_12" : "preset_cat_orange");
            let config = fallback;
            try {
                if (saved) {
                    const parsed = JSON.parse(saved);
                    config = {...window.pet.normalize(parsed), breed: parsed.breed};
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
                    print("PASS: native workbench, dog and cat configuration, cat recolor, face and eyes, walk mirror, typing and motion transitions")
                    NSApp.terminate(nil)
                }
            }
        }
    }

    private func matchingPreset(_ config: [String: Any]) -> String {
        if config["frame"] as? String == "CAT" {
            switch config["name"] as? String {
            case "三花猫": return "preset_cat_calico"
            case "黑猫": return "preset_cat_black"
            case "橘猫": return "preset_cat_orange"
            default:
                switch config["palette"] as? String {
                case "CC02": return "preset_cat_black"
                case "CC03": return "preset_cat_calico"
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
        if visible { panel.orderFrontRegardless() } else { panel.orderOut(nil) }
    }

    private func resizePet(_ size: Double) {
        let corner = NSPoint(x: panel.frame.maxX, y: panel.frame.minY)
        panel.setContentSize(NSSize(width: size, height: size))
        panel.setFrameOrigin(NSPoint(x: corner.x - size, y: corner.y))
        UserDefaults.standard.set(size, forKey: "shibaSize")
    }

    func applicationWillTerminate(_ notification: Notification) {
        stopListening()
        if let localMonitor { NSEvent.removeMonitor(localMonitor) }
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
        if let keyboardTap, CFMachPortIsValid(keyboardTap) {
            CGEvent.tapEnable(tap: keyboardTap, enable: true)
            return CGEvent.tapIsEnabled(tap: keyboardTap)
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

    @discardableResult
    private func refreshTypingListener() -> Bool {
        let allowed = CGPreflightListenEventAccess()
        if !allowed { stopListening() }
        let enabled = allowed && startListening()
        workbenchState.typingStatus = enabled ? "全局打字同步已开启"
            : allowed ? "打字同步未连接" : "打字同步需要「输入监控」授权"
        return enabled
    }

    private func makeMenu() -> NSMenu {
        let menu = NSMenu()
        for (title, action) in [
            ("打开工作台", #selector(openWorkbench)),
            ("导入配置…", #selector(importConfig)),
            ("开启全局打字同步…", #selector(enableTyping)),
            ("将桌宠移回屏幕", #selector(resetPosition)),
            ("退出桌宠", #selector(quit)),
        ] {
            let item = menu.addItem(withTitle: title, action: action, keyEquivalent: "")
            item.target = self
        }
        return menu
    }

    @objc private func enableTyping() {
        workbenchState.message = ""
        if refreshTypingListener() { return }
        if !CGPreflightListenEventAccess() {
            _ = CGRequestListenEventAccess()
            if refreshTypingListener() { return }
        }

        let alert = NSAlert()
        if CGPreflightListenEventAccess() {
            alert.messageText = "无法启动打字同步"
            alert.informativeText = "macOS 已授权输入监控，但键盘监听未启动。请退出并重新打开桌宠。"
            alert.runModal()
        } else {
            alert.messageText = "打字同步需要输入监控"
            alert.informativeText = "请在「输入监控」中开启当前运行的桌宠，回到工作台点「打字同步…」检查状态。桌宠只使用按键时机来播放动画。"
            alert.addButton(withTitle: "打开输入监控")
            alert.addButton(withTitle: "稍后")
            if alert.runModal() == .alertFirstButtonReturn,
               let settings = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent") {
                NSWorkspace.shared.open(settings)
            }
        }
    }

    @objc private func importConfig() {
        let picker = NSOpenPanel()
        picker.allowedContentTypes = [.json]
        NSApp.activate(ignoringOtherApps: true)
        guard picker.runModal() == .OK, let url = picker.url, let config = try? String(contentsOf: url, encoding: .utf8) else { return }
        openWorkbench()
        presetRequest += 1
        preview.callAsyncJavaScript("return window.pet.normalize(JSON.parse(config))",
            arguments: ["config": config], in: nil, in: .page
        ) { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let value):
                guard let config = value as? [String: Any] else { return }
                self.workbenchState.preset = self.matchingPreset(config)
                self.setDraft(config)
                self.workbenchState.message = "已导入，可预览后应用"
            case .failure:
                self.workbenchState.message = "无法导入宠物配置"
            }
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
app.setActivationPolicy(.accessory)
app.run()
