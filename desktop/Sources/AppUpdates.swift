import AppKit
import Sparkle

private final class ConfirmedUpdateDriver: SPUStandardUserDriver {
    private struct UpdateOffer {
        let item: SUAppcastItem
        let state: SPUUserUpdateState
        let reply: (SPUUserUpdateChoice) -> Void
    }

    private var offer: UpdateOffer?
    var onAvailableVersionChanged: (String?) -> Void = { _ in }

    override func showUpdateFound(
        with appcastItem: SUAppcastItem, state: SPUUserUpdateState,
        reply: @escaping (SPUUserUpdateChoice) -> Void
    ) {
        if state.userInitiated || appcastItem.isInformationOnlyUpdate || appcastItem.isMajorUpgrade
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
    private let driver: ConfirmedUpdateDriver
    private let updater: SPUUpdater

    init(onAvailableVersionChanged: @escaping (String?) -> Void) {
        let driver = ConfirmedUpdateDriver(hostBundle: .main, delegate: nil)
        driver.onAvailableVersionChanged = onAvailableVersionChanged
        self.driver = driver
        updater = SPUUpdater(hostBundle: .main, applicationBundle: .main, userDriver: driver, delegate: nil)
        super.init()
    }

    func start() throws {
        try updater.start()
    }

    @objc func checkForUpdates(_ sender: Any?) {
        updater.checkForUpdates()
    }

    func installOfferedUpdate() {
        driver.installOfferedUpdate()
    }

    func validateMenuItem(_ menuItem: NSMenuItem) -> Bool {
        updater.canCheckForUpdates
    }
}
