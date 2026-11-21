import UniformTypeIdentifiers
import AppKit
import Carbon
import CoreText
import ServiceManagement
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

private final class MeetingRecordingDot: NSView {
    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    override func draw(_ dirtyRect: NSRect) {
        NSColor.white.withAlphaComponent(0.9).setFill()
        NSBezierPath(ovalIn: bounds).fill()
        NSColor(srgbRed: 0.92, green: 0.19, blue: 0.23, alpha: 1).setFill()
        NSBezierPath(ovalIn: bounds.insetBy(dx: 1, dy: 1)).fill()
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
    var onDoubleClick: ([Double], [Double]) -> Void = { _, _ in }
    /// True while the focus card is pinned: the pet stays put when dragged.
    var isLocked: () -> Bool = { false }
    private(set) var isDragging = false
    private var start: NSPoint?
    private var firstClick: [Double]?
    private var moved = false
    private(set) var clickRevision = 0
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
        guard let window else { return }
        let point = window.convertPoint(toScreen: event.locationInWindow)
        start = point
        moved = false
        isDragging = false
        previousX = point.x
        previousDragTimestamp = event.timestamp
        if !isLocked() { send("beginDrag()") }
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start, let window else { return }
        let point = window.convertPoint(toScreen: event.locationInWindow)
        if !moved {
            guard hypot(point.x - start.x, point.y - start.y) >= 4 else { return }
            moved = true
            invalidateClickSequence()
        }
        guard !isLocked() else { return }
        if !isDragging {
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
        guard let start, let window else { return }
        let wasDragging = isDragging
        let releasedAt = window.convertPoint(toScreen: event.locationInWindow)
        self.start = nil
        isDragging = false
        send("release()")
        if wasDragging {
            if !isLocked() { onDragEnd(releasedAt) }
            return
        }
        let point = convert(event.locationInWindow, from: nil)
        guard !moved, hypot(releasedAt.x - start.x, releasedAt.y - start.y) < 4, bounds.contains(point) else {
            invalidateClickSequence()
            return
        }
        let y = isFlipped ? point.y - bounds.minY : bounds.maxY - point.y
        let location = [Double((point.x - bounds.minX) / bounds.width), Double(y / bounds.height)]
        if event.clickCount == 1 {
            firstClick = location
        } else {
            let first = firstClick
            firstClick = nil
            if event.clickCount == 2, let first { onDoubleClick(first, location) }
        }
    }

    private func invalidateClickSequence() {
        firstClick = nil
        clickRevision += 1
    }

    func cancelPointerInteraction() {
        invalidateClickSequence()
        if start != nil { send("release()") }
        start = nil
        isDragging = false
    }

    override func rightMouseDown(with event: NSEvent) {
        invalidateClickSequence()
        NSMenu.popUpContextMenu(menuForPet(), with: event, for: self)
    }
}

enum DesktopPetStorage {
    static let pixel80Preview = Bundle.main.object(forInfoDictionaryKey: "PetPixel80Preview") as? Bool == true
    static let directoryName = pixel80Preview ? "DesktopPet-Pixel80" : "DesktopPet"
}

final class DesktopPet: NSObject, NSApplicationDelegate, WKNavigationDelegate, NSWindowDelegate, NSMenuDelegate {
    private let panel = PetPanel(
        contentRect: NSRect(x: 0, y: 0, width: 240, height: 240),
        styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false
    )
    private var edgePlacement: PetEdgePlacement?
    private var restingPlacement: PetPlacement?
    private var actionReturnPlacement: PetEdgePlacement?
    private var actionRun = 0
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
        return WorkbenchPreviewWebView(frame: .zero, configuration: config)
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
    private var pendingBrush: PixelEditSnapshot?
    private let catPhotoClient = CatPhotoClient()
    private let activeBrushID = "__active_appearance__"
    private var activeBrushURL: URL {
        PixelPresetStore.folder.deletingLastPathComponent().appendingPathComponent("active-appearance.png")
    }
    private var customSelectionRequest = 0
    private var presetRequest = 0
    private let status = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private var petHiddenHintWindow: PetPanel?
    private static let petHiddenHintKey = "didShowPetHiddenHint"
    private var keyboardTap: CFMachPort?
    private var tapSource: CFRunLoopSource?
    private var inputRefreshTimer: Timer?
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
    private var selectionReadTask: DispatchWorkItem?
    private var translationRequest: UUID?
    private var translationDismissMonitor: Any?
    private var translationTrustRequested = false
    private lazy var chatMemory = PetMemory()
    private lazy var chatBrain = ChatBrain(memory: chatMemory)
    private var chatModel: ChatModel?
    private var chatWindow: ReminderPanel?
    private var chatDismissMonitor: Any?
    private var dropView: DropView?
    private var dropChoiceWindow: ReminderPanel?
    private var dropChoiceURL: URL?
    private var dropChoiceKind: FileKind = .unsupported
    private var dropChoiceMonitor: Any?
    private var dropChoiceLocalMonitor: Any?
    private lazy var fileOrganizer = FileOrganizerWindow(activate: { [weak self] in self?.activateForPetUI() })
    @available(macOS 26, *)
    private var meetingRecorder: MeetingRecorder {
        if let live = meetingRecorderStorage as? MeetingRecorder { return live }
        let recorder = MeetingRecorder { [weak self] recording in
            self?.meetingStateChanged(recording: recording)
        }
        meetingRecorderStorage = recorder
        return recorder
    }
    private var meetingRecorderStorage: Any?
    private let meetingRecordingDot = MeetingRecordingDot(frame: .zero)
    private var quickBarWindow: ReminderPanel?
    private var quickBarTimer: Timer?
    private var quickBarLeaveAt: Date?
    private var trashToastWindow: ReminderPanel?
    private var trashToastHide: DispatchWorkItem?
    private var pixel80ReviewFolder: URL? {
        guard let index = CommandLine.arguments.firstIndex(of: "--pixel80-review"),
              CommandLine.arguments.indices.contains(index + 1) else { return nil }
        return URL(fileURLWithPath: CommandLine.arguments[index + 1], isDirectory: true)
    }
    private var isTest: Bool { CommandLine.arguments.contains("--self-test") || pixel80ReviewFolder != nil }
    private var appUpdates: AppUpdates?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let launchReason = NSAppleEventManager.shared().currentAppleEvent?
            .paramDescriptor(forKeyword: keyAEPropData)?.enumCodeValue
        if !isTest, Bundle.main.object(forInfoDictionaryKey: "SUFeedURL") != nil {
            do {
                let updates = AppUpdates { [weak self] version in
                    self?.workbenchState.availableUpdateVersion = version
                }
                updates.onSessionProgressChanged = { [weak self] inProgress in
                    self?.workbenchState.updateSessionInProgress = inProgress
                }
                try updates.start()
                appUpdates = updates
                workbenchState.checkUpdate = { [weak updates] in updates?.checkForUpdatesFromWorkbench() }
                workbenchState.installUpdate = { [weak updates] in updates?.installOfferedUpdate() }
            } catch {
                NSLog("Failed to start Sparkle: %@", error.localizedDescription)
            }
        }
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
        web.menuForPet = { [weak self] in self?.makeMenu(fromStatusBar: false) ?? NSMenu() }
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
        meetingRecordingDot.frame = NSRect(x: container.bounds.maxX - 17, y: container.bounds.maxY - 17,
                                          width: 8, height: 8)
        meetingRecordingDot.autoresizingMask = [.minXMargin, .minYMargin]
        meetingRecordingDot.isHidden = true
        container.addSubview(meetingRecordingDot, positioned: .above, relativeTo: web)
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
        web.onDoubleClick = { [weak self] first, second in self?.playPetLove(first: first, second: second) }
        web.isLocked = { [weak self] in self?.focus.pinned ?? false }
        configureWorkbench()
        let prefs = UserDefaults.standard
        eyeFollow = prefs.object(forKey: "shibaEyeFollow") as? Bool ?? true
        workbenchState.eyeFollow = eyeFollow
        workbenchState.typingAnimationEnabled = prefs.bool(forKey: "typingAnimationEnabled")
        workbenchState.typingStatsEnabled = prefs.bool(forKey: "typingStatsEnabled")
        workbenchState.showTypingStats = prefs.object(forKey: "showTypingStats") as? Bool ?? true
        workbenchState.selectionTranslationEnabled = TranslationEngine.isAvailable && prefs.bool(forKey: "selectionTranslationEnabled")
        loadReminders()
        workbenchState.visible = prefs.object(forKey: "shibaVisible") as? Bool ?? (prefs.string(forKey: "shibaConfig") != nil)
        let savedSize = prefs.object(forKey: "shibaSize") as? Double ?? 240
        workbenchState.petSize = min(320, max(120, savedSize))
        panel.setContentSize(NSSize(width: workbenchState.petSize, height: workbenchState.petSize))
        if !isTest, let data = prefs.data(forKey: "petRestingPlacement"),
           let saved = try? JSONDecoder().decode(PetPlacement.self, from: data) {
            restorePetPlacement(saved)
        } else {
            resetPosition()
        }
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
            self.send("setListening(\(name != nil))")
            self.status.menu = self.makeMenu()
        }

        status.button?.title = ""
        status.button?.image = makeStatusIcon()
        status.button?.imagePosition = .imageOnly
        status.button?.toolTip = "桌宠"
        status.button?.setAccessibilityLabel("桌宠")
        status.menu = makeMenu()
        if CommandLine.arguments.contains("--self-test") {
            guard verifyMenuStructure() else {
                fputs("Desktop pet menu structure or hidden chat entry failed\n", stderr)
                exit(1)
            }
            print("PASS: pet context and menu bar groups, conditional reminders, meeting actions and statuses, hidden chat entry")
        }
        guard let resources = Bundle.main.resourceURL else { NSApp.terminate(nil); return }
        web.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        preview.setValue(false, forKey: "drawsBackground")
        preview.navigationDelegate = self
        preview.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        if pixel80ReviewFolder != nil {
            openWorkbench()
        } else if isTest {
            createWorkbench()
        } else if launchReason != keyAELaunchedAsLogInItem {
            openWorkbench()
        }
        #if DEBUG
        runChatSmokeIfRequested()
        #endif
        startWeatherTimer()
        music.start()
        clipboard.start()
        if !isTest { startQuickBarTimer() }
        reminderClickMonitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
            self?.dismissTransientReminderUI(at: NSEvent.mouseLocation)
            return event
        }
        if !isTest {
            setupInputFeatures()
            startGazeTimer()
        }
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        if !isTest { refreshInputFeatures() }
    }

    func applicationDidResignActive(_ notification: Notification) {
        hideReminderInput()
        if reminderList.isAdding {
            reminderList.isAdding = false
            reminderList.draft = ""
        }
    }

    func applicationDidChangeScreenParameters(_ notification: Notification) {
        guard !web.isDragging, !PetDisplay.connected.isEmpty else { return }
        hideQuickBar()
        hideReminderInput()
        actionReturnPlacement = nil
        guard workbenchState.petIsVisible else { return }
        if let restingPlacement {
            restorePetPlacement(restingPlacement)
        } else {
            resetPosition()
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
            send("setListening(\(music.activeApp != nil))")
            if let appliedConfig { configurePet(appliedConfig) }
            if let appliedCustom { applyCustomOverlay(appliedCustom.snapshot, in: web) }
            if let edge = edgePlacement?.edge { send("setEdge('\(edge.rawValue)')") }
            if !isTest { refreshPetVisibility() }
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
        workbenchState.renderCoatThumbnails = { [weak self] in
            await self?.renderCoatThumbnails() ?? [:]
        }
        workbenchState.changeCustomMode = { [weak self] mode in self?.changeCustomMode(mode) }
        workbenchState.chooseCatPhoto = { [weak self] slot in self?.chooseCatPhoto(slot: slot) }
        workbenchState.generateFromCatPhoto = { [weak self] in self?.generateFromCatPhoto() }
        workbenchState.saveCustomAppearance = { [weak self] name, done in
            guard let self else { done(false); return }
            self.saveCustomAppearance(name, completion: done)
        }
        workbenchState.chooseCustom = { [weak self] preset in self?.previewCustomPreset(preset) }
        workbenchState.clearCustom = { [weak self] in self?.clearCustomPreview() }
        workbenchState.deleteCustom = { [weak self] preset in self?.confirmDeleteCustom(preset) }
        if !isTest, !DesktopPetStorage.pixel80Preview {
            do {
                try PixelPresetStore.migrateCheckoutPresets()
            } catch {
                workbenchState.message = "迁移旧自定义形象失败"
            }
        }
        reloadCustomPresets()
        workbenchState.refresh = { [weak self] in self?.refreshPreview() }
        workbenchState.apply = { [weak self] in
            guard let self else { return }
            self.stageBrush(nextMode: nil) { staged in
                if staged { self.applyDraft() }
            }
        }
        workbenchState.reset = { [weak self] in self?.resetPosition() }
        workbenchState.setTypingAnimation = { [weak self] enabled in self?.setTypingAnimation(enabled) }
        workbenchState.setTypingStats = { [weak self] enabled in self?.setTypingStats(enabled) }
        workbenchState.setShowTypingStats = { [weak self] visible in
            self?.workbenchState.showTypingStats = visible
            UserDefaults.standard.set(visible, forKey: "showTypingStats")
            if visible { self?.typingActivity.refreshToday() }
        }
        workbenchState.setSelectionTranslation = { [weak self] enabled in self?.setSelectionTranslation(enabled) }
        workbenchState.openInputSettings = { [weak self] in self?.openInputMonitoringSettings() }
        workbenchState.openAccessibilitySettings = { [weak self] in self?.openAccessibilitySettings() }
        workbenchState.setSize = { [weak self] size in self?.resizePet(size) }
        workbenchState.setVisibility = { [weak self] visible in self?.showPet(visible, userInitiated: true) }
        workbenchState.setEyeFollow = { [weak self] enabled in self?.setEyeFollow(enabled) }
    }

    private func createWorkbench() {
        guard workbenchWindow == nil else { return }
        let meetingPage: ((PixelPalette) -> AnyView)?
        if #available(macOS 26, *) {
            let recorder = meetingRecorder
            meetingPage = { palette in AnyView(MeetingWorkbenchView(model: recorder, palette: palette)) }
        } else {
            meetingPage = nil
        }
        let host = NSHostingController(rootView: WorkbenchView(
            state: workbenchState, preview: preview, typingActivity: typingActivity, meetingPage: meetingPage
        ))
        let window = NSWindow(contentViewController: host)
        window.title = DesktopPetStorage.pixel80Preview ? "桌宠工作台 · 80 像素测试版" : "桌宠工作台"
        window.styleMask = [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView]
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.acceptsMouseMovedEvents = true
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
        addUpdateItem(to: appMenu)
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
            self.loadAppearanceThumbnails()
            self.runSelfTestIfReady()
        }
    }

    private func loadAppearanceThumbnails() {
        guard workbenchState.thumbnails == nil else { return }
        preview.callAsyncJavaScript("return JSON.stringify(await window.pet.appearanceThumbnails())",
                                    arguments: [:], in: nil, in: .page) { [weak self] result in
            do {
                guard let json = try result.get() as? String else {
                    NSLog("Workbench thumbnail renderer returned an invalid response")
                    return
                }
                self?.workbenchState.thumbnails = try AppearanceThumbnails(data: Data(json.utf8))
            } catch {
                NSLog("Could not load workbench thumbnails: %@", error.localizedDescription)
            }
        }
    }

    @MainActor
    private func renderCoatThumbnails() async -> [String: NSImage] {
        guard previewReady, !draftTemplate.isEmpty else { return [:] }
        var config = draftConfig()
        config["name"] = "预览"
        do {
            let value: Any = try await withCheckedThrowingContinuation { continuation in
                preview.callAsyncJavaScript(
                    "return JSON.stringify(await window.pet.coatThumbnails(config))",
                    arguments: ["config": config], in: nil, in: .page
                ) { continuation.resume(with: $0) }
            }
            guard let json = value as? String else { return [:] }
            let pngs = try JSONDecoder().decode([String: Data].self, from: Data(json.utf8))
            return pngs.compactMapValues(NSImage.init(data:))
        } catch {
            NSLog("Could not load workbench coat thumbnails: %@", error.localizedDescription)
            return [:]
        }
    }

    private var selfTestStarted = false
    private func runSelfTestIfReady() {
        guard isTest, ready, workbenchState.catalog != nil, workbenchWindow != nil, !selfTestStarted else { return }
        selfTestStarted = true
        if let review = pixel80ReviewFolder {
            runPixel80Review(in: review)
            return
        }
        guard verifyPetVisibility() else {
            fputs("Hidden pet hint, menu or recall placement failed\n", stderr)
            exit(1)
        }
        print("PASS: first user hide hint, both hidden states, menu bar recall, original placement and offscreen fallback")
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

    private func runPixel80Review(in folder: URL) {
        let ids = ["orange", "black", "calico", "siamese", "british_blue", "american_shorthair", "li_hua", "ragdoll",
                   "CC09", "CC10", "CC11", "CC12"]
        func fail(_ message: String) -> Never {
            fputs("80px native review failed: \(message)\n", stderr)
            exit(1)
        }
        func reviewStorage(_ index: Int, _ presets: [CustomPresetInfo]) {
            guard index < presets.count else {
                workbenchState.action = "listening"
                preview.callAsyncJavaScript(
                    """
                    await window.pet.setCustom(null);
                    function checkAction(action, limit, step, minimum) {
                        window.pet.preview(config, action);
                        const frames = new Set();
                        for (let elapsed = 0; elapsed <= limit; elapsed += step) {
                            frames.add(window.pet.checkPixel80PreviewFrame(elapsed).hash);
                        }
                        if (frames.size < minimum) throw Error('工作台 ' + action + ' 预览仅采集到 ' + frames.size + ' 个不同画面');
                    }
                    checkAction('sit', 0, 1, 1);
                    checkAction('typing-gentle', 4480, 70, 16);
                    checkAction('typing-fast', 2560, 40, 24);
                    checkAction('typing', 1280, 20, 24);
                    checkAction('listening', 1725, 75, 18);
                    checkAction('shredder', 1600, 28, 10);
                    checkAction('zip', 2040, 28, 13);
                    checkAction('convert', 2490, 28, 15);
                    const saved = window.pet.checkPixel80PreviewFrame(2500);
                    if (saved.source?.artVersion !== 'pixel80-v2' || saved.source?.action !== 'sit') {
                        throw Error('80×80 自定义存档缺少原稿版本');
                    }
                    return JSON.stringify(await window.pet.checkPixel80Review());
                    """,
                    arguments: ["config": draftConfig()], in: nil, in: .page
                ) { result in
                    guard case .success(let value) = result, let json = value as? String else { fail(String(describing: result)) }
                    do {
                        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                        try Data(json.utf8).write(to: folder.appendingPathComponent("review.json"), options: .atomic)
                    } catch { fail(error.localizedDescription) }
                    print("PASS: \(ids.count) native presets, native key dispatch, \(ids.count * 64 * 3) typing frames, 24 typing speed checks, 3 controlled legacy ink cases, \(presets.count) existing presets opened read-only")
                    print("PASS: 5 nose shapes and 5 mouth shapes across 4 coats")
                    print("PASS: live workbench listening preview, \(ids.count * 23) listening frames, 6 headphone colors")
                    print("PASS: live workbench shredder preview, \(ids.count * 12) shredder frames and front lip checks")
                    print("PASS: live workbench archive preview, \(ids.count * 18) compression frames and front rim checks")
                    print("PASS: live workbench conversion preview, \(ids.count * 20) conversion frames, input and output occlusion checks")
                    print("PASS: action transitions and pixel80 save metadata")
                    exit(0)
                }
                return
            }
            guard let snapshot = try? PixelPresetStore.read(presets[index].url) else { fail("existing preset is unreadable") }
            let png = "data:image/png;base64,\(snapshot.png.base64EncodedString())"
            let source = snapshot.source.map { String(decoding: $0, as: UTF8.self) } ?? ""
            preview.callAsyncJavaScript(
                "const config = source ? JSON.parse(source) : null; return !!(await window.pet.setCustom(png, config))",
                arguments: ["png": png, "source": source], in: nil, in: .page
            ) { result in
                guard case .success(let value) = result, value as? Bool == true else { fail("existing preset failed to open") }
                reviewStorage(index + 1, presets)
            }
        }
        func reviewPreset(_ index: Int) {
            guard index < ids.count else {
                let old = PixelPresetStore.folder.deletingLastPathComponent().deletingLastPathComponent()
                    .appendingPathComponent("DesktopPet/custom", isDirectory: true)
                reviewStorage(0, PixelPresetStore.load(from: old))
                return
            }
            choosePreset("preset_cat_" + ids[index]) { selected in
                guard selected, self.workbenchState.appearance["innerPupil"] == "none" else { fail("single pupil preset selection") }
                let mix: [String: String]
                switch index {
                case 0: mix = ["ear": "CE02", "tail": "CT06", "accessory": "A01"]
                case 2: mix = ["ear": "CE04", "tail": "CT07", "accessory": "A03"]
                case 4: mix = ["ear": "CE03", "tail": "CT09", "accessory": "A02"]
                case 8: mix = ["ear": "CE05", "tail": "CT08", "accessory": "A07"]
                default: mix = [:]
                }
                for (field, value) in mix { self.workbenchState.appearance[field] = value }
                self.applyDraft { applied in
                    guard applied, self.appliedConfig?["frame"] as? String == "CAT" else { fail("preset application") }
                    guard mix.allSatisfy({ self.appliedConfig?[$0.key] as? String == $0.value }) else {
                        fail("ear, tail and accessory mix")
                    }
                    if index == 0 {
                        self.workbenchState.typingStatus = .active
                        self.workbenchState.typingAnimationEnabled = true
                        self.handleTypingKey()
                        self.web.callAsyncJavaScript(
                            """
                            await new Promise(resolve => setTimeout(resolve, 45));
                            return await window.pet.checkPixel80Key();
                            """,
                            arguments: [:], in: nil, in: .page
                        ) { result in
                            guard case .success(let value) = result, value as? Bool == true else { fail("native key dispatch did not show the laptop") }
                            reviewPreset(index + 1)
                        }
                    } else { reviewPreset(index + 1) }
                }
            }
        }
        workbenchState.action = "sit"
        reviewPreset(0)
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
                  let headphoneColors = fields?["headphoneColor"],
                  headphoneColors.count == 6,
                  headphoneColors.first?.id == "natural",
                  headphoneColors.allSatisfy({ $0.colors?.count == 1 }),
                  noseColors.contains(where: { $0.id == "natural" }),
                  noseColors.contains(where: { $0.id == "plum" && $0.colors?.count == 1 }) else {
                fputs("Workbench could not load the ear, nose, mouth and headphone appearance menus\n", stderr)
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
            self.workbenchState.appearance["headphoneColor"] = "mint"
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
                      self.appliedConfig?["headphoneColor"] as? String == "mint",
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
                    guard self.verifyPetDoubleClick() else {
                        fputs("Pet double-click input regression\n", stderr)
                        exit(1)
                    }
                    print("PASS: AppKit second left mouse-up, single clicks, drags, locked position and click cancellation")
                    guard self.verifyPetEdgeDragging() else {
                        fputs("Dragging did not snap to a display edge or restore the full pet\n", stderr)
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
                            print("PASS: native workbench close and reopen, dog and cat configuration, cat recolor, face and eyes, walk mirror, three-edge dragging, typing and motion transitions, focus and break session, weather advice and card, music detection, clipboard history, translation panels, chat routing, trash, quick bar, file actions, pixel editor preview and part-based preset storage")
                            NSApp.terminate(nil)
                        }
                    }
                }
            }
        }
    }

    private func verifyMenuStructure() -> Bool {
        func containsChat(in menu: NSMenu) -> Bool {
            menu.items.contains { item in
                item.title.contains("问问桌宠")
                    || item.action == NSSelectorFromString("openChat")
                    || item.submenu.map { containsChat(in: $0) } == true
            }
        }
        guard let statusMenu = status.menu, let appMenu = NSApp.mainMenu, !containsChat(in: appMenu),
              !responds(to: NSSelectorFromString("openChat")) else { return false }
        let petMenu = web.menuForPet()
        guard petMenu.items.first?.action == #selector(openWorkbench),
              statusMenu.items.first?.action == (workbenchState.petIsVisible
                ? #selector(openWorkbench) : #selector(toggleTemporaryPetVisibility)) else { return false }
        for menu in [petMenu, statusMenu] {
            guard !containsChat(in: menu),
                  menu.item(withTitle: "天气")?.submenu != nil,
                  menu.item(withTitle: "整理文件")?.submenu != nil,
                  let settings = menu.item(withTitle: "桌宠设置")?.submenu,
                  settings.items.map(\.action) == [
                    #selector(toggleLoginLaunch), #selector(openLoginItemSettings),
                    #selector(resetPosition), #selector(AppUpdates.checkForUpdates(_:))
                  ] else { return false }
            if #available(macOS 26, *) {
                guard let meetings = menu.item(withTitle: "会议录音")?.submenu,
                      meetings.items.map(\.action) == [#selector(toggleMeetingRecording), #selector(openMeetingRecordings)],
                      meetings.items.first?.isEnabled == meetingRecorder.canStart else { return false }
            } else if menu.item(withTitle: "会议录音") != nil {
                return false
            }
        }

        let savedReminders = reminderList.items
        defer { reminderList.items = savedReminders }
        reminderList.items = []
        guard makeMenu().item(withTitle: "提醒")?.submenu?.items.map(\.action) == [#selector(addReminder)] else {
            return false
        }
        reminderList.items = ["菜单自检提醒"]
        guard makeMenu().item(withTitle: "提醒")?.submenu?.items.map(\.action) == [#selector(addReminder), #selector(clearReminders)] else {
            return false
        }

        if #available(macOS 26, *) {
            let stop = activeMeetingMenuItem(for: .recording(Date()))
            guard activeMeetingMenuItem(for: .idle) == nil, stop?.action == #selector(toggleMeetingRecording),
                  stop?.title == "结束会议录音", stop?.isEnabled == true else { return false }
            for phase: MeetingRecorder.Phase in [.starting, .saving, .transcribing, .summarizing] {
                guard let item = activeMeetingMenuItem(for: phase), item.title.hasPrefix("正在"),
                      item.action == nil, !item.isEnabled else { return false }
            }
        }
        return true
    }

    private func verifyPetVisibility() -> Bool {
        let prefs = UserDefaults.standard
        let savedVisible = prefs.object(forKey: "shibaVisible")
        let savedHint = prefs.object(forKey: Self.petHiddenHintKey)
        let savedFrame = panel.frame
        let savedPlacement = restingPlacement
        let wasVisible = workbenchState.visible
        let wasHidden = workbenchState.temporarilyHidden
        let panelWasVisible = panel.isVisible
        defer {
            panel.setFrame(savedFrame, display: false)
            restingPlacement = savedPlacement
            workbenchState.visible = wasVisible
            workbenchState.temporarilyHidden = wasHidden
            refreshPetVisibility()
            if !panelWasVisible { panel.orderOut(nil) }
            petHiddenHintWindow?.orderOut(nil)
            petHiddenHintWindow = nil
            prefs.set(savedHint, forKey: Self.petHiddenHintKey)
            prefs.set(savedVisible, forKey: "shibaVisible")
        }
        prefs.removeObject(forKey: Self.petHiddenHintKey)
        showPet(false)
        guard !prefs.bool(forKey: Self.petHiddenHintKey), petHiddenHintWindow == nil else { return false }
        showPet(true)
        guard panel.isVisible, petPositionIsVisible() else { return false }
        let origin = panel.frame.origin
        toggleTemporaryPetVisibility()
        guard !panel.isVisible, workbenchState.temporarilyHidden,
              status.menu?.items.first?.title == "唤回小猫",
              web.menuForPet().items.first?.title == "打开工作台",
              petHiddenHintWindow?.isVisible == true, prefs.bool(forKey: Self.petHiddenHintKey) else { return false }
        toggleTemporaryPetVisibility()
        guard panel.isVisible, panel.frame.origin == origin,
              status.menu?.items.first?.title == "打开工作台", petHiddenHintWindow?.isVisible == false else { return false }

        workbenchState.setVisibility(false)
        guard !panel.isVisible, !workbenchState.visible, prefs.object(forKey: "shibaVisible") as? Bool == false,
              status.menu?.items.first?.title == "唤回小猫", petHiddenHintWindow?.isVisible == false else { return false }
        toggleTemporaryPetVisibility()
        guard panel.isVisible, panel.frame.origin == origin,
              prefs.object(forKey: "shibaVisible") as? Bool == true else { return false }

        workbenchState.setVisibility(false)
        panel.setFrameOrigin(NSPoint(x: -100_000, y: -100_000))
        guard !petPositionIsVisible() else { return false }
        toggleTemporaryPetVisibility()
        return panel.isVisible && petPositionIsVisible()
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

        guard model.brushSize == 1, model.brushShape == .square, model.pixelChanges.isEmpty,
              model.viewport.zoom == 8,
              let corner = model.viewport.pixel(at: CGPoint(x: 299, y: 299), displaySide: 300),
              corner.column == 179, corner.row == 139,
              model.viewport.pixel(at: CGPoint(x: 300, y: 299), displaySide: 300) == nil else { return false }
        model.zoom(by: -1)
        model.centerViewport(column: side - 1, row: 0)
        guard model.viewport.zoom == 4, model.viewport.column == side - 80 else { return false }
        model.zoom(by: 1)
        guard model.viewport.zoom == 8, model.viewport.column == side - 40, model.viewport.row == 0 else { return false }
        if original[firstPainted] >> 24 == 0xFF {
            model.tool = .sample
            model.paint(column: firstPainted % side, row: firstPainted / side)
            model.paint(column: 0, row: 0)
            model.endStroke()
            guard model.tool == .paint, model.paintColor == (original[firstPainted] & 0xFFFFFF),
                  model.cells == original, model.pixelChanges.isEmpty else { return false }
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
        model.toggleOriginal()
        model.paint(column: firstPainted % side, row: firstPainted / side)
        guard model.displayedCells == original, model.cells == expected else { return false }
        model.toggleOriginal()
        model.tool = .restore
        model.paint(column: firstPainted % side, row: firstPainted / side)
        model.endStroke()
        guard model.cells == original, model.pixelChanges.isEmpty else { return false }
        model.undo()
        guard model.cells == expected else { return false }
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
        guard let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame else { return false }
        let saved = panel.frame
        let wasVisible = workbenchState.visible
        // The hover timer ignores hidden pets, including on a fresh test profile.
        workbenchState.visible = true
        defer {
            hideQuickBar()
            panel.setFrame(saved, display: false)
            workbenchState.visible = wasVisible
        }

        panel.setFrameOrigin(NSPoint(x: screen.midX - saved.width / 2, y: screen.midY - saved.height / 2))
        let centered = panel.frame
        quickBarTick(at: NSPoint(x: panel.frame.midX, y: panel.frame.midY))
        guard let bar = quickBarWindow, bar.isVisible,
              panel.frame == centered, bar.frame.maxY <= centered.minY,
              screen.contains(bar.frame) else { return false }
        quickBarTick(at: NSPoint(x: bar.frame.midX, y: bar.frame.midY))
        guard bar.isVisible, panel.frame == centered else { return false }
        let far = NSPoint(x: screen.maxX + 100, y: screen.maxY + 100)
        quickBarTick(at: far)
        quickBarLeaveAt = .distantPast
        quickBarTick(at: far)
        guard !bar.isVisible, panel.frame == centered else { return false }

        panel.setFrameOrigin(NSPoint(x: centered.minX, y: screen.minY))
        let bottom = panel.frame
        quickBarTick(at: NSPoint(x: bottom.midX, y: bottom.midY))
        guard bar.isVisible, panel.frame == bottom, bar.frame.minY >= bottom.maxY,
              screen.contains(bar.frame) else { return false }
        hideQuickBar()
        return !bar.isVisible && panel.frame == bottom
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
        status.menu = makeMenu()
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
        if focus.showsCard && !workbenchState.temporarilyHidden {
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

    #if DEBUG
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

    #endif

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

    // MARK: Photo appearance

    private func chooseCatPhoto(slot: Int) {
        guard let window = workbenchWindow, !workbenchState.editingCustom, !workbenchState.applying else { return }
        let picker = NSOpenPanel()
        picker.title = slot == 0 ? "选择猫咪首图" : "选择同一只猫的补图 \(slot)"
        picker.prompt = "选取照片"
        picker.allowedContentTypes = [.image]
        picker.canChooseDirectories = false
        picker.allowsMultipleSelection = false
        picker.beginSheetModal(for: window) { [weak self] response in
            guard let self, response == .OK, let url = picker.url else { return }
            guard let input = CatPhotoInput(url: url) else {
                self.workbenchState.photoStatus = "无法读取这张图。请选择一张清晰的猫照。"
                return
            }
            if self.workbenchState.catPhotos.enumerated().contains(where: { $0.offset != slot && $0.element?.jpeg == input.jpeg }) {
                self.workbenchState.photoStatus = "这张照片已经选过。补图请选能看清其他部位的角度。"
                return
            }
            self.workbenchState.catPhotos[slot] = input
            self.workbenchState.photoStatus = ""
        }
    }

    private func generateFromCatPhoto() {
        guard previewReady, workbenchState.catPhotos[0] != nil, !workbenchState.editingCustom,
              !workbenchState.loadingCustom, !workbenchState.applying, workbenchState.pixelEditor == nil else { return }
        workbenchState.editingCustom = true
        workbenchState.generatingPhoto = true
        catPhotoClient.analyze(photos: workbenchState.catPhotos.compactMap { $0?.jpeg }, progress: { [weak self] phase in
            self?.workbenchState.photoStatus = phase
        }) { [weak self] response in
            guard let self else { return }
            switch response {
            case .failure(let error): self.finishPhotoGeneration(error.localizedDescription)
            case .success(let analysis): self.loadPhotoAppearance(analysis)
            }
        }
    }

    private func loadPhotoAppearance(_ analysis: CatPhotoClient.Analysis) {
        preview.callAsyncJavaScript(
            "return window.pet.appearanceFromPhotos(observations, views, individual, coatPattern)",
            arguments: ["observations": analysis.observations, "views": analysis.views,
                        "individual": analysis.individual, "coatPattern": analysis.coatPattern as Any? ?? NSNull()], in: nil, in: .page
        ) { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let value):
                guard let match = value as? [String: Any], let config = match["config"] as? [String: Any],
                      let breed = match["breed"] as? String, let setName = match["setName"] as? String else {
                    self.finishPhotoGeneration("识别结果无法生成桌宠，请重试。")
                    return
                }
                // A new photo starts its own preview draft. The currently
                // applied pet and saved local appearances are untouched.
                self.cancelBreedSelection()
                self.customSelectionRequest += 1
                self.previewCustom = nil
                self.clearPendingBrush()
                self.workbenchState.customSelected = nil
                self.workbenchState.customMode = nil
                self.workbenchState.hasPhotoResult = true
                self.workbenchState.preset = breed
                self.workbenchState.action = "sit"
                self.applyCustomOverlay(nil, in: self.preview)
                self.setDraft(config)
                let pawNames = ["white-paw": "白脚尖", "white-forearm": "白前肢下段", "white-leg": "整段白前肢",
                                "distal-dark-patch": "深斑", "colored": "爪部底色"]
                let pawSources = (match["pawRecoveries"] as? [[String: Any]] ?? []).compactMap { paw -> String? in
                    guard let side = paw["side"] as? String, let photo = paw["photo"] as? Int,
                          let feature = paw["feature"] as? String, let marking = pawNames[feature] else { return nil }
                    return "首图画面\(side == "left" ? "左" : "右")前爪：\(marking)来自补图 \(photo - 1)（第 \(photo) 张）"
                }
                let recovery = pawSources.isEmpty ? "" : pawSources.joined(separator: "，") + "。"
                self.finishPhotoGeneration("已生成 · \(setName)。" + recovery)
            case .failure(let error):
                let detail = (error as NSError).userInfo["WKJavaScriptExceptionMessage"] as? String
                self.finishPhotoGeneration(detail ?? "无法解析照片特征，请重试。")
            }
        }
    }

    private func finishPhotoGeneration(_ message: String) {
        workbenchState.photoStatus = message
        workbenchState.generatingPhoto = false
        workbenchState.editingCustom = false
    }

    /// Saves the current workbench preview as a 320×320 PNG (nearest-neighbour).
    private func exportAppearancePNG() {
        let js = """
        (() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return null;
          const side = 320;
          const out = document.createElement('canvas');
          out.width = side;
          out.height = side;
          const ctx = out.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(canvas, 0, 0, side, side);
          return out.toDataURL('image/png');
        })()
        """
        preview.callAsyncJavaScript(js, arguments: [:], in: nil, in: .page) { [weak self] result in
            guard let self, case .success(let value) = result, let dataURL = value as? String,
                  let comma = dataURL.firstIndex(of: ","),
                  let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])) else {
                self?.workbenchState.message = "导出失败：无法读取预览"
                return
            }
            let panel = NSSavePanel()
            panel.allowedContentTypes = [.png]
            let name = self.workbenchState.appearance["name", default: ""]
            panel.nameFieldStringValue = (name.isEmpty ? "桌宠" : name) + ".png"
            if panel.runModal() == .OK, let url = panel.url {
                do {
                    try data.write(to: url)
                    self.workbenchState.message = "已导出 PNG"
                } catch {
                    self.workbenchState.message = "导出失败"
                }
            }
        }
    }

    // MARK: Pixel editor

    private func capturePixelPreview(completion: @escaping (PixelEditSnapshot?) -> Void) {
        capturePixelPreview(forEditor: false) { snapshot, _ in completion(snapshot) }
    }

    private func capturePixelPreview(forEditor: Bool,
                                     completion: @escaping (PixelEditSnapshot?, PhotoFurEditorSurface?) -> Void) {
        preview.callAsyncJavaScript(
            """
            const {png, source, furMask, original} = await window.pet.previewSnapshot(photoResult, forEditor);
            return {png, source: source ? JSON.stringify(source) : null, furMask: furMask ?? null, original: original ?? null};
            """,
            arguments: ["photoResult": workbenchState.hasPhotoResult, "forEditor": forEditor], in: nil, in: .page
        ) { result in
            let prefix = "data:image/png;base64,"
            guard case .success(let value) = result, let snapshot = value as? [String: Any],
                  let url = snapshot["png"] as? String, url.hasPrefix(prefix),
                  let png = Data(base64Encoded: String(url.dropFirst(prefix.count))) else {
                completion(nil, nil)
                return
            }
            let source = (snapshot["source"] as? String).map { Data($0.utf8) }
            let edit = PixelEditSnapshot(png: png, source: source)
            var fur: PhotoFurEditorSurface?
            if forEditor && edit.isPhotoFur {
                guard let encoded = snapshot["furMask"] as? String, let mask = Data(base64Encoded: encoded),
                      let originalURL = snapshot["original"] as? String, originalURL.hasPrefix(prefix),
                      let original = Data(base64Encoded: String(originalURL.dropFirst(prefix.count))) else {
                    completion(nil, nil)
                    return
                }
                fur = PhotoFurEditorSurface(mask: mask, originalPNG: original)
            }
            completion(edit, fur)
        }
    }

    private func makePixelEditor(snapshot: PixelEditSnapshot, fur: PhotoFurEditorSurface? = nil) -> PixelEditorModel? {
        guard !snapshot.isPhotoFur || fur != nil else { return nil }
        return PixelEditorModel(previewPNG: snapshot.png, source: snapshot.source, fur: fur) { [weak self] source, changes, completion in
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

    private func changeCustomMode(_ mode: CustomAppearanceMode?) {
        guard previewReady, !draftTemplate.isEmpty, !workbenchState.editingCustom,
              !workbenchState.loadingCustom, !workbenchState.applying,
              mode != workbenchState.customMode else { return }
        guard mode == .brush else {
            stageBrush(nextMode: mode) { _ in }
            return
        }
        workbenchState.editingCustom = true
        capturePixelPreview(forEditor: true) { [weak self] snapshot, fur in
            guard let self else { return }
            self.workbenchState.editingCustom = false
            guard let snapshot, let model = self.makePixelEditor(snapshot: snapshot, fur: fur) else {
                self.workbenchState.message = "无法读取左侧预览，请重试"
                return
            }
            self.workbenchState.pixelEditor = model
            self.workbenchState.customMode = .brush
            self.workbenchState.message = ""
        }
    }

    private func stageBrush(nextMode: CustomAppearanceMode?, completion: @escaping (Bool) -> Void) {
        guard !workbenchState.editingCustom, !workbenchState.loadingCustom, !workbenchState.applying else {
            completion(false)
            return
        }
        guard let editor = workbenchState.pixelEditor, editor.hasChanges else {
            finishBrushEditing(nextMode)
            completion(true)
            return
        }
        workbenchState.editingCustom = true
        editor.resolveSnapshot { [weak self] snapshot in
            guard let self else { completion(false); return }
            guard let snapshot else {
                self.workbenchState.editingCustom = false
                self.workbenchState.message = "无法合成画笔笔迹，请重试"
                completion(false)
                return
            }
            self.applyCustomOverlay(snapshot, in: self.preview) { resolved in
                self.workbenchState.editingCustom = false
                guard let source = resolved?["source"] as? String else {
                    self.applyCustomOverlay(self.pendingBrush ?? self.previewCustom?.snapshot, in: self.preview)
                    self.workbenchState.message = "无法合成画笔笔迹，请重试"
                    completion(false)
                    return
                }
                self.pendingBrush = PixelEditSnapshot(png: snapshot.png, source: Data(source.utf8))
                self.workbenchState.hasPendingBrush = true
                self.finishBrushEditing(nextMode)
                completion(true)
            }
        }
    }

    private func finishBrushEditing(_ nextMode: CustomAppearanceMode?) {
        workbenchState.pixelEditor = nil
        workbenchState.customMode = nextMode
        if nextMode != .patches && workbenchState.selectedFurPatchID != nil {
            workbenchState.selectFurPatch(nil)
        }
    }

    private func saveCustomAppearance(_ name: String, completion: @escaping (Bool) -> Void) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard previewReady, !PixelPresetStore.slugify(trimmed).isEmpty else {
            workbenchState.message = "请输入含文字或数字的形象名称"
            completion(false)
            return
        }
        stageBrush(nextMode: workbenchState.customMode == .brush ? nil : workbenchState.customMode) { [weak self] staged in
            guard let self, staged else { completion(false); return }
            self.workbenchState.editingCustom = true
            self.capturePixelPreview { snapshot in
                guard let snapshot else {
                    self.workbenchState.editingCustom = false
                    self.workbenchState.message = "无法读取左侧预览，请重试"
                    completion(false)
                    return
                }
                if let source = snapshot.source {
                    self.resolvePixelEdits(source: source, changes: []) { resolved in
                        self.workbenchState.editingCustom = false
                        guard let resolved else {
                            self.workbenchState.message = "无法保存形象笔迹，请重试"
                            completion(false)
                            return
                        }
                        completion(self.storeCustomAppearance(trimmed, snapshot: PixelEditSnapshot(png: snapshot.png, source: resolved)))
                    }
                } else {
                    self.workbenchState.editingCustom = false
                    completion(self.storeCustomAppearance(trimmed, snapshot: snapshot))
                }
            }
        }
    }

    private func storeCustomAppearance(_ requested: String, snapshot: PixelEditSnapshot) -> Bool {
        var name = requested
        let identifiers = Set(workbenchState.customPresets.map { $0.id.lowercased() })
        var copy = 2
        while identifiers.contains(PixelPresetStore.slugify(name).lowercased()) {
            let suffix = " \(copy)"
            name = String(PixelPresetStore.slugify(requested).prefix(40 - suffix.count)) + suffix
            copy += 1
        }
        guard let url = PixelPresetStore.save(name: name, snapshot: snapshot) else {
            workbenchState.message = "保存形象失败，请重试"
            return false
        }
        let id = url.deletingPathExtension().lastPathComponent
        previewCustom = CustomSelection(id: id, url: url, snapshot: snapshot)
        workbenchState.customSelected = id
        savedCustomAppearances[id] = draftConfig().merging(["breed": workbenchState.preset]) { _, new in new }
        clearPendingBrush()
        reloadCustomPresets()
        workbenchState.message = "已保存形象「\(name)」"
        return true
    }

    private func clearPendingBrush() {
        pendingBrush = nil
        workbenchState.hasPendingBrush = false
    }

    private var savedCustomAppearances: [String: [String: Any]] {
        get { UserDefaults.standard.dictionary(forKey: "customSpriteAppearances") as? [String: [String: Any]] ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: "customSpriteAppearances") }
    }

    private func reloadCustomPresets() {
        workbenchState.customPresets = PixelPresetStore.load()
        if let selected = workbenchState.customSelected, selected != activeBrushID,
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
        cancelBreedSelection()
        customSelectionRequest += 1
        let request = customSelectionRequest
        let saved = savedCustomAppearances[id]
        workbenchState.loadingCustom = true
        applyCustomOverlay(snapshot, in: preview, savedAppearance: saved) { [weak self] selection in
            guard let self, request == self.customSelectionRequest else { return }
            self.workbenchState.loadingCustom = false
            guard let reference = selection?["source"] as? String,
                  var config = selection?["appearance"] as? [String: Any] else {
                self.applyCustomOverlay(self.pendingBrush ?? self.previewCustom?.snapshot, in: self.preview)
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
            self.clearPendingBrush()
            self.workbenchState.customSelected = id
            self.workbenchState.hasPhotoResult = resolved.isPhotoFur
            self.workbenchState.photoStatus = resolved.isPhotoFur ? "已打开保存的照片形象。" : ""
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
        let updatesPreview = view === preview
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
            case .success(let value):
                if updatesPreview { self?.workbenchState.coatOverlayRevision += 1 }
                completion?(value as? [String: Any])
            case .failure:
                if let completion { completion(nil) }
                else { self?.workbenchState.message = "无法显示自定义形象" }
            }
        }
    }

    private func clearCustomPreview() {
        customSelectionRequest += 1
        previewCustom = nil
        clearPendingBrush()
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
            if id == activeBrushID, url.standardizedFileURL == activeBrushURL.standardizedFileURL { return url }
            return url.standardizedFileURL.deletingLastPathComponent().path == privateFolder ? url : nil
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
        guard workbenchState.petIsVisible, !web.isDragging else {
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

    private var quickBarRecordingUnavailableReason: String? {
        guard #available(macOS 26, *) else { return "录音需要 macOS 26 或更新版本" }
        let recorder = meetingRecorder
        if recorder.phase.isRecording || recorder.canStart { return nil }
        if recorder.phase == .idle { return "请在工作台开启至少一个录音音源" }
        return "正在准备或处理录音"
    }

    private func showQuickBar() {
        let host = ReminderHostingView(rootView: QuickBar(
            isRecording: !meetingRecordingDot.isHidden,
            recordingUnavailableReason: quickBarRecordingUnavailableReason,
            onRecording: { [weak self] in self?.toggleMeetingRecording() },
            onClipboard: { [weak self] in
                self?.hideQuickBar()
                self?.showClipboard()
            },
            onFocus: { [weak self] in self?.handleQuickFocus() }
        ))
        fitCardHost(host, fallback: NSSize(width: 204, height: 58))
        let panel = quickBarWindow ?? makeReminderPanel()
        panel.ignoresMouseEvents = false
        panel.setContentSize(host.frame.size)
        panel.contentView = host
        quickBarWindow = panel
        layoutQuickBar(showing: true)
        layoutDropChoice()
        panel.orderFrontRegardless()
    }

    private func hideQuickBar() {
        quickBarLeaveAt = nil
        quickBarWindow?.orderOut(nil)
    }

    private func layoutQuickBar(showing: Bool = false) {
        guard let card = quickBarWindow, showing || card.isVisible,
              let screen = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame,
              !web.isDragging else { return }
        let size = card.frame.size
        if edgePlacement != nil {
            let x = panel.frame.midX - size.width / 2
            let y = panel.frame.maxY + 6
            card.setFrameOrigin(NSPoint(x: min(max(x, screen.minX + 6), screen.maxX - size.width - 6),
                                        y: min(max(y, screen.minY + 6), screen.maxY - size.height - 6)))
            return
        }

        let x = panel.frame.midX - size.width / 2
        let below = max(screen.minY, panel.frame.minY - size.height - 6)
        let y = below + size.height <= panel.frame.minY ? below : panel.frame.maxY + 6
        card.setFrameOrigin(NSPoint(x: min(max(x, screen.minX + 6), screen.maxX - size.width - 6),
                                    y: min(y, screen.maxY - size.height)))
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
        hideDropChoice()
        let ok = FileTools.trash(url)
        if ok { playFileAction("shredder") }
        showTrashToast(ok ? "已移到垃圾桶" : "操作失败", tone: ok ? .normal : .failure, autoHide: 2.4)
    }

    private func playPetLove(first: [Double], second: [Double]) {
        guard ready, panel.isVisible, appliedConfig?["frame"] as? String == "CAT", dropChoiceURL == nil else { return }
        let clicks = ["first": first, "second": second]
        if edgePlacement == nil {
            web.callAsyncJavaScript("window.pet.playPetLoveAt(first, second)",
                                    arguments: clicks, in: nil, in: .page)
            return
        }

        // A corner peek has a smaller canvas. Hit-test it before opening the full pose.
        let clickRevision = web.clickRevision
        web.callAsyncJavaScript("return window.pet.canPlayPetLoveAt(first, second)",
                                arguments: clicks, in: nil, in: .page) { [weak self] result in
            guard let self, case .success(let hit) = result, hit as? Bool == true,
                  self.web.clickRevision == clickRevision, self.panel.isVisible, self.edgePlacement != nil,
                  self.appliedConfig?["frame"] as? String == "CAT", self.dropChoiceURL == nil else { return }
            self.playDesktopAction("return window.pet.playPetLove()")
        }
    }

    private func playFileAction(_ action: String) {
        guard ready, appliedConfig?["frame"] as? String == "CAT" else { return }
        playDesktopAction("return await window.pet.playFileAction(action)", arguments: ["action": action])
    }

    private func playDesktopAction(_ script: String, arguments: [String: Any] = [:]) {
        actionRun += 1
        let run = actionRun
        if let placement = edgePlacement {
            actionReturnPlacement = placement
            undockPet(at: NSPoint(x: panel.frame.midX, y: panel.frame.midY), keepOnScreen: true)
        }
        web.callAsyncJavaScript(script, arguments: arguments, in: nil, in: .page) { [weak self] result in
            guard let self, self.actionRun == run, self.actionReturnPlacement != nil else { return }
            let duration: TimeInterval
            if case .success(let value) = result, let milliseconds = value as? NSNumber {
                duration = milliseconds.doubleValue / 1000
            } else {
                duration = 0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
                guard let self, self.actionRun == run else { return }
                self.restoreDesktopActionPlacement()
            }
        }
    }

    private func restoreDesktopActionPlacement() {
        guard let placement = actionReturnPlacement else { return }
        actionReturnPlacement = nil
        if edgePlacement == nil && !web.isDragging && appliedConfig?["frame"] as? String == "CAT" {
            placePet(placement)
        }
    }

    private func performZip() {
        guard let url = dropChoiceURL else { return }
        hideDropChoice()
        let ok = FileTools.zip(url) != nil
        if ok { playFileAction("zip") }
        showTrashToast(ok ? "已压缩" : "操作失败", tone: ok ? .normal : .failure, autoHide: 2.4)
    }

    private func performConvert(_ format: ConvertFormat) {
        guard let url = dropChoiceURL else { return }
        hideDropChoice()
        let ok = FileTools.convert(url, to: format) != nil
        if ok { playFileAction("convert") }
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

    private func setSelectionTranslation(_ enabled: Bool) {
        guard TranslationEngine.isAvailable else { return }
        workbenchState.selectionTranslationEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: "selectionTranslationEnabled")
        refreshSelectionWatcher()
        if enabled, workbenchState.translationNeedsPermission, !translationTrustRequested {
            translationTrustRequested = true
            SelectionReader.requestTrust()
        }
    }

    private func refreshSelectionWatcher() {
        let enabled = workbenchState.selectionTranslationEnabled
        let trusted = enabled && SelectionReader.isTrusted
        let needsPermission = enabled && !trusted
        if workbenchState.translationNeedsPermission != needsPermission {
            workbenchState.translationNeedsPermission = needsPermission
        }
        if trusted {
            startSelectionWatcher()
        } else if selectionDownMonitor != nil || selectionUpMonitor != nil {
            stopSelectionWatcher()
        }
    }

    private func startSelectionWatcher() {
        guard selectionUpMonitor == nil else { return }
        selectionDownMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown]) { [weak self] _ in
            guard let self else { return }
            self.selectionReadTask?.cancel()
            self.selectionDownPoint = NSEvent.mouseLocation
            self.pendingSelection = nil
            self.hideTranslateButton()
        }
        selectionUpMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseUp]) { [weak self] _ in
            guard let self else { return }
            let point = NSEvent.mouseLocation
            let task = DispatchWorkItem { [weak self] in
                self?.handleSelectionMouseUp(at: point)
            }
            self.selectionReadTask?.cancel()
            self.selectionReadTask = task
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: task)
        }
        if selectionDownMonitor == nil || selectionUpMonitor == nil {
            stopSelectionWatcher()
        }
    }

    private func stopSelectionWatcher() {
        if let selectionDownMonitor { NSEvent.removeMonitor(selectionDownMonitor) }
        if let selectionUpMonitor { NSEvent.removeMonitor(selectionUpMonitor) }
        selectionDownMonitor = nil
        selectionUpMonitor = nil
        selectionReadTask?.cancel()
        selectionReadTask = nil
        selectionDownPoint = nil
        pendingSelection = nil
        hideTranslateButton()
        hideTranslation()
    }

    private func handleSelectionMouseUp(at upPoint: NSPoint) {
        selectionReadTask = nil
        let downPoint = selectionDownPoint
        selectionDownPoint = nil
        // Only a drag looks like a selection; plain clicks should stay quiet.
        guard let downPoint,
              hypot(upPoint.x - downPoint.x, upPoint.y - downPoint.y) >= 3 else { return }
        guard workbenchState.selectionTranslationEnabled, SelectionReader.isTrusted else { return }
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
        guard workbenchState.selectionTranslationEnabled, SelectionReader.isTrusted, let raw = pendingSelection else { return }
        hideTranslateButton()
        pendingSelection = nil
        let (text, truncated) = SelectionText.prepare(raw)
        let request = UUID()
        translationRequest = request
        currentTranslation = nil
        showTranslation(.loading)
        translationEngine.translate(text) { [weak self] result in
            DispatchQueue.main.async {
                guard let self, self.translationRequest == request else { return }
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
        translationRequest = nil
        translationEngine.cancel()
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

    @objc private func toggleMeetingRecording() {
        if #available(macOS 26, *) {
            hideQuickBar()
            if meetingRecorder.phase.isRecording { meetingRecorder.stop() }
            else { meetingRecorder.start() }
        }
    }

    @objc private func openMeetingRecordings() {
        if #available(macOS 26, *) {
            hideQuickBar()
            workbenchState.showsMeetingRecordings = true
            openWorkbench()
        }
    }

    private func meetingStateChanged(recording: Bool) {
        meetingRecordingDot.isHidden = !recording
        let label = recording ? "桌宠 · 会议录音中" : "桌宠"
        status.button?.toolTip = label
        status.button?.setAccessibilityLabel(label)
        status.menu = makeMenu()
        if quickBarWindow?.isVisible == true { showQuickBar() }
    }

    @objc private func openClipboard() {
        showClipboard()
    }

    @objc private func toggleMusicWatch() {
        music.enabled.toggle()
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
        guard !focus.isActive, !workbenchState.temporarilyHidden else { return }
        if let weatherRetryAt, Date() < weatherRetryAt { return }
        fetchWeather(remind: true)
    }

    private func fetchWeather(remind: Bool) {
        weather.refresh { [weak self] result in
            DispatchQueue.main.async {
                guard let self, !remind || !self.workbenchState.temporarilyHidden else { return }
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
    }

    private func matchingPreset(_ config: [String: Any]) -> String {
        workbenchState.catalog?.matchingPreset(config)
            ?? (config["frame"] as? String == "CAT" ? "preset_cat_orange" : "preset_m1_12")
    }

    private func cancelBreedSelection() {
        presetRequest += 1
        workbenchState.choosingBreed = false
    }

    private func choosePreset(_ id: String, completion: ((Bool) -> Void)? = nil) {
        presetRequest += 1
        workbenchState.choosingBreed = true
        let request = presetRequest
        preview.callAsyncJavaScript("return window.pet.preset(id)", arguments: ["id": id], in: nil, in: .page) { [weak self] result in
            guard let self, request == self.presetRequest else { completion?(false); return }
            self.workbenchState.choosingBreed = false
            guard case .success(let value) = result,
                  let config = value as? [String: Any] else { completion?(false); return }
            // Selecting a breed starts from all of its appearance defaults.
            // Profile fields and independent custom paint are handled separately.
            self.workbenchState.hasPhotoResult = (self.pendingBrush ?? self.previewCustom?.snapshot)?.isPhotoFur == true
            if !self.workbenchState.hasPhotoResult { self.workbenchState.photoStatus = "" }
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
        if draft["frame"] as? String == "CAT" {
            draft["furPatches"] = workbenchState.furPatches.map(\.config)
            if workbenchState.hasPhotoResult {
                let original = (draft["photoCoatParts"] as? [String] ?? [])
                    .filter { !$0.hasPrefix("ear-left-") && !$0.hasPrefix("ear-right-") }
                let earMarks = ["left", "right"].compactMap { workbenchState.photoEarMarks[$0] }
                draft["photoCoatParts"] = original + earMarks
                draft["photoEarColors"] = workbenchState.photoEarColors.filter { workbenchState.photoEarMarks[$0.key] != nil }
            }
        }
        return draft
    }

    private func refreshPreview() {
        guard previewReady, !draftTemplate.isEmpty else { return }
        var config = draftConfig()
        // Name validation belongs to Apply; appearance stays live while editing it.
        config["name"] = "预览"
        preview.callAsyncJavaScript("window.pet.preview(config, action, freeze)",
            arguments: ["config": config, "action": workbenchState.action,
                        "freeze": workbenchState.selectedFurPatchID != nil], in: nil, in: .page)
    }

    private func applyDraft(completion: @escaping (Bool) -> Void = { _ in }) {
        guard ready, !workbenchState.applying, !workbenchState.loadingCustom, !workbenchState.choosingBreed
        else { completion(false); return }
        var draft = draftConfig()
        draft["breed"] = workbenchState.preset
        let hasDraftBrush = pendingBrush != nil
        let selection = pendingBrush.map { CustomSelection(id: activeBrushID, url: activeBrushURL, snapshot: $0) } ?? previewCustom
        let snapshot = selection?.snapshot
        let updateOverlay = selection?.id != appliedCustom?.id
            || snapshot?.png != appliedCustom?.snapshot.png
            || snapshot?.source != appliedCustom?.snapshot.source
        let png = snapshot.map { "data:image/png;base64,\($0.png.base64EncodedString())" }
        let source = snapshot?.source.flatMap { String(data: $0, encoding: .utf8) }
        workbenchState.applying = true
        web.cancelPointerInteraction()
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
                if hasDraftBrush {
                    self.previewCustom = selection
                    self.workbenchState.customSelected = selection?.id
                    self.clearPendingBrush()
                }
                config["breed"] = draft["breed"]
                self.storeAppliedAppearance(config, customID: selection?.id)
                if !self.isTest { self.showPet(true) }
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
        web.cancelPointerInteraction()
        if edgePlacement != nil, config["frame"] as? String != "CAT" {
            undockPet(at: NSPoint(x: panel.frame.midX, y: panel.frame.midY), keepOnScreen: true)
            rememberDesktopPosition()
        }
        web.callAsyncJavaScript("window.pet.configure(config)", arguments: ["config": config], in: nil, in: .page)
    }

    private func beginPetDrag(at point: NSPoint) {
        actionReturnPlacement = nil
        hideQuickBar()
        hideReminderInput()
        if edgePlacement != nil { undockPet(at: point) }
    }

    private func verifyEdgeGeometry() -> Bool {
        let frame = NSRect(x: -1440, y: -120, width: 1440, height: 900)
        let visible = NSRect(x: -1440, y: -32, width: 1440, height: 780)
        let display = PetDisplay(id: "second", frame: frame, visible: visible)
        let size: CGFloat = 120
        func target(_ x: CGFloat, _ y: CGFloat, pet: NSRect? = nil, on screen: PetDisplay = display,
                    neighbors: [NSRect] = []) -> PetEdge? {
            let resting = pet ?? NSRect(x: x - size / 2, y: y - size / 2, width: size, height: size)
            return PetSurface.edge(at: NSPoint(x: x, y: y), pet: resting, on: screen, neighbors: neighbors)
        }

        let left = NSPoint(x: frame.minX + 10, y: visible.midY)
        let right = NSPoint(x: frame.maxX - 10, y: visible.midY)
        let desktopBottom = NSPoint(x: visible.midX, y: visible.minY + 10)
        let physicalBottom = NSPoint(x: visible.midX, y: frame.minY + 10)
        let nextToLeft = NSRect(x: frame.minX - 800, y: frame.minY, width: 800, height: frame.height)
        let nextToRight = NSRect(x: frame.maxX, y: frame.minY, width: 800, height: frame.height)
        let below = NSRect(x: frame.minX, y: frame.minY - 600, width: frame.width, height: 600)
        let nearLeft = NSRect(x: frame.minX - 14, y: visible.midY - 55, width: size, height: size)
        let nearBottom = NSRect(x: visible.midX - 60, y: visible.minY - 12, width: size, height: size)
        guard target(left.x, left.y) == .left, target(right.x, right.y) == .right,
              target(desktopBottom.x, desktopBottom.y) == .bottom, target(physicalBottom.x, physicalBottom.y) == .bottom,
              target(frame.minX + 70, left.y, pet: nearLeft) == .left,
              target(visible.midX, visible.minY + 64, pet: nearBottom) == .bottom,
              target(frame.midX, frame.minY + 44) == nil,
              target(frame.midX, visible.maxY - 4) == nil,
              target(frame.midX, visible.midY) == nil,
              target(left.x, left.y, neighbors: [nextToLeft]) == nil,
              target(right.x, right.y, neighbors: [nextToRight]) == nil,
              target(desktopBottom.x, desktopBottom.y, neighbors: [below]) == nil,
              target(physicalBottom.x, physicalBottom.y, neighbors: [below]) == nil
        else { return false }

        let sideDock = PetDisplay(id: display.id, frame: frame,
                                  visible: NSRect(x: frame.minX + 88, y: frame.minY, width: 1352, height: 868))
        let autoHide = PetDisplay(id: display.id, frame: frame,
                                  visible: NSRect(x: frame.minX, y: frame.minY + 4, width: 1440, height: 864))
        guard target(frame.minX + 44, visible.midY, on: sideDock) == nil,
              target(left.x, left.y, on: sideDock) == .left,
              target(physicalBottom.x, physicalBottom.y, on: autoHide) == .bottom else { return false }

        for screen in [display, sideDock, autoHide] {
            for edge in [PetEdge.left, .right, .bottom] {
                let placement = PetEdgePlacement(edge: edge, displayID: screen.id, anchor: 0.5)
                guard let peek = placement.frame(in: screen, petSize: size, neighbors: []), screen.visible.contains(peek) else {
                    return false
                }
                switch edge {
                case .left: if peek.minX != screen.visible.minX { return false }
                case .right: if peek.maxX != screen.visible.maxX { return false }
                case .bottom: if peek.minY != screen.visible.minY { return false }
                }
            }
        }

        let primaryFrame = NSRect(x: 0, y: 0, width: 1512, height: 982)
        let primary = PetDisplay(id: "primary", frame: primaryFrame, visible: primaryFrame)
        for corner in PetCorner.allCases {
            let json = """
                {"corner":{"_0":{"corner":"\(corner.rawValue)","displayID":"second"}}}
                """
            guard let saved = try? JSONDecoder().decode(PetPlacement.self, from: Data(json.utf8)),
                  let restored = saved.resolve(in: [display], petSize: size),
                  restored.edge?.edge == .bottom, restored.frame.minY == visible.minY,
                  corner == .left ? restored.frame.minX == visible.minX : restored.frame.maxX == visible.maxX,
                  let fallback = saved.resolve(in: [primary], petSize: size),
                  fallback.edge == nil, primary.visible.contains(fallback.frame) else { return false }
        }

        let oldDock = Data(#"{"peeking":{"_0":{"edge":"bottom","surface":"dock","displayID":"second","anchor":0.5}}}"#.utf8)
        guard let saved = try? JSONDecoder().decode(PetPlacement.self, from: oldDock),
              let restored = saved.resolve(in: [display], petSize: size),
              restored.edge?.edge == .bottom, restored.frame.minY == visible.minY else { return false }
        let lowerNeighbor = PetDisplay(id: "below", frame: below, visible: below)
        return saved.resolve(in: [display, lowerNeighbor], petSize: size)?.edge == nil
            && saved.resolve(in: [display], petSize: size, canPeek: false)?.edge == nil
    }

    private func verifyPetDoubleClick() -> Bool {
        let originalFrame = panel.frame
        let originalSend = web.send
        let originalStart = web.onDragStart
        let originalEnd = web.onDragEnd
        let originalClick = web.onDoubleClick
        let originalLock = web.isLocked
        defer {
            web.cancelPointerInteraction()
            web.send = originalSend
            web.onDragStart = originalStart
            web.onDragEnd = originalEnd
            web.onDoubleClick = originalClick
            web.isLocked = originalLock
            panel.setFrame(originalFrame, display: true)
        }
        var clicks = 0
        var drags = 0
        var locked = false
        web.cancelPointerInteraction()
        web.send = { _ in }
        web.onDragStart = { _ in }
        web.onDragEnd = { _ in drags += 1 }
        web.onDoubleClick = { _, _ in clicks += 1 }
        web.isLocked = { locked }

        func emit(_ type: NSEvent.EventType, count: Int, offset: CGFloat = 0) -> Bool {
            let location = NSPoint(x: panel.frame.width / 2 + offset, y: panel.frame.height / 2)
            guard let event = NSEvent.mouseEvent(with: type, location: location, modifierFlags: [], timestamp: 0,
                windowNumber: panel.windowNumber, context: nil, eventNumber: 0, clickCount: count, pressure: 1) else { return false }
            switch type {
            case .leftMouseDown: web.mouseDown(with: event)
            case .leftMouseDragged: web.mouseDragged(with: event)
            default: web.mouseUp(with: event)
            }
            return true
        }
        func click(_ count: Int) -> Bool {
            emit(.leftMouseDown, count: count) && emit(.leftMouseUp, count: count)
        }
        func drag(_ count: Int) -> Bool {
            emit(.leftMouseDown, count: count) && emit(.leftMouseDragged, count: count, offset: 16)
                && emit(.leftMouseUp, count: count)
        }

        guard click(1), click(1), clicks == 0,
              emit(.leftMouseDown, count: 2), clicks == 0, emit(.leftMouseUp, count: 2), clicks == 1,
              click(3), click(4), clicks == 1,
              click(1), drag(2), drags == 1, clicks == 1,
              drag(1), click(2), drags == 2, clicks == 1 else { return false }

        locked = true
        let lockedFrame = panel.frame
        guard click(1), click(2), clicks == 2,
              click(1), drag(2), drags == 2, clicks == 2, panel.frame == lockedFrame,
              click(1) else { return false }
        web.cancelPointerInteraction()
        return click(2) && clicks == 2
    }

    private func verifyPetEdgeDragging() -> Bool {
        guard let display = NSScreen.main, verifyEdgeGeometry() else { return false }
        let screen = display.visibleFrame
        let size = CGFloat(workbenchState.petSize)
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

        let tests: [(PetEdge, NSPoint)] = [
            (.left, NSPoint(x: display.frame.minX + 6, y: screen.midY)),
            (.right, NSPoint(x: display.frame.maxX - 6, y: screen.midY)),
            (.bottom, NSPoint(x: screen.midX, y: screen.minY + 6)),
        ]
        let neighborFrames = NSScreen.screens.filter { $0 != display }.map(\.frame)
        for (edge, point) in tests where !edge.isShared(at: point, in: display.frame, neighbors: neighborFrames) {
            panel.setFrameOrigin(NSPoint(x: start.x - size / 2, y: start.y - size / 2))
            guard drag(from: start, to: point), edgePlacement?.edge == edge, screen.contains(panel.frame) else { return false }
            let grip = NSPoint(x: panel.frame.midX, y: panel.frame.midY)
            guard drag(from: grip, to: start), edgePlacement == nil,
                  panel.frame.size == NSSize(width: size, height: size) else { return false }
        }

        let ordinaryDrops = [
            NSPoint(x: screen.midX, y: screen.maxY - 6),
            NSPoint(x: screen.midX + 90, y: screen.midY + 35)
        ]
        for point in ordinaryDrops {
            panel.setFrameOrigin(NSPoint(x: start.x - size / 2, y: start.y - size / 2))
            guard drag(from: start, to: point), edgePlacement == nil, screen.contains(panel.frame) else { return false }
        }
        return true
    }

    private func finishPetDrag(at point: NSPoint) {
        let displays = PetDisplay.connected
        guard let screen = displays.first(where: { $0.frame.contains(point) }) ?? desktopDisplay(in: displays) else { return }
        guard appliedConfig?["frame"] as? String == "CAT" else {
            rememberDesktopPosition(on: screen)
            return
        }
        let neighbors = displays.filter { $0.id != screen.id }.map(\.frame)
        if let edge = PetSurface.edge(at: point, pet: panel.frame, on: screen, neighbors: neighbors) {
            let grip = NSPoint(x: panel.frame.midX, y: point.y)
            placePet(.init(edge: edge, displayID: screen.id, anchor: edge.anchor(at: grip, in: screen.visible)))
        } else {
            rememberDesktopPosition(on: screen)
        }
    }

    private func placePet(_ placement: PetEdgePlacement) {
        restorePetPlacement(.peeking(placement))
    }

    private func restorePetPlacement(_ placement: PetPlacement) {
        let displays = PetDisplay.connected
        guard !displays.isEmpty else { return }
        let size = workbenchState.petSize
        guard let resolved = placement.resolve(in: displays, petSize: size, canPeek: appliedConfig?["frame"] as? String != "M1") else {
            resetPosition()
            return
        }
        if let edge = resolved.edge {
            edgePlacement = edge
            send("setEdge('\(edge.edge.rawValue)')")
            petGaze = nil
        } else if edgePlacement != nil {
            clearEdgePlacement()
        }
        if panel.frame != resolved.frame { panel.setFrame(resolved.frame, display: true) }
        if let edge = resolved.edge {
            saveRestingPlacement(.peeking(edge))
        } else if let display = desktopDisplay(in: displays) {
            saveRestingPlacement(.resting(at: panel.frame.origin, on: display, petSize: size))
        }
        layoutReminder()
    }

    private func desktopDisplay(in displays: [PetDisplay]) -> PetDisplay? {
        let center = NSPoint(x: panel.frame.midX, y: panel.frame.midY)
        return displays.first { $0.frame.contains(center) }
            ?? panel.screen.flatMap { screen in displays.first { $0.id == PetDisplay.identifier(for: screen) } }
            ?? displays.first
    }

    private func rememberDesktopPosition(on display: PetDisplay? = nil) {
        guard let display = display ?? desktopDisplay(in: PetDisplay.connected) else { return }
        let size = workbenchState.petSize
        let origin = display.clampedOrigin(panel.frame.origin, petSize: size)
        if origin != panel.frame.origin { panel.setFrameOrigin(origin) }
        saveRestingPlacement(.resting(at: panel.frame.origin, on: display, petSize: size))
        layoutReminder()
    }

    private func saveRestingPlacement(_ placement: PetPlacement) {
        restingPlacement = placement
        if !isTest, let data = try? JSONEncoder().encode(placement) {
            UserDefaults.standard.set(data, forKey: "petRestingPlacement")
        }
    }

    private func clearEdgePlacement() {
        edgePlacement = nil
        send("setEdge(null)")
        petGaze = nil
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

    private func showPet(_ visible: Bool, temporarily: Bool = false, userInitiated: Bool = false) {
        let wasVisible = workbenchState.petIsVisible
        if temporarily {
            workbenchState.temporarilyHidden = !visible
        } else {
            workbenchState.visible = visible
            workbenchState.temporarilyHidden = false
            UserDefaults.standard.set(visible, forKey: "shibaVisible")
        }
        if visible && !wasVisible {
            petHiddenHintWindow?.orderOut(nil)
            if !petPositionIsVisible() { resetPosition() }
        }
        refreshPetVisibility()
        if userInitiated && wasVisible && !visible { showPetHiddenHintIfNeeded() }
    }

    private func petPositionIsVisible() -> Bool {
        let displays = PetDisplay.connected
        let size = CGFloat(workbenchState.petSize)
        if let edgePlacement {
            let resolved = PetPlacement.peeking(edgePlacement).resolve(in: displays, petSize: size)
            return resolved?.edge != nil && resolved?.frame == panel.frame
        }
        let center = NSPoint(x: panel.frame.midX, y: panel.frame.midY)
        if case let .desktop(displayID, _, _) = restingPlacement {
            return displays.contains { $0.id == displayID && $0.visible.contains(center) }
        }
        return displays.contains { $0.visible.contains(center) }
    }

    private func showPetHiddenHintIfNeeded() {
        let prefs = UserDefaults.standard
        guard !prefs.bool(forKey: Self.petHiddenHintKey) else { return }
        let pawFrame = status.button.flatMap { button -> NSRect? in
            guard let window = button.window, window.isVisible, !button.isHidden else { return nil }
            return window.convertToScreen(button.convert(button.bounds, to: nil))
        }
        let pawScreen = pawFrame.flatMap { anchor in NSScreen.screens.first { $0.frame.intersects(anchor) } }
        guard let screen = pawScreen ?? NSScreen.main else { return }

        let host = NSHostingView(rootView:
            Text("小猫已隐藏。点击菜单栏爪印可以唤回。")
                .font(.system(size: 13))
                .padding(.horizontal, 12)
                .padding(.vertical, 9)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 9))
                .fixedSize()
        )
        fitCardHost(host, fallback: NSSize(width: 280, height: 35))
        let hint = PetPanel(contentRect: host.frame, styleMask: [.borderless, .nonactivatingPanel],
                            backing: .buffered, defer: false)
        hint.isOpaque = false
        hint.backgroundColor = .clear
        hint.hasShadow = true
        hint.level = .floating
        hint.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        hint.ignoresMouseEvents = true
        hint.contentView = host
        let visible = screen.visibleFrame
        let anchor = pawScreen == nil ? nil : pawFrame
        let width = host.frame.width
        let x = min(max((anchor?.midX ?? visible.maxX) - width / 2, visible.minX + 8), visible.maxX - width - 8)
        let y = min(anchor?.minY ?? visible.maxY, visible.maxY) - host.frame.height - 8
        hint.setFrameOrigin(NSPoint(x: x, y: y))
        petHiddenHintWindow = hint
        hint.orderFrontRegardless()
        prefs.set(true, forKey: Self.petHiddenHintKey)
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { [weak hint] in hint?.orderOut(nil) }
    }

    private func refreshPetVisibility() {
        status.menu = makeMenu()
        if workbenchState.petIsVisible {
            guard ready else { return }
            panel.orderFrontRegardless()
            if !reminderList.items.isEmpty { showReminders() }
            if focus.showsCard { showFocusCard() }
        } else {
            web.cancelPointerInteraction()
            send("cancelPetLove()")
            panel.orderOut(nil)
            restoreDesktopActionPlacement()
            hideReminders()
            hideReminderInput()
            focus.unpin()
            hideFocusCard()
            hideQuickBar()
            hideDropChoice()
            hideTrashToast()
            hideWeatherCard()
        }
    }

    private func resizePet(_ size: Double) {
        UserDefaults.standard.set(size, forKey: "shibaSize")
        hideQuickBar()
        hideReminderInput()
        if let edgePlacement {
            placePet(edgePlacement)
            return
        }
        let display = desktopDisplay(in: PetDisplay.connected)
        let corner = NSPoint(x: panel.frame.maxX, y: panel.frame.minY)
        panel.setContentSize(NSSize(width: size, height: size))
        panel.setFrameOrigin(NSPoint(x: corner.x - size, y: corner.y))
        if actionReturnPlacement == nil { rememberDesktopPosition(on: display) }
    }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        if #available(macOS 26, *), let meeting = meetingRecorderStorage as? MeetingRecorder,
           meeting.phase.isCapturing {
            return .terminateCancel
        }
        return .terminateNow
    }

    func applicationWillTerminate(_ notification: Notification) {
        inputRefreshTimer?.invalidate()
        typingActivity.flush()
        gazeTimer?.invalidate()
        weatherTimer?.invalidate()
        music.stop()
        clipboard.stop()
        stopListening()
        if let reminderClickMonitor { NSEvent.removeMonitor(reminderClickMonitor) }
        if let clipboardClickMonitor { NSEvent.removeMonitor(clipboardClickMonitor) }
        stopSelectionWatcher()
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

    private func handleTypingKey() {
        guard workbenchState.typingStatus == .active else { return }
        if workbenchState.typingStatsEnabled { typingActivity.recordKey() }
        if workbenchState.typingAnimationEnabled { send("key()") }
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
                    if pet.workbenchState.needsKeyboardMonitoring, let tap = pet.keyboardTap {
                        CGEvent.tapEnable(tap: tap, enable: true)
                    }
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

    private func setupInputFeatures() {
        refreshInputFeatures()
        let timer = Timer(timeInterval: 3, repeats: true) { [weak self] _ in
            self?.refreshInputFeatures()
        }
        RunLoop.main.add(timer, forMode: .common)
        inputRefreshTimer = timer
    }

    private func refreshInputFeatures() {
        if workbenchState.showTypingStats { typingActivity.refreshToday() }
        refreshTypingListener()
        refreshSelectionWatcher()
    }

    private func refreshTypingListener() {
        let next: TypingSyncStatus
        if !workbenchState.needsKeyboardMonitoring {
            next = .off
        } else if CGPreflightListenEventAccess() {
            next = startListening() ? .active : .unavailable
        } else {
            next = .needsPermission
        }
        if next != .active { stopListening() }
        if next == workbenchState.typingStatus { return }
        if workbenchState.typingStatus == .active && next != .active {
            if workbenchState.typingStatsEnabled { typingActivity.pauseRecording() }
            if workbenchState.typingAnimationEnabled { send("stopTyping()") }
        }
        workbenchState.typingStatus = next
    }

    private func setTypingAnimation(_ enabled: Bool) {
        workbenchState.typingAnimationEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: "typingAnimationEnabled")
        if !enabled { send("stopTyping()") }
        refreshTypingListener()
        if enabled { requestTypingPermissionIfNeeded() }
    }

    private func setTypingStats(_ enabled: Bool) {
        workbenchState.typingStatsEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: "typingStatsEnabled")
        if !enabled { typingActivity.pauseRecording() }
        refreshTypingListener()
        if enabled { requestTypingPermissionIfNeeded() }
    }

    private func requestTypingPermissionIfNeeded() {
        guard workbenchState.typingStatus == .needsPermission, !requestedTypingPermission else { return }
        requestedTypingPermission = true
        _ = CGRequestListenEventAccess()
        refreshTypingListener()
    }

    private func openInputMonitoringSettings() {
        if let settings = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent") {
            NSWorkspace.shared.open(settings)
        }
    }

    private func makeMenu(fromStatusBar: Bool = true) -> NSMenu {
        let menu = NSMenu()
        let recallFirst = fromStatusBar && !workbenchState.petIsVisible
        let visibilityItem = menuItem(petVisibilityMenuTitle, #selector(toggleTemporaryPetVisibility))
        if recallFirst { menu.addItem(visibilityItem) }
        menu.addItem(menuItem("打开工作台", #selector(openWorkbench)))
        if #available(macOS 26, *) {
            let recorder = meetingRecorder
            if let activeItem = activeMeetingMenuItem(for: recorder.phase) {
                menu.addItem(activeItem)
            }
        }
        addFocusItems(to: menu)
        if !recallFirst { menu.addItem(visibilityItem) }

        menu.addItem(.separator())
        let reminders = addSubmenu("提醒", to: menu)
        reminders.addItem(menuItem("添加重要提醒…", #selector(addReminder)))
        if !reminderList.items.isEmpty {
            reminders.addItem(menuItem("清除全部提醒", #selector(clearReminders)))
        }
        if #available(macOS 26, *) {
            let recorder = meetingRecorder
            let meetings = addSubmenu("会议录音", to: menu)
            if recorder.phase == .idle {
                let start = menuItem("开始会议录音", #selector(toggleMeetingRecording))
                meetings.autoenablesItems = false
                start.isEnabled = recorder.canStart
                meetings.addItem(start)
            }
            meetings.addItem(menuItem("查看会议录音…", #selector(openMeetingRecordings)))
        }
        addWeatherItems(to: menu)
        let listeningTitle = music.activeApp.map { "听歌状态（\($0) 播放中）" } ?? "听歌状态"
        let listening = menuItem(listeningTitle, #selector(toggleMusicWatch))
        listening.state = music.enabled ? .on : .off
        menu.addItem(listening)
        menu.addItem(menuItem("剪贴板（\(clipboard.items.count)）", #selector(openClipboard)))

        let organization = addSubmenu("整理文件", to: menu)
        organization.addItem(menuItem("帮我整理桌面", #selector(organizeDesktopFiles)))
        organization.addItem(menuItem("帮我整理文件夹…", #selector(chooseFileOrganizationFolder)))

        menu.addItem(.separator())
        let settings = addSubmenu("桌宠设置", to: menu)
        settings.delegate = self
        settings.addItem(menuItem("登录时启动", #selector(toggleLoginLaunch)))
        let approval = menuItem("在系统设置中确认登录项…", #selector(openLoginItemSettings))
        approval.isHidden = true
        settings.addItem(approval)
        settings.addItem(menuItem("将桌宠移回屏幕", #selector(resetPosition)))
        addUpdateItem(to: settings)
        menu.addItem(menuItem("退出桌宠", #selector(quit)))
        return menu
    }

    private func addSubmenu(_ title: String, to menu: NSMenu) -> NSMenu {
        let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        let submenu = NSMenu(title: title)
        item.submenu = submenu
        menu.addItem(item)
        return submenu
    }

    @available(macOS 26, *)
    private func activeMeetingMenuItem(for phase: MeetingRecorder.Phase) -> NSMenuItem? {
        let statusTitle: String
        switch phase {
        case .idle: return nil
        case .recording: return menuItem("结束会议录音", #selector(toggleMeetingRecording))
        case .starting: statusTitle = "正在启动会议录音…"
        case .saving: statusTitle = "正在保存会议录音…"
        case .transcribing: statusTitle = "正在转写会议录音…"
        case .summarizing: statusTitle = "正在生成会议纪要…"
        }
        let item = NSMenuItem(title: statusTitle, action: nil, keyEquivalent: "")
        item.isEnabled = false
        return item
    }

    private var petVisibilityMenuTitle: String {
        workbenchState.petIsVisible ? "暂时隐藏小猫" : "唤回小猫"
    }

    func menuNeedsUpdate(_ menu: NSMenu) {
        guard let item = menu.items.first(where: { $0.action == #selector(toggleLoginLaunch) }) else { return }
        let state = SMAppService.mainApp.status
        item.state = state == .enabled ? .on : state == .requiresApproval ? .mixed : .off
        menu.items.first { $0.action == #selector(openLoginItemSettings) }?.isHidden = state != .requiresApproval
    }

    @objc private func toggleTemporaryPetVisibility() {
        showPet(!workbenchState.petIsVisible, temporarily: workbenchState.visible, userInitiated: true)
    }

    @objc private func toggleLoginLaunch() {
        let service = SMAppService.mainApp
        let registered = service.status == .enabled || service.status == .requiresApproval
        do {
            if registered {
                try service.unregister()
            } else {
                try service.register()
            }
        } catch {
            let alert = NSAlert()
            alert.messageText = registered ? "无法关闭登录时启动" : "无法开启登录时启动"
            alert.informativeText = error.localizedDescription
            alert.addButton(withTitle: "打开登录项设置")
            alert.addButton(withTitle: "关闭")
            if alert.runModal() == .alertFirstButtonReturn { openLoginItemSettings() }
        }
    }

    @objc private func openLoginItemSettings() {
        SMAppService.openSystemSettingsLoginItems()
    }

    private func addUpdateItem(to menu: NSMenu) {
        let item = NSMenuItem(
            title: "检查更新…",
            action: #selector(AppUpdates.checkForUpdates(_:)),
            keyEquivalent: ""
        )
        item.target = appUpdates
        item.isEnabled = appUpdates != nil
        menu.addItem(item)
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

    @objc private func resetPosition() {
        actionReturnPlacement = nil
        guard let display = PetDisplay.connected.first else { return }
        hideQuickBar()
        hideReminderInput()
        let size = workbenchState.petSize
        if edgePlacement != nil {
            clearEdgePlacement()
        }
        panel.setContentSize(NSSize(width: size, height: size))
        // Leave room for the wider focus card so it is not clamped at rest and
        // can keep a fixed offset while the pet is dragged.
        let petWidth = panel.frame.width
        let cardInset = max(24, (FocusCard.width - petWidth) / 2 + 8)
        panel.setFrameOrigin(NSPoint(x: display.visible.maxX - petWidth - cardInset, y: display.visible.minY + 58))
        rememberDesktopPosition(on: display)
    }

    @objc private func quit() { NSApp.terminate(nil) }
}

let app = NSApplication.shared
let pet = DesktopPet()
app.delegate = pet
app.setActivationPolicy(.regular)
app.run()
