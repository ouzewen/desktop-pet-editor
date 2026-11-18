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

    static func near(_ pointer: NSPoint, pet: NSRect, visible: NSRect, display: NSRect, neighbors: [NSRect]) -> Self? {
        let reach = min(22, pet.width * 0.09)
        let overhang = pet.width * 0.17 // Ignore the transparent margin of the resting sprite.
        let candidates: [(Self, CGFloat, CGFloat, NSPoint)] = [
            (.left, pointer.x - visible.minX, pet.minX + overhang - visible.minX,
             NSPoint(x: display.minX - 1, y: pointer.y)),
            (.right, visible.maxX - pointer.x, visible.maxX - pet.maxX + overhang,
             NSPoint(x: display.maxX + 1, y: pointer.y)),
            (.bottom, pointer.y - display.minY, pet.minY + overhang - display.minY,
             NSPoint(x: pointer.x, y: display.minY - 1)),
        ]
        return candidates
            .filter { _, distance, margin, outside in
                (distance <= reach || margin <= 0) && !neighbors.contains(where: { $0.contains(outside) })
            }
            .min { lhs, rhs in lhs.1 < rhs.1 }?.0
    }

    func anchor(at point: NSPoint, in screen: NSRect) -> CGFloat {
        let fraction = self == .bottom ? (point.x - screen.minX) / screen.width : (point.y - screen.minY) / screen.height
        return min(1, max(0, fraction))
    }

    func frame(at anchor: CGFloat, in visible: NSRect, display: NSRect, petSize: CGFloat) -> NSRect {
        let dimensions = size(for: petSize)
        // AppKit rounds window bounds to whole points. Round the size before
        // positioning the window so its cut edge stays flush on resize.
        let size = NSSize(width: dimensions.width.rounded(), height: dimensions.height.rounded())
        let x = (visible.minX + visible.width * anchor - size.width / 2).rounded()
        // The extra upper margin fits the tilted ears. Keep the paw positions
        // relative to the screen anchor and clamp the full panel at corners.
        let anchorHeight = self == .bottom ? size.height : (petSize * 264 / 320).rounded()
        let y = (visible.minY + visible.height * anchor - anchorHeight / 2).rounded()
        let origin: NSPoint
        switch self {
        case .bottom:
            // The sprite ends at the physical screen edge, including when
            // macOS reserves part of the desktop for the Dock.
            origin = NSPoint(x: min(max(x, visible.minX), visible.maxX - size.width), y: display.minY)
        case .left, .right:
            origin = NSPoint(x: self == .left ? visible.minX : visible.maxX - size.width,
                             y: min(max(y, visible.minY), visible.maxY - size.height))
        }
        return NSRect(origin: origin, size: size)
    }
}

struct PetEdgePlacement: Codable {
    enum Surface: String, Codable { case screen, dock }

    let edge: PetEdge
    let surface: Surface
    let displayID: String
    let anchor: CGFloat

    func frame(in display: PetDisplay, petSize: CGFloat) -> NSRect? {
        guard anchor.isFinite, (0...1).contains(anchor) else { return nil }
        switch surface {
        case .screen:
            return edge.frame(at: anchor, in: display.visible, display: display.frame, petSize: petSize)
        case .dock:
            guard edge == .bottom, let dock = PetSurface.dock(in: display.frame, visible: display.visible) else { return nil }
            return PetSurface.peekFrame(over: dock, anchor: anchor, visible: display.visible, petSize: petSize)
        }
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
        case .peeking(let placement):
            let display = displays.first { $0.id == placement.displayID }
            if canPeek, let display, let frame = placement.frame(in: display, petSize: petSize) {
                return (frame, placement)
            }
            // Keep the cat nearby when a dock or screen goes away.
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
