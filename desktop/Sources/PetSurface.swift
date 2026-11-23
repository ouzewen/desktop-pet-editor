import AppKit

enum PetSurface {
    static func edge(at point: NSPoint, pet: NSRect, on display: PetDisplay, neighbors: [NSRect]) -> PetEdge? {
        let frame = display.frame
        guard frame.contains(point) else { return nil }
        let sideReach = max(24, min(34, pet.width * 0.13))
        let bodyReach = max(12, min(22, pet.width * 0.09))
        let sideInset = pet.width * 0.17
        let onDesktop = display.visible.contains(point)
        // Keep the old pointer band inside a side Dock's reserved strip.
        let leftReach = point.x < display.visible.minX ? bodyReach : sideReach
        let rightReach = point.x >= display.visible.maxX ? bodyReach : sideReach

        let left = point.x - frame.minX
        let right = frame.maxX - point.x
        let bottom = point.y - frame.minY
        // The bottom hit band and the resting peek use the physical display edge.
        let candidates: [(edge: PetEdge, distance: CGFloat, hit: Bool)] = [
            (.bottom, bottom, bottom <= 16),
            (.left, left, left <= leftReach || (onDesktop && abs(pet.minX + sideInset - frame.minX) <= bodyReach)),
            (.right, right, right <= rightReach || (onDesktop && abs(frame.maxX - pet.maxX + sideInset) <= bodyReach)),
        ]
        return candidates.filter {
            $0.hit && !$0.edge.isShared(at: point, in: frame, neighbors: neighbors)
        }.min { $0.distance < $1.distance }?.edge
    }
}
