import AppKit
import CoreGraphics

struct PetBrowserWindow {
    let id: CGWindowID
    let processID: pid_t
    let name: String
    var frame: NSRect

    enum State {
        case visible(NSRect)
        case hidden
        case closed
    }

    func state() -> State {
        guard let window = PetWindowBounds.window(id), window.processID == processID else { return .closed }
        return window.isOnscreen ? .visible(window.frame) : .hidden
    }

    static func near(_ point: NSPoint, pet: NSRect, visibleScreens: [NSRect]) -> Self? {
        let ownProcess = ProcessInfo.processInfo.processIdentifier
        var foreground: [NSRect] = []
        for window in PetWindowBounds.onscreen() where window.level == 0 && window.processID != ownProcess {
            let frame = window.frame
            let probe = NSPoint(x: point.x, y: frame.maxY - 2)
            if PetSurface.nearTop(of: frame, point: point, pet: pet),
               !foreground.contains(where: { $0.contains(probe) }),
               PetSurface.peekFrame(over: frame, anchor: PetEdge.bottom.anchor(at: point, in: frame),
                                    visibleScreens: visibleScreens, petSize: pet.width) != nil,
               let app = NSRunningApplication(processIdentifier: window.processID),
               let id = app.bundleIdentifier, isBrowser(id) {
                return Self(id: window.id, processID: window.processID, name: app.localizedName ?? "浏览器", frame: frame)
            }
            foreground.append(frame)
        }
        return nil
    }

    private static func isBrowser(_ id: String) -> Bool {
        let families = [
            "com.apple.Safari", "com.google.Chrome", "org.chromium.Chromium", "org.mozilla.firefox",
            "com.microsoft.edgemac", "com.brave.Browser", "com.operasoftware.Opera", "com.vivaldi.Vivaldi",
            "company.thebrowser.Browser", "company.thebrowser.dia", "com.kagi.kagimacOS",
            "app.zen-browser.zen", "com.duckduckgo.macos.browser", "com.yandex.desktop.yandex-browser",
            "net.waterfox.waterfox", "io.gitlab.librewolf-community", "org.uc.UC",
        ]
        return id == "com.apple.SafariTechnologyPreview"
            || families.contains { id.caseInsensitiveCompare($0) == .orderedSame || id.lowercased().hasPrefix($0.lowercased() + ".") }
    }
}

enum PetSurface {
    static func dock(in display: NSRect, visible: NSRect) -> NSRect? {
        let height = visible.minY - display.minY
        // A hidden Dock can leave a thin activation strip. Only use the
        // space macOS reserves for a visible bottom Dock.
        guard height >= 16 else { return nil }
        return NSRect(x: visible.minX, y: display.minY, width: visible.width, height: height)
    }

    static func nearTop(of surface: NSRect, point: NSPoint, pet: NSRect) -> Bool {
        guard point.x >= surface.minX, point.x <= surface.maxX else { return false }
        let reach = min(22, pet.width * 0.10)
        let distance = point.y - surface.maxY
        let feet = pet.minY + pet.height * (35.0 / 320)
        return abs(distance) <= reach || (distance >= 0 && abs(feet - surface.maxY) <= reach)
    }

    static func peekFrame(over surface: NSRect, anchor: CGFloat, visibleScreens: [NSRect], petSize: CGFloat) -> NSRect? {
        let dimensions = PetEdge.bottom.size(for: petSize)
        let size = NSSize(width: dimensions.width.rounded(), height: dimensions.height.rounded())
        let centerX = surface.minX + surface.width * anchor
        let y = surface.maxY.rounded()
        let idealX = (centerX - size.width / 2).rounded()
        return visibleScreens.compactMap { screen -> NSRect? in
            let left = max(surface.minX, screen.minX).rounded(.up)
            let right = min(surface.maxX, screen.maxX).rounded(.down)
            guard right - left >= size.width, y >= screen.minY, y + size.height <= screen.maxY else { return nil }
            return NSRect(x: min(max(idealX, left), right - size.width), y: y, width: size.width, height: size.height)
        }.min { abs($0.minX - idealX) < abs($1.minX - idealX) }
    }
}

private struct PetWindowBounds {
    let id: CGWindowID
    let processID: pid_t
    let level: Int
    let frame: NSRect
    let isOnscreen: Bool

    static func onscreen() -> [Self] {
        let rows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
        return read(rows, assumeOnscreen: true)
    }

    static func window(_ id: CGWindowID) -> Self? {
        let rows = CGWindowListCopyWindowInfo(.optionIncludingWindow, id)
        return read(rows).first { $0.id == id }
    }

    private static func read(_ rows: CFArray?, assumeOnscreen: Bool = false) -> [Self] {
        guard let mainDisplayTop = NSScreen.screens.first?.frame.maxY,
              let rows = rows as? [[String: Any]] else { return [] }
        return rows.compactMap { row in
            guard let id = row[kCGWindowNumber as String] as? CGWindowID,
                  let pid = row[kCGWindowOwnerPID as String] as? pid_t,
                  let level = row[kCGWindowLayer as String] as? Int,
                  let bounds = row[kCGWindowBounds as String] as? NSDictionary,
                  let rect = CGRect(dictionaryRepresentation: bounds),
                  !rect.isEmpty, !rect.isInfinite else { return nil }
            // Quartz measures down from the primary display's top.
            let frame = NSRect(x: rect.minX, y: mainDisplayTop - rect.maxY, width: rect.width, height: rect.height)
            let isOnscreen = assumeOnscreen || (row[kCGWindowIsOnscreen as String] as? Bool == true)
            return Self(id: id, processID: pid, level: level, frame: frame, isOnscreen: isOnscreen)
        }
    }
}
