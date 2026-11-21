import AppKit

enum PetSurface {
    static func edge(at point: NSPoint, pet: NSRect, on display: PetDisplay, neighbors: [NSRect]) -> PetEdge? {
        guard display.frame.contains(point) else { return nil }
        let reach = max(12, min(22, pet.width * 0.09))
        let sideInset = pet.width * 0.17
        let feet = pet.minY + pet.height * (35.0 / 320)
        let onDesktop = display.visible.contains(point)

        let physicalBottom = point.y - display.frame.minY
        let usableBottom = point.y - display.visible.minY
        // The same bottom edge can be reached from above the Dock or near the
        // physical rim. Drops in the reserved strip between those areas stay free.
        let bottomDistance = onDesktop ? min(physicalBottom, usableBottom) : physicalBottom
        let candidates: [(edge: PetEdge, pointer: CGFloat, sprite: CGFloat)] = [
            (.bottom, bottomDistance, feet - display.visible.minY),
            (.left, point.x - display.frame.minX, pet.minX + sideInset - display.frame.minX),
            (.right, display.frame.maxX - point.x, display.frame.maxX - pet.maxX + sideInset),
        ]
        return candidates.filter {
            ($0.pointer <= reach || (onDesktop && abs($0.sprite) <= reach))
                && !$0.edge.isShared(at: point, in: display.frame, neighbors: neighbors)
        }.min { $0.pointer < $1.pointer }?.edge
    }
}
