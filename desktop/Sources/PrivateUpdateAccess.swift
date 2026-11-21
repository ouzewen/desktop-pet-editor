import Foundation
import Sparkle

final class PrivateUpdateAccess: NSObject, SPUUpdaterDelegate {
    private let code: String
    private let feed: URL
    private let csrfToken = UUID().uuidString

    var requestHeaders: [String: String] {
        [
            "Authorization": "Bearer " + code,
            "Cookie": "suda-csrf-token=" + csrfToken,
            "X-Suda-Csrf-Token": csrfToken
        ]
    }

    init?(bundle: Bundle = .main) {
        guard let code = bundle.object(forInfoDictionaryKey: "PetUpdateAccess") as? String,
              let feedString = bundle.object(forInfoDictionaryKey: "SUFeedURL") as? String,
              let feed = URL(string: feedString) else { return nil }
        self.code = code
        self.feed = feed
    }

    func feedURLString(for updater: SPUUpdater) -> String? {
        feed.absoluteString
    }

    func updater(_ updater: SPUUpdater, shouldDownloadReleaseNotesForUpdate item: SUAppcastItem) -> Bool {
        false
    }

    func updater(_ updater: SPUUpdater, willDownloadUpdate item: SUAppcastItem, with request: NSMutableURLRequest) {
        guard let target = request.url,
              feed.scheme == target.scheme, feed.host == target.host, feed.port == target.port,
              Array(target.pathComponents.dropLast()) == Array(feed.pathComponents.dropLast()) + ["archives"]
        else {
            for field in requestHeaders.keys { request.setValue(nil, forHTTPHeaderField: field) }
            return
        }
        for (field, value) in requestHeaders { request.setValue(value, forHTTPHeaderField: field) }
    }
}
