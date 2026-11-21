import AppKit
import ColorSync

enum PetEdge: String, Codable {
    case left, right, bottom

    // Match the cropped sprite dimensions in render.ts, relative to the 320px canvas.
    func size(for petSize: CGFloat) -> NSSize {
        switch self {
        case .left, .right: return NSSize(width: petSize * 144 / 320, height: petSize * 280 / 320)
        case .bottom: return NSSize(width: petSize * 256 / 320, height: petSize * 132 / 320)
        }
    }

    var eyeCenter: NSPoint {
        switch self {
        case .left: return NSPoint(x: 0.19, y: 0.50)
        case .right: return NSPoint(x: 0.81, y: 0.50)
        case .bottom: return NSPoint(x: 0.5, y: 0.92)
        }
    }

    func isShared(at point: NSPoint, in screen: NSRect, neighbors: [NSRect]) -> Bool {
        let outside: NSPoint
        switch self {
        case .left: outside = NSPoint(x: screen.minX - 1, y: point.y)
        case .right: outside = NSPoint(x: screen.maxX + 1, y: point.y)
        case .bottom: outside = NSPoint(x: point.x, y: screen.minY - 1)
        }
        return neighbors.contains { $0.contains(outside) }
    }

    func anchor(at point: NSPoint, in visible: NSRect) -> CGFloat {
        let fraction = self == .bottom
            ? (point.x - visible.minX) / visible.width
            : (point.y - visible.minY) / visible.height
        return min(1, max(0, fraction))
    }
}

enum PetCorner: String, Codable, CaseIterable { case left, right }

struct PetCornerPlacement: Codable {
    let corner: PetCorner
    let displayID: String

}

struct PetEdgePlacement: Codable {
    // Decode placements written before build40 and keep the save format readable
    // by older builds. Both legacy surfaces map to the display's usable edge.
    enum Surface: String, Codable { case screen, dock }

    let edge: PetEdge
    var surface: Surface = .screen
    let displayID: String
    let anchor: CGFloat

    func frame(in display: PetDisplay, petSize: CGFloat, neighbors: [NSRect]) -> NSRect? {
        guard anchor.isFinite, (0...1).contains(anchor) else { return nil }
        let visible = display.visible
        let dimensions = edge.size(for: petSize)
        // AppKit rounds the panel bounds. Keep its cropped edge flush.
        let size = NSSize(width: dimensions.width.rounded(), height: dimensions.height.rounded())
        let left = visible.minX.rounded(.up)
        let right = visible.maxX.rounded(.down)
        let bottom = visible.minY.rounded(.up)
        let top = visible.maxY.rounded(.down)
        guard right - left >= size.width, top - bottom >= size.height else { return nil }

        let x = visible.minX + visible.width * anchor
        let y = visible.minY + visible.height * anchor
        let origin: NSPoint
        let edgePoint: NSPoint
        switch edge {
        case .bottom:
            origin = NSPoint(x: min(max((x - size.width / 2).rounded(), left), right - size.width), y: bottom)
            edgePoint = NSPoint(x: origin.x + size.width / 2, y: bottom)
        case .left, .right:
            // The upper margin fits the tilted ears. Anchor the original
            // paw area, rather than centering the taller cropped panel.
            let pawAreaHeight = (petSize * 264 / 320).rounded()
            let panelY = min(max((y - pawAreaHeight / 2).rounded(), bottom), top - size.height)
            origin = NSPoint(x: edge == .left ? left : right - size.width, y: panelY)
            edgePoint = NSPoint(x: origin.x, y: panelY + pawAreaHeight / 2)
        }
        guard !edge.isShared(at: edgePoint, in: display.frame, neighbors: neighbors) else { return nil }
        return NSRect(origin: origin, size: size)
    }
}

struct PetDisplay {
    let id: String
    let frame: NSRect
    let visible: NSRect

    static func identifier(for screen: NSScreen) -> String {
        guard let number = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber else {
            return screen.localizedName
        }
        if let uuid = CGDisplayCreateUUIDFromDisplayID(number.uint32Value)?.takeRetainedValue() {
            return CFUUIDCreateString(nil, uuid) as String
        }
        return number.stringValue
    }

    static var connected: [Self] {
        NSScreen.screens.compactMap { screen in
            let visible = screen.visibleFrame
            guard visible.width > 0, visible.height > 0 else { return nil }
            return Self(id: identifier(for: screen), frame: screen.frame, visible: visible)
        }
    }

    func clampedOrigin(_ origin: NSPoint, petSize: CGFloat) -> NSPoint {
        NSPoint(x: min(max(origin.x, visible.minX), max(visible.minX, visible.maxX - petSize)),
                y: min(max(origin.y, visible.minY), max(visible.minY, visible.maxY - petSize)))
    }
}

enum PetPlacement: Codable {
    case desktop(displayID: String, x: CGFloat, y: CGFloat)
    case corner(PetCornerPlacement)
    case peeking(PetEdgePlacement)

    static func resting(at origin: NSPoint, on display: PetDisplay, petSize: CGFloat) -> Self {
        let clamped = display.clampedOrigin(origin, petSize: petSize)
        let width = display.visible.width - petSize, height = display.visible.height - petSize
        return .desktop(displayID: display.id,
                        x: width > 0 ? (clamped.x - display.visible.minX) / width : 0.5,
                        y: height > 0 ? (clamped.y - display.visible.minY) / height : 0.5)
    }

    func resolve(in displays: [PetDisplay], petSize: CGFloat, canPeek: Bool = true) -> (frame: NSRect, edge: PetEdgePlacement?)? {
        guard let primary = displays.first else { return nil }
        let size = NSSize(width: petSize, height: petSize)
        switch self {
        case let .desktop(id, x, y):
            guard x.isFinite, y.isFinite, (0...1).contains(x), (0...1).contains(y) else { return nil }
            let display = displays.first { $0.id == id } ?? primary
            let origin = NSPoint(x: display.visible.minX + x * max(0, display.visible.width - petSize),
                                 y: display.visible.minY + y * max(0, display.visible.height - petSize))
            return (NSRect(origin: origin, size: size), nil)
        case .corner(let placement):
            // Build40–46 stored the two bottom corners as a separate case.
            let edge = PetEdgePlacement(edge: .bottom, displayID: placement.displayID,
                                        anchor: placement.corner == .left ? 0 : 1)
            return PetPlacement.peeking(edge).resolve(in: displays, petSize: petSize, canPeek: canPeek)
        case .peeking(let placement):
            let display = displays.first { $0.id == placement.displayID }
            if canPeek, let display, let frame = placement.frame(in: display, petSize: petSize,
                neighbors: displays.filter({ $0.id != display.id }).map(\.frame)) {
                return (frame, placement)
            }
            let fallback = display ?? primary
            let fraction = placement.anchor.isFinite ? min(1, max(0, placement.anchor)) : 0.5
            let origin: NSPoint
            switch placement.edge {
            case .left, .right:
                origin = NSPoint(x: placement.edge == .left ? fallback.visible.minX + 24 : fallback.visible.maxX - petSize - 24,
                                 y: fallback.visible.minY + fraction * fallback.visible.height - petSize / 2)
            case .bottom:
                origin = NSPoint(x: fallback.visible.minX + fraction * fallback.visible.width - petSize / 2,
                                 y: fallback.visible.minY + 24)
            }
            return (NSRect(origin: fallback.clampedOrigin(origin, petSize: petSize), size: size), nil)
        }
    }
}
