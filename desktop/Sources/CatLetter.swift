import AppKit
import SwiftUI

/// Reads session state and an elapsed interval. No event tap or input payloads.
final class CatLetterObserver {
    static let enabledKey = "catLetter.enabled"

    private let storage: CatLetterStorage
    let diary: CatLetterDiary
    private let defaults: UserDefaults
    private var timer: Timer?
    private var observers: [NSObjectProtocol] = []
    private var machineSleeping = false
    private var screensSleeping = false
    private var sessionInactive = false
    private var protectedDataUnavailable = false
    private var saved: CatLetterState
    var onSample: (Date) -> Void = { _ in }

    var enabled: Bool {
        defaults.object(forKey: Self.enabledKey) == nil || defaults.bool(forKey: Self.enabledKey)
    }

    init(directory: URL, defaults: UserDefaults = .standard) {
        storage = CatLetterStorage(file: directory.appendingPathComponent("cat-letter-days.json"))
        self.defaults = defaults
        let state = storage.load()
        saved = state
        diary = CatLetterDiary(state: state)
    }

    func setEnabled(_ enabled: Bool, launch: Date) {
        if !enabled { stop() }
        defaults.set(enabled, forKey: Self.enabledKey)
        if enabled { start(launch: launch) }
    }

    func start(launch: Date) {
        guard enabled, timer == nil else { return }
        if diary.dayKey(launch) == diary.dayKey(Date()) { diary.markLaunch(launch) }
        let center = NSWorkspace.shared.notificationCenter
        for name in [NSWorkspace.willSleepNotification, NSWorkspace.didWakeNotification,
                     NSWorkspace.screensDidSleepNotification, NSWorkspace.screensDidWakeNotification,
                     NSWorkspace.sessionDidResignActiveNotification, NSWorkspace.sessionDidBecomeActiveNotification] {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.workspaceChanged(name)
            })
        }
        diary.cut(at: ProcessInfo.processInfo.systemUptime)
        let timer = Timer(timeInterval: CatLetterDiary.samplingInterval, repeats: true) { [weak self] _ in
            self?.tick()
        }
        timer.tolerance = 2
        self.timer = timer
        RunLoop.main.add(timer, forMode: .common)
        tick()
    }

    func stop() {
        if timer != nil { sample(publish: false) }
        timer?.invalidate()
        timer = nil
        for observer in observers { NSWorkspace.shared.notificationCenter.removeObserver(observer) }
        observers.removeAll()
        machineSleeping = false
        screensSleeping = false
        sessionInactive = false
        protectedDataUnavailable = false
        diary.cut(at: ProcessInfo.processInfo.systemUptime)
        flush()
    }

    func protectedDataChanged(available: Bool) {
        guard timer != nil else { return }
        protectedDataUnavailable = !available
        resetUse()
    }

    func tick() {
        guard timer != nil else { return }
        sample()
    }

    private func workspaceChanged(_ name: Notification.Name) {
        switch name {
        case NSWorkspace.willSleepNotification:
            machineSleeping = true
            resetAfterSleep()
            return
        case NSWorkspace.didWakeNotification:
            machineSleeping = false
            resetAfterSleep()
            return
        case NSWorkspace.screensDidSleepNotification: screensSleeping = true
        case NSWorkspace.screensDidWakeNotification: screensSleeping = false
        case NSWorkspace.sessionDidResignActiveNotification: sessionInactive = true
        case NSWorkspace.sessionDidBecomeActiveNotification: sessionInactive = false
        default: return
        }
        resetUse()
    }

    private func resetUse() {
        diary.resetUse(at: ProcessInfo.processInfo.systemUptime)
        tick()
    }

    private func resetAfterSleep() {
        diary.cut(at: ProcessInfo.processInfo.systemUptime)
        tick()
    }

    private func sample(publish: Bool = true) {
        let now = Date()
        let uptime = ProcessInfo.processInfo.systemUptime
        let session = CGSessionCopyCurrentDictionary() as? [String: Any]
        let onConsole = session?[kCGSessionOnConsoleKey as String] as? Bool == true
        let loginDone = session?[kCGSessionLoginDoneKey as String] as? Bool == true
        let eligible = onConsole && loginDone && NSApp.isProtectedDataAvailable
            && !protectedDataUnavailable && !machineSleeping && !screensSleeping && !sessionInactive
            && NSScreen.screens.contains { screen in
                guard let id = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber else { return false }
                return CGDisplayIsAsleep(id.uint32Value) == 0
            }
        // The public kCGAnyInputEventType token (0xffffffff) is not imported by Swift.
        let anyInput = CGEventType(rawValue: UInt32.max)!
        let idle = eligible ? CGEventSource.secondsSinceLastEventType(.hidSystemState, eventType: anyInput) : .infinity
        diary.capture(.init(date: now, uptime: uptime, eligible: eligible, idle: idle))
        if publish { onSample(now) }
        flush()
    }

    func deliver(_ receipt: CatLetterReceipt) -> Bool {
        diary.recordDelivery(receipt, save: commit)
    }

    private func flush() {
        if saved != diary.state { _ = commit(diary.state) }
    }

    private func commit(_ state: CatLetterState) -> Bool {
        guard storage.save(state) else { return false }
        saved = state
        return true
    }
}

struct CatLetterEnvelope: View {
    static let padding = NSSize(width: 4, height: 6)
    static let imageSize = NSSize(width: 52, height: 38)
    static let size = NSSize(width: imageSize.width + 2 * padding.width, height: imageSize.height + 2 * padding.height)
    let sender: CatLetterSender
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            CatLetterGlyph()
                .frame(width: Self.imageSize.width, height: Self.imageSize.height)
                .frame(width: Self.size.width, height: Self.size.height)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(verbatim: "打开" + sender.title))
        .help(Text(verbatim: sender.title))
    }
}

struct CatLetterCard: View {
    let sender: CatLetterSender
    let message: String
    let address: String
    let close: () -> Void
    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    private var palette: PixelPalette { theme.windowPalette }
    private let ruleHeight: CGFloat = 28
    private let messageSize: CGFloat = 16

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                CatLetterGlyph().frame(width: 15, height: 11)
                Text(verbatim: sender.title)
                    .font(WorkbenchTypography.pageTitle)
                    .accessibilityAddTraits(.isHeader)
                    .foregroundStyle(palette.ink)
                Spacer()
                WorkbenchCardIconButton(glyph: .close, title: "关闭来信", palette: palette, action: close)
            }
            HStack(alignment: .top, spacing: 11) {
                Rectangle()
                    .fill(palette.border)
                    .frame(width: 1)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: ruleHeight) {
                    Text(verbatim: (address.isEmpty ? "" : "\(address)，") + message)
                        .font(.system(size: messageSize))
                        .foregroundStyle(palette.ink)
                        .lineSpacing(lineSpacing)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(minHeight: 3 * ruleHeight, alignment: .topLeading)
                    Text(verbatim: sender.signature)
                        .font(.system(size: messageSize))
                        .foregroundStyle(palette.accent)
                        .frame(maxWidth: .infinity, minHeight: ruleHeight, alignment: .trailing)
                }
                .padding(.top, 3)
                .background {
                    Canvas { context, size in
                        for baseline in stride(from: ruleHeight - 1, to: size.height, by: ruleHeight) {
                            let rule = CGRect(x: 0, y: baseline, width: size.width, height: 1)
                            context.fill(Path(rule), with: .color(palette.borderSoft))
                        }
                    }
                    .accessibilityHidden(true)
                }
            }
            .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 22)
        .frame(width: 360)
        .workbenchCardSurface(theme)
    }

    private var lineSpacing: CGFloat {
        let font = NSFont.systemFont(ofSize: messageSize)
        return max(0, ruleHeight - NSLayoutManager().defaultLineHeight(for: font))
    }
}

private struct CatLetterGlyph: View {
    private static let sprite = Bundle.main.url(forResource: "CatLetterEnvelope", withExtension: "png")
        .flatMap { NSImage(contentsOf: $0) }

    var body: some View {
        if let sprite = Self.sprite {
            Image(nsImage: sprite)
                .resizable()
                .interpolation(.none)
                .accessibilityHidden(true)
        }
    }
}
