import AppKit
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
    private let web = PetView(frame: .zero)
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
        if let screen = NSScreen.main?.visibleFrame {
            panel.setFrameOrigin(NSPoint(x: screen.maxX - 264, y: screen.minY + 20))
        }

        status.button?.title = "柴犬"
        status.menu = makeMenu()
        guard let resources = Bundle.main.resourceURL else { NSApp.terminate(nil); return }
        web.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        if !isTest { panel.orderFrontRegardless() }
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if self?.keyboardTap == nil { self?.recordKey(event) }
            return event
        }
        if CGPreflightListenEventAccess() { startListening() }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        ready = true
        if isTest {
            web.callAsyncJavaScript("return await window.pet.check()", arguments: [:], in: nil, in: .page) { result in
                guard case .success(let value) = result, value as? String == "ready" else {
                    fputs("Desktop renderer failed: \(result)\n", stderr)
                    exit(1)
                }
                print("PASS: bundled WebKit sprite renderer")
                NSApp.terminate(nil)
            }
        } else if let config = UserDefaults.standard.string(forKey: "shibaConfig") {
            applyConfig(config)
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let tapSource { CFRunLoopRemoveSource(CFRunLoopGetMain(), tapSource, .commonModes) }
        if let keyboardTap { CFMachPortInvalidate(keyboardTap) }
        if let localMonitor { NSEvent.removeMonitor(localMonitor) }
    }

    private func send(_ command: String) {
        if ready { web.evaluateJavaScript("window.pet.\(command)") }
    }

    private func recordKey(_ event: NSEvent) {
        if event.modifierFlags.intersection([.command, .control]).isEmpty && !event.isARepeat {
            send("key()")
        }
    }

    @discardableResult
    private func startListening() -> Bool {
        if keyboardTap != nil { return true }
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
        return true
    }

    private func makeMenu() -> NSMenu {
        let menu = NSMenu()
        for (title, action) in [
            ("导入柴犬配置…", #selector(importConfig)),
            ("开启全局打字同步…", #selector(enableTyping)),
            ("将桌宠移回屏幕", #selector(resetPosition)),
            ("退出柴犬桌宠", #selector(quit)),
        ] {
            let item = menu.addItem(withTitle: title, action: action, keyEquivalent: "")
            item.target = self
        }
        return menu
    }

    @objc private func enableTyping() {
        if !(CGPreflightListenEventAccess() || CGRequestListenEventAccess()) || !startListening() {
            let alert = NSAlert()
            alert.messageText = "允许键盘活动同步"
            alert.informativeText = "在系统设置的「隐私与安全性 → 输入监控」中允许柴犬桌宠，重新打开应用。桌宠仅使用按键时机来播放打字动作。"
            alert.runModal()
        }
    }

    @objc private func importConfig() {
        let picker = NSOpenPanel()
        picker.allowedContentTypes = [.json]
        NSApp.activate(ignoringOtherApps: true)
        guard picker.runModal() == .OK, let url = picker.url, let config = try? String(contentsOf: url, encoding: .utf8) else { return }
        applyConfig(config)
    }

    private func applyConfig(_ config: String) {
        web.callAsyncJavaScript("window.pet.configure(JSON.parse(config))",
                                arguments: ["config": config], in: nil, in: .page) { result in
            if case .success = result {
                UserDefaults.standard.set(config, forKey: "shibaConfig")
            } else if case .failure(let error) = result {
                let alert = NSAlert(error: error)
                alert.messageText = "无法导入桌宠配置"
                alert.runModal()
            }
        }
    }

    @objc private func resetPosition() {
        guard let screen = NSScreen.main?.visibleFrame else { return }
        panel.setFrameOrigin(NSPoint(x: screen.maxX - 264, y: screen.minY + 20))
    }

    @objc private func quit() { NSApp.terminate(nil) }
}

let app = NSApplication.shared
let pet = DesktopPet()
app.delegate = pet
app.setActivationPolicy(.accessory)
app.run()
