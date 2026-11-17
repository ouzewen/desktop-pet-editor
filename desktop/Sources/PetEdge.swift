import AppKit

enum PetEdge: String {
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

struct PetEdgePlacement {
    enum Surface {
        case screen(NSNumber?)
        case dock(NSNumber?)
        case browser(PetBrowserWindow, follows: Bool)
    }

    let edge: PetEdge
    var surface: Surface
    let anchor: CGFloat

    static func displayID(for screen: NSScreen) -> NSNumber? {
        screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber
    }
}
