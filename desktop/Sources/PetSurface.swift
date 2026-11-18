import AppKit

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

    static func peekFrame(over surface: NSRect, anchor: CGFloat, visible: NSRect, petSize: CGFloat) -> NSRect? {
        let dimensions = PetEdge.bottom.size(for: petSize)
        let size = NSSize(width: dimensions.width.rounded(), height: dimensions.height.rounded())
        let centerX = surface.minX + surface.width * anchor
        let y = surface.maxY.rounded()
        let idealX = (centerX - size.width / 2).rounded()
        let left = max(surface.minX, visible.minX).rounded(.up)
        let right = min(surface.maxX, visible.maxX).rounded(.down)
        guard right - left >= size.width, y >= visible.minY, y + size.height <= visible.maxY else { return nil }
        return NSRect(x: min(max(idealX, left), right - size.width), y: y, width: size.width, height: size.height)
    }
}
