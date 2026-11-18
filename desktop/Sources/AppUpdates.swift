import AppKit
import Sparkle

private final class ConfirmedUpdateDriver: SPUStandardUserDriver {
    override func showReady(toInstallAndRelaunch reply: @escaping (SPUUserUpdateChoice) -> Void) {
        // Automatic installation is disabled. The user already chose Install Update
        // before Sparkle downloaded and verified this app bundle.
        reply(.install)
    }
}

final class AppUpdates: NSObject, NSMenuItemValidation {
    private let updater: SPUUpdater

    override init() {
        let driver = ConfirmedUpdateDriver(hostBundle: .main, delegate: nil)
        updater = SPUUpdater(hostBundle: .main, applicationBundle: .main, userDriver: driver, delegate: nil)
        super.init()
    }

    func start() throws {
        try updater.start()
    }

    @objc func checkForUpdates(_ sender: Any?) {
        updater.checkForUpdates()
    }

    func validateMenuItem(_ menuItem: NSMenuItem) -> Bool {
        updater.canCheckForUpdates
    }
}
