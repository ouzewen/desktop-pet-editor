import AppKit
import Sparkle

private final class ConfirmedUpdateDriver: SPUStandardUserDriver {
    private struct UpdateOffer {
        let item: SUAppcastItem
        let state: SPUUserUpdateState
        let reply: (SPUUserUpdateChoice) -> Void
    }

    private var offer: UpdateOffer?
    var isWorkbenchCheck = false
    var onAvailableVersionChanged: (String?) -> Void = { _ in }

    override func showUserInitiatedUpdateCheck(cancellation: @escaping () -> Void) {
        if !isWorkbenchCheck {
            super.showUserInitiatedUpdateCheck(cancellation: cancellation)
        }
    }

    override func showUpdateFound(
        with appcastItem: SUAppcastItem, state: SPUUserUpdateState,
        reply: @escaping (SPUUserUpdateChoice) -> Void
    ) {
        if (state.userInitiated && !isWorkbenchCheck) || appcastItem.isInformationOnlyUpdate || appcastItem.isMajorUpgrade
            || appcastItem.isCriticalUpdate || state.stage != .notDownloaded {
            super.showUpdateFound(with: appcastItem, state: state, reply: reply)
            return
        }
        offer = UpdateOffer(item: appcastItem, state: state, reply: reply)
        onAvailableVersionChanged(appcastItem.displayVersionString)
    }

    func installOfferedUpdate() {
        takeOffer()?.reply(.install)
    }

    override func showUpdateInFocus() {
        if let offer = takeOffer() {
            super.showUpdateFound(with: offer.item, state: offer.state, reply: offer.reply)
        }
        super.showUpdateInFocus()
    }

    override func dismissUpdateInstallation() {
        _ = takeOffer()
        super.dismissUpdateInstallation()
    }

    private func takeOffer() -> UpdateOffer? {
        guard let offer else { return nil }
        self.offer = nil
        onAvailableVersionChanged(nil)
        return offer
    }

    override func showReady(toInstallAndRelaunch reply: @escaping (SPUUserUpdateChoice) -> Void) {
        // Automatic installation is disabled. The user already chose Install Update
        // before Sparkle downloaded and verified this app bundle.
        reply(.install)
    }
}

final class AppUpdates: NSObject, NSMenuItemValidation {
    private static let lastDailyCheckKey = "petLastDailyUpdateCheck"
    private let driver: ConfirmedUpdateDriver
    private let updater: SPUUpdater
    private let privateAccess: PrivateUpdateAccess?
    private var dailyCheckTimer: Timer?
    private var updateSessionObservation: NSKeyValueObservation?
    var onSessionProgressChanged: (Bool) -> Void = { _ in }

    init(onAvailableVersionChanged: @escaping (String?) -> Void) {
        let driver = ConfirmedUpdateDriver(hostBundle: .main, delegate: nil)
        let access = PrivateUpdateAccess()
        driver.onAvailableVersionChanged = onAvailableVersionChanged
        self.driver = driver
        privateAccess = access
        updater = SPUUpdater(hostBundle: .main, applicationBundle: .main, userDriver: driver, delegate: access)
        super.init()
    }

    func start() throws {
        if let privateAccess {
            updater.httpHeaders = privateAccess.requestHeaders
        }
        // Older builds can have Sparkle's interval scheduler enabled in preferences.
        if updater.automaticallyChecksForUpdates {
            updater.automaticallyChecksForUpdates = false
        }
        try updater.start()
        updateSessionObservation = updater.observe(\.sessionInProgress, options: [.new]) { [weak self] _, change in
            guard let self, let inProgress = change.newValue else { return }
            if !inProgress { self.driver.isWorkbenchCheck = false }
            self.onSessionProgressChanged(inProgress)
            if !inProgress {
                DispatchQueue.main.async { [weak self] in self?.scheduleDailyCheck() }
            }
        }
        NSWorkspace.shared.notificationCenter.addObserver(
            self, selector: #selector(systemTimeChanged(_:)),
            name: NSWorkspace.didWakeNotification, object: nil
        )
        for name in [Notification.Name.NSSystemClockDidChange, .NSSystemTimeZoneDidChange] {
            NotificationCenter.default.addObserver(
                self, selector: #selector(systemTimeChanged(_:)), name: name, object: nil
            )
        }
        scheduleDailyCheck()
    }

    deinit {
        dailyCheckTimer?.invalidate()
        NSWorkspace.shared.notificationCenter.removeObserver(self)
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func systemTimeChanged(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in self?.scheduleDailyCheck() }
    }

    static func nextDailyCheck(now: Date, lastCheck: Date?, calendar: Calendar) -> Date? {
        let nineAM = DateComponents(hour: 9, minute: 0, second: 0)
        let startOfToday = calendar.startOfDay(for: now)
        guard let today = calendar.nextDate(after: startOfToday, matching: nineAM, matchingPolicy: .nextTime)
        else { return nil }
        if let lastCheck, calendar.isDate(lastCheck, inSameDayAs: now) {
            return calendar.nextDate(after: max(today, now), matching: nineAM, matchingPolicy: .nextTime)
        }
        return max(today, now)
    }

    private func scheduleDailyCheck() {
        dailyCheckTimer?.invalidate()
        let now = Date()
        let defaults = UserDefaults.standard
        let calendar = Calendar.autoupdatingCurrent
        let lastCheck = defaults.object(forKey: Self.lastDailyCheckKey) as? Date
        guard var next = Self.nextDailyCheck(now: now, lastCheck: lastCheck, calendar: calendar) else { return }
        if next <= now {
            if !updater.sessionInProgress {
                defaults.set(now, forKey: Self.lastDailyCheckKey)
                updater.checkForUpdatesInBackground()
            }
            // A busy session retries when it ends. Keep a timer for the next day as well.
            guard let tomorrow = Self.nextDailyCheck(now: now, lastCheck: now, calendar: calendar)
            else { return }
            next = tomorrow
        }
        let timer = Timer(fire: next, interval: 0, repeats: false) { [weak self] _ in
            self?.scheduleDailyCheck()
        }
        timer.tolerance = 5
        dailyCheckTimer = timer
        RunLoop.main.add(timer, forMode: .common)
    }

    @objc func checkForUpdates(_ sender: Any?) {
        updater.checkForUpdates()
    }

    func checkForUpdatesFromWorkbench() {
        guard updater.canCheckForUpdates, !updater.sessionInProgress else { return }
        driver.isWorkbenchCheck = true
        updater.checkForUpdates()
    }

    func installOfferedUpdate() {
        driver.installOfferedUpdate()
    }

    func validateMenuItem(_ menuItem: NSMenuItem) -> Bool {
        updater.canCheckForUpdates
    }
}
