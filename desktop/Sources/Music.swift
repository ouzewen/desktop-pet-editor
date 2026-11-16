import AppKit
import CoreAudio
import SwiftUI

// MARK: - Catalog

struct MusicApp {
    let bundleID: String
    let name: String
    let aliases: [String]
}

/// The players we treat as "music". Audio from anything else — video, calls,
/// browsers — does not put the pet into the listening state.
enum MusicCatalog {
    static let apps: [MusicApp] = [
        MusicApp(bundleID: "com.apple.Music", name: "Apple Music", aliases: ["Music"]),
        MusicApp(bundleID: "com.tencent.QQMusicMac", name: "QQ音乐", aliases: ["QQMusic", "QQ音乐"]),
        MusicApp(bundleID: "com.spotify.client", name: "Spotify", aliases: ["Spotify"]),
        MusicApp(bundleID: "com.netease.163music", name: "网易云音乐", aliases: ["NeteaseMusic", "网易云音乐"]),
        MusicApp(bundleID: "com.kugou.kugou1002", name: "酷狗音乐", aliases: ["KugouMusic", "酷狗音乐"]),
        MusicApp(bundleID: "com.kugou.mac", name: "酷狗音乐", aliases: ["KugouMusic"]),
    ]

    static func name(bundleID: String?, processName: String?) -> String? {
        if let bundleID, let hit = apps.first(where: { $0.bundleID == bundleID }) {
            return hit.name
        }
        guard let processName, !processName.isEmpty else { return nil }
        return apps.first { app in
            app.aliases.contains { processName.localizedCaseInsensitiveContains($0) }
        }?.name
    }
}

// MARK: - Audio probe

enum MusicProbe {
    private static let system = AudioObjectID(kAudioObjectSystemObject)
    private static let global = kAudioObjectPropertyScopeGlobal
    private static let main = kAudioObjectPropertyElementMain

    private static func propertyAddress(_ selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress {
        AudioObjectPropertyAddress(mSelector: selector, mScope: global, mElement: main)
    }

    /// Names of allow-listed players currently writing audio to an output device.
    static func playing() -> [String] {
        var address = propertyAddress(kAudioHardwarePropertyProcessObjectList)
        var size: UInt32 = 0
        guard AudioObjectGetPropertyDataSize(system, &address, 0, nil, &size) == noErr,
              size > 0 else { return [] }

        let count = Int(size) / MemoryLayout<AudioObjectID>.size
        var objects = [AudioObjectID](repeating: 0, count: count)
        guard AudioObjectGetPropertyData(system, &address, 0, nil, &size, &objects) == noErr else {
            return []
        }

        var names: [String] = []
        for object in objects {
            guard isRunningOutput(object), let pid = processID(object) else { continue }
            let app = NSRunningApplication(processIdentifier: pid)
            let name = MusicCatalog.name(
                bundleID: app?.bundleIdentifier,
                processName: app?.executableURL?.lastPathComponent ?? app?.localizedName
            )
            if let name, !names.contains(name) {
                names.append(name)
            }
        }
        return names
    }

    private static func processID(_ object: AudioObjectID) -> pid_t? {
        var address = propertyAddress(kAudioProcessPropertyPID)
        var pid: pid_t = 0
        var size = UInt32(MemoryLayout<pid_t>.size)
        guard AudioObjectGetPropertyData(object, &address, 0, nil, &size, &pid) == noErr else {
            return nil
        }
        return pid
    }

    private static func isRunningOutput(_ object: AudioObjectID) -> Bool {
        var address = propertyAddress(kAudioProcessPropertyIsRunningOutput)
        var running: UInt32 = 0
        var size = UInt32(MemoryLayout<UInt32>.size)
        guard AudioObjectGetPropertyData(object, &address, 0, nil, &size, &running) == noErr else {
            return false
        }
        return running != 0
    }
}

// MARK: - Watcher

final class MusicWatcher {
    private enum Key {
        static let enabled = "shibaMusicWatchEnabled"
    }

    /// Ticks a player must keep audio running before the state flips, and the
    /// same for silence — short pauses between tracks should not flicker.
    private static let requiredStreak = 2
    private static let interval: TimeInterval = 3

    private(set) var activeApp: String?
    var onChange: ((String?) -> Void)?

    var enabled: Bool {
        didSet {
            UserDefaults.standard.set(enabled, forKey: Key.enabled)
            if enabled { start() } else { stop() }
        }
    }

    private var timer: Timer?
    private var playStreak = 0
    private var idleStreak = 0

    /// `enabled` overrides the stored preference without starting the watcher;
    /// used by `--self-test` so a real probe cannot race the assertions.
    init(enabled stored: Bool? = nil) {
        enabled = stored ?? ((UserDefaults.standard.object(forKey: Key.enabled) as? Bool) ?? true)
    }

    func start() {
        guard enabled, timer == nil else { return }
        tick()
        let next = Timer(timeInterval: MusicWatcher.interval, repeats: true) { [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(next, forMode: .common)
        timer = next
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        playStreak = 0
        idleStreak = 0
        if activeApp != nil {
            activeApp = nil
            onChange?(nil)
        }
    }

    func tick() {
        evaluate(names: MusicProbe.playing())
    }

    /// Visible for `--self-test`, which drives the streak logic directly.
    func evaluate(names: [String]) {
        guard enabled else { return }
        if let name = names.first {
            playStreak += 1
            idleStreak = 0
            if activeApp == nil {
                if playStreak >= MusicWatcher.requiredStreak {
                    activeApp = name
                    onChange?(name)
                }
            } else if activeApp != name {
                activeApp = name
                onChange?(name)
            }
        } else {
            idleStreak += 1
            playStreak = 0
            if activeApp != nil, idleStreak >= MusicWatcher.requiredStreak {
                activeApp = nil
                onChange?(nil)
            }
        }
    }
}

// MARK: - Badge

struct MusicBadge: View {
    let appName: String

    @Environment(\.colorScheme) private var colorScheme

    private var palette: PixelPalette { .of(colorScheme) }

    var body: some View {
        HStack(spacing: 5) {
            PixelGlyph(kind: .note, color: palette.accent, size: 11)
            Text("听歌中 · \(appName)")
                .font(PixelFont.font(11))
                .foregroundStyle(palette.ink)
                .lineLimit(1)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(PixelBox(corner: 2).fill(palette.panel.opacity(0.96)))
        .overlay(PixelBox(corner: 2).stroke(palette.borderSoft, lineWidth: 1))
    }
}
