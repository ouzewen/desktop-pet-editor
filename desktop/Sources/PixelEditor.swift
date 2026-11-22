import AppKit
import SwiftUI

// MARK: - Palette

struct PixelPaletteEntry: Identifiable {
    let name: String
    let hex: UInt32

    var id: UInt32 { hex }
    var hexString: String { String(format: "#%06X", hex) }
}

enum PixelEditorPalette {
    static func color(_ hex: UInt32) -> NSColor {
        NSColor(
            srgbRed: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }

    static let entries: [PixelPaletteEntry] = [
        .init(name: "橘猫底色", hex: 0xEFB373),
        .init(name: "浅橘", hex: 0xF0C49D),
        .init(name: "橘棕", hex: 0xD18A4A),
        .init(name: "焦橘", hex: 0xC85A28),
        .init(name: "奶油", hex: 0xFAE5C0),
        .init(name: "暖白", hex: 0xFFF6E8),
        .init(name: "浅棕", hex: 0xB58E70),
        .init(name: "中棕", hex: 0x996138),
        .init(name: "深棕", hex: 0x704932),
        .init(name: "描边", hex: 0x442416),
        .init(name: "纯白", hex: 0xFFFFFF),
        .init(name: "银灰", hex: 0xCFD2D8),
        .init(name: "灰", hex: 0x8E949A),
        .init(name: "炭灰", hex: 0x625D67),
        .init(name: "深灰", hex: 0x2E2E31),
        .init(name: "黑", hex: 0x232326),
        .init(name: "浅粉", hex: 0xF8C5CA),
        .init(name: "内耳粉", hex: 0xE98093),
        .init(name: "莓红", hex: 0xB9546E),
        .init(name: "红", hex: 0xD64545),
        .init(name: "珊瑚橙", hex: 0xF27B58),
        .init(name: "金黄", hex: 0xF3C44F),
        .init(name: "草绿", hex: 0xA4C75A),
        .init(name: "森林绿", hex: 0x467A54),
        .init(name: "薄荷绿", hex: 0x83CEC3),
        .init(name: "青蓝", hex: 0x459DA9),
        .init(name: "浅蓝", hex: 0xA9CEF0),
        .init(name: "蓝", hex: 0x5289CF),
        .init(name: "深蓝", hex: 0x365681),
        .init(name: "淡紫", hex: 0xCEB9E7),
        .init(name: "紫", hex: 0x8A69A9),
        .init(name: "深紫", hex: 0x533C69),
    ]
}

// MARK: - Storage

struct CustomPresetInfo: Identifiable {
    let id: String
    let name: String
    let url: URL
}

struct PixelEditSnapshot {
    let png: Data
    let source: Data?

    var isPhotoFur: Bool {
        guard let source, let metadata = try? JSONSerialization.jsonObject(with: source) as? [String: Any],
              let edits = metadata["pixelEdits"] as? [String: Any] else { return false }
        return edits["scope"] as? String == "photo-fur"
    }
}

struct PhotoFurEditorSurface {
    let mask: Data
    let originalPNG: Data
}

enum PixelPresetStore {
    static var folder: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent(DesktopPetStorage.directoryName, isDirectory: true)
            .appendingPathComponent("custom", isDirectory: true)
    }

    // Older development builds wrote the preset library into the checkout.
    static func migrateCheckoutPresets() throws {
        var url = Bundle.main.bundleURL
        for _ in 0..<8 {
            let legacy = url.appendingPathComponent("public/assets/cat/custom", isDirectory: true)
            if FileManager.default.fileExists(atPath: manifestURL(in: legacy).path) {
                try migrateLegacyPresets(from: legacy, to: folder)
                return
            }
            url.deleteLastPathComponent()
        }
    }

    private static func manifestURL(in folder: URL) -> URL {
        folder.appendingPathComponent("presets.json")
    }

    private static func readManifest(in folder: URL) throws -> [[String: String]] {
        let url = manifestURL(in: folder)
        guard FileManager.default.fileExists(atPath: url.path) else { return [] }
        return try JSONDecoder().decode([[String: String]].self, from: Data(contentsOf: url))
    }

    private static func writeManifest(_ entries: [[String: String]], in folder: URL) throws {
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        try encoder.encode(entries).write(to: manifestURL(in: folder), options: .atomic)
    }

    static func migrateLegacyPresets(from legacy: URL, to folder: URL) throws {
        let files = FileManager.default
        guard files.fileExists(atPath: manifestURL(in: legacy).path) else { return }
        let legacyManifest = try readManifest(in: legacy)
        var entries = try readManifest(in: folder)
        for preset in presets(legacyManifest, in: legacy) {
            let snapshot = try read(preset.url)
            let stem = preset.url.deletingPathExtension().lastPathComponent
            var suffix = 0
            while true {
                let id = suffix == 0 ? preset.id : "\(preset.id)-legacy-\(suffix)"
                let file = suffix == 0 ? preset.url.lastPathComponent : "\(stem)-legacy-\(suffix).png"
                let target = folder.appendingPathComponent(file)
                let collisions = entries.filter { ($0["id"] ?? $0["file"]) == id || $0["file"] == file }
                let sameEntry = collisions.count == 1
                    && (collisions[0]["id"] ?? collisions[0]["file"]) == id && collisions[0]["file"] == file
                if collisions.isEmpty || sameEntry {
                    let existing = try? read(target)
                    if !files.fileExists(atPath: target.path) {
                        try write(snapshot, to: target)
                    } else if let existing, existing.png == snapshot.png,
                              existing.source == nil || snapshot.source == nil || existing.source == snapshot.source {
                        if existing.source == nil, let source = snapshot.source {
                            try source.write(to: sourceURL(for: target), options: .atomic)
                        }
                    } else {
                        suffix += 1
                        continue
                    }
                    if collisions.isEmpty { entries.append(["id": id, "name": preset.name, "file": file]) }
                    break
                }
                suffix += 1
            }
        }
        try writeManifest(entries, in: folder)
        let backups = folder.deletingLastPathComponent().appendingPathComponent("legacy-custom-backups", isDirectory: true)
        try files.createDirectory(at: backups, withIntermediateDirectories: true)
        // Only move the old directory after its entries are usable in the private library.
        try files.moveItem(at: legacy, to: backups.appendingPathComponent(UUID().uuidString, isDirectory: true))
    }

    private static func sourceURL(for url: URL) -> URL {
        url.deletingPathExtension().appendingPathExtension("source.json")
    }

    static func read(_ url: URL) throws -> PixelEditSnapshot {
        PixelEditSnapshot(png: try Data(contentsOf: url), source: try? Data(contentsOf: sourceURL(for: url)))
    }

    static func write(_ snapshot: PixelEditSnapshot, to url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try snapshot.png.write(to: url, options: .atomic)
        let sourceURL = sourceURL(for: url)
        if let source = snapshot.source {
            try source.write(to: sourceURL, options: .atomic)
        } else if FileManager.default.fileExists(atPath: sourceURL.path) {
            try FileManager.default.removeItem(at: sourceURL)
        }
    }

    static func load(from folder: URL = PixelPresetStore.folder) -> [CustomPresetInfo] {
        presets((try? readManifest(in: folder)) ?? [], in: folder)
    }

    private static func presets(_ list: [[String: String]], in folder: URL) -> [CustomPresetInfo] {
        return list.compactMap { item in
            guard let name = item["name"], let file = item["file"],
                  !file.contains("/"), (file as NSString).pathExtension.lowercased() == "png" else { return nil }
            let url = folder.appendingPathComponent(file)
            guard FileManager.default.fileExists(atPath: url.path) else { return nil }
            return CustomPresetInfo(id: item["id"] ?? file, name: name, url: url)
        }
    }

    @discardableResult
    static func save(name: String, cells: [UInt32], source: Data?, in folder: URL = PixelPresetStore.folder) -> URL? {
        guard let png = renderPNG(cells: cells) else { return nil }
        return save(name: name, snapshot: PixelEditSnapshot(png: png, source: source), in: folder)
    }

    static func save(name: String, snapshot: PixelEditSnapshot, in folder: URL = PixelPresetStore.folder) -> URL? {
        let slug = slugify(name)
        guard !slug.isEmpty else { return nil }
        let file = "\(slug).png"
        let url = folder.appendingPathComponent(file)
        do {
            var list = try readManifest(in: folder)
            try write(snapshot, to: url)
            list.removeAll { $0["id"] == slug }
            list.append(["id": slug, "name": name, "file": file])
            try writeManifest(list, in: folder)
        } catch {
            return nil
        }
        return url
    }

    @discardableResult
    static func delete(_ preset: CustomPresetInfo) -> Bool {
        let fm = FileManager.default
        let folder = preset.url.deletingLastPathComponent()
        guard var list = try? readManifest(in: folder) else { return false }
        list.removeAll { ($0["id"] ?? $0["file"]) == preset.id }
        do {
            try writeManifest(list, in: folder)
        } catch {
            return false
        }
        try? fm.removeItem(at: preset.url)
        try? fm.removeItem(at: sourceURL(for: preset.url))
        return true
    }

    // Premultiplied sRGB pixels, in 0xAARRGGBB order as UInt32 values.
    private static let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    private static let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedFirst.rawValue)
        .union(.byteOrder32Little)

    static func pixels(from png: Data, side requestedSide: Int? = nil) -> [UInt32]? {
        guard let source = NSBitmapImageRep(data: png)?.cgImage else { return nil }
        let artSide = PixelEditorModel.artSide
        let side = requestedSide ?? (source.width == artSide && source.height == artSide ? artSide : PixelEditorModel.legacySide)
        var cells = [UInt32](repeating: 0, count: side * side)
        let drawn = cells.withUnsafeMutableBytes { buffer -> Bool in
            guard let context = CGContext(
                data: buffer.baseAddress, width: side, height: side,
                bitsPerComponent: 8, bytesPerRow: side * MemoryLayout<UInt32>.size,
                space: colorSpace, bitmapInfo: bitmapInfo.rawValue
            ) else { return false }
            context.interpolationQuality = .none
            context.setBlendMode(.copy)
            context.draw(source, in: CGRect(x: 0, y: 0, width: side, height: side))
            return true
        }
        return drawn ? cells : nil
    }

    static func image(cells: [UInt32], side: Int) -> CGImage? {
        guard cells.count == side * side,
              let provider = CGDataProvider(data: cells.withUnsafeBytes { Data($0) } as CFData) else { return nil }
        return CGImage(
            width: side, height: side, bitsPerComponent: 8, bitsPerPixel: 32,
            bytesPerRow: side * MemoryLayout<UInt32>.size, space: colorSpace,
            bitmapInfo: bitmapInfo, provider: provider, decode: nil,
            shouldInterpolate: false, intent: .defaultIntent
        )
    }

    static func renderPNG(cells: [UInt32], side: Int = PixelEditorModel.legacySide) -> Data? {
        guard let image = image(cells: cells, side: side) else { return nil }
        return NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])
    }

    static func slugify(_ name: String) -> String {
        let allowed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let mapped = allowed.unicodeScalars.map { scalar -> Character in
            if CharacterSet.alphanumerics.contains(scalar) { return Character(scalar) }
            return "-"
        }
        let slug = String(mapped).replacingOccurrences(of: "-+", with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
        return String(slug.prefix(40))
    }
}

// MARK: - Model

enum PixelBrushShape: String, CaseIterable {
    case square = "方块"
    case round = "圆点"

    func rows(diameter: Int) -> [(left: Int, right: Int)] {
        if self == .square {
            return Array(repeating: (left: 0, right: diameter - 1), count: diameter)
        }

        let radius = Double(diameter) / 2
        let center = Double(diameter - 1) / 2
        return (0..<diameter).map { row in
            let dy = Double(row) - center
            let dx = sqrt(radius * radius - dy * dy)
            return (left: Int(ceil(center - dx)), right: Int(floor(center + dx)))
        }
    }
}

struct PixelViewport {
    static let zoomLevels = [1, 2, 4, 8, 16]
    let canvasSide: Int
    let zoom: Int
    let column: Int
    let row: Int
    let center: (column: Int, row: Int)

    var span: Int { canvasSide / zoom }
    var bounds: CGRect { CGRect(x: column, y: row, width: span, height: span) }
    init(side: Int, zoom: Int = 8, column: Int? = nil, row: Int? = nil) {
        self.canvasSide = side
        self.zoom = zoom
        let edge = side - 1
        let center = (column: min(edge, max(0, column ?? side / 2)), row: min(edge, max(0, row ?? side * 3 / 8)))
        self.center = center
        let span = side / zoom
        let limit = side - span
        self.column = min(limit, max(0, center.column - span / 2))
        self.row = min(limit, max(0, center.row - span / 2))
    }

    func pixel(at point: CGPoint, displaySide: CGFloat) -> (column: Int, row: Int)? {
        guard point.x >= 0, point.y >= 0, point.x < displaySide, point.y < displaySide else { return nil }
        return (column + Int(point.x * CGFloat(span) / displaySide),
                row + Int(point.y * CGFloat(span) / displaySide))
    }
}

enum PixelEditTool: Equatable {
    case paint, erase, sample, restore
}

final class PixelEditorModel: ObservableObject {
    typealias SourceResolver = (Data, [[UInt32]], Int, @escaping (Data?) -> Void) -> Void
    static let artSide = 80
    static let legacySide = 320
    let side: Int
    var brushSizes: ClosedRange<Double> { 1...Double(32 * side / Self.legacySide) }

    @Published private(set) var cells: [UInt32]
    @Published var brushSize = 1.0
    @Published var brushShape: PixelBrushShape = .square
    @Published var paintColor = PixelEditorPalette.entries[0].hex
    @Published var tool: PixelEditTool = .paint
    @Published private(set) var viewport: PixelViewport
    @Published private(set) var showingOriginal = false
    @Published var name: String = ""
    @Published var message: String = ""
    @Published private(set) var isSaving = false
    private var ink: [Int: UInt32] = [:]
    private var undoStack: [(cells: [UInt32], ink: [Int: UInt32])] = []
    private var strokeOpen = false
    private var samplingStroke = false
    private var lastPoint: (column: Int, row: Int)?
    private let source: Data?
    private let resolveSource: SourceResolver?
    private let original: [UInt32]
    private let furMask: Data?

    var isFurOnly: Bool { furMask != nil }
    var hasChanges: Bool { !ink.isEmpty }
    var canUndo: Bool { !undoStack.isEmpty }
    var displayedCells: [UInt32] { showingOriginal ? original : cells }
    var isErasing: Bool {
        get { tool == .erase }
        set { tool = newValue ? .erase : .paint }
    }

    var pixelChanges: [[UInt32]] {
        ink.sorted { $0.key < $1.key }.map { [UInt32($0.key), $0.value] }
    }

    init?(previewPNG: Data, source: Data? = nil, fur: PhotoFurEditorSurface? = nil,
          resolveSource: SourceResolver? = nil) {
        guard let cells = PixelPresetStore.pixels(from: previewPNG) else { return nil }
        let side = cells.count == Self.artSide * Self.artSide ? Self.artSide : Self.legacySide
        self.side = side
        self.viewport = PixelViewport(side: side)
        self.cells = cells
        if let fur {
            guard fur.mask.count == cells.count,
                  let original = PixelPresetStore.pixels(from: fur.originalPNG, side: side) else { return nil }
            self.original = original
            self.furMask = fur.mask
            self.brushSize = Double(side / Self.artSide)
        } else {
            self.original = cells
            self.furMask = nil
        }
        self.source = source
        self.resolveSource = resolveSource
    }

    func chooseColor(_ hex: UInt32) {
        paintColor = hex
        isErasing = false
    }

    func zoom(by step: Int) {
        guard let index = PixelViewport.zoomLevels.firstIndex(of: viewport.zoom),
              PixelViewport.zoomLevels.indices.contains(index + step) else { return }
        let center = viewport.center
        endStroke()
        viewport = PixelViewport(side: side, zoom: PixelViewport.zoomLevels[index + step], column: center.column, row: center.row)
    }

    func centerViewport(column: Int, row: Int) {
        endStroke()
        viewport = PixelViewport(side: side, zoom: viewport.zoom, column: column, row: row)
    }

    func toggleOriginal() {
        endStroke()
        showingOriginal.toggle()
    }

    func breakStrokePath() {
        lastPoint = nil
    }

    func paint(column: Int, row: Int) {
        guard !isSaving, !showingOriginal, !samplingStroke else { return }
        guard (0..<side).contains(column), (0..<side).contains(row) else {
            breakStrokePath()
            return
        }
        if tool == .sample {
            let pixel = cells[row * side + column]
            let alpha = pixel >> 24
            guard alpha != 0 else { return }
            let channel = { (shift: UInt32) in min(255, (((pixel >> shift) & 0xFF) * 255 + alpha / 2) / alpha) }
            chooseColor(channel(16) << 16 | channel(8) << 8 | channel(0))
            samplingStroke = true
            return
        }
        let start = lastPoint ?? (column, row)
        lastPoint = (column, row)
        let dx = column - start.column
        let dy = row - start.row
        let steps = max(1, abs(dx), abs(dy))
        let value: UInt32 = isErasing ? 0 : 0xFF000000 | paintColor
        let restoring = tool == .restore
        let restoringFur = isFurOnly && (isErasing || restoring)
        let diameter = restoring ? 1 : Int(brushSize)
        let origin = -(diameter - 1) / 2
        let rows = brushShape.rows(diameter: diameter)
        var updated = cells
        var changed = false
        for step in 0...steps {
            let x = start.column + dx * step / steps
            let y = start.row + dy * step / steps
            for (row, span) in rows.enumerated() {
                let targetY = y + origin + row
                guard (0..<side).contains(targetY) else { continue }
                let left = max(0, x + origin + span.left)
                let right = min(side - 1, x + origin + span.right)
                guard left <= right else { continue }
                for targetX in left...right {
                    let index = targetY * side + targetX
                    if let furMask, furMask[index] != 1 || (original[index] >> 24) != 255 { continue }
                    if restoringFur {
                        guard updated[index] != original[index] || (ink[index] ?? 0) != 0 else { continue }
                        if !strokeOpen {
                            recordUndo()
                            strokeOpen = true
                        }
                        ink[index] = 0
                        updated[index] = original[index]
                        changed = true
                        continue
                    }
                    // Paint matching the preview is still deliberate. Erasing empty space does nothing.
                    let changesPixel = restoring ? ink[index] != nil : (value == 0 ? updated[index] != 0 : ink[index] != value)
                    guard changesPixel else { continue }
                    if !strokeOpen {
                        recordUndo()
                        strokeOpen = true
                    }
                    ink[index] = restoring ? nil : value
                    updated[index] = restoring ? original[index] : value
                    changed = true
                }
            }
        }
        guard changed else { return }
        cells = updated
        message = ""
    }

    func endStroke() {
        strokeOpen = false
        samplingStroke = false
        lastPoint = nil
    }

    func undo() {
        guard !isSaving else { return }
        guard let previous = undoStack.popLast() else {
            message = "没有可撤销的操作"
            return
        }
        cells = previous.cells
        ink = previous.ink
        endStroke()
        message = ""
    }

    func clear() {
        guard !isSaving else { return }
        if let furMask {
            let changed = cells.indices.filter { furMask[$0] == 1 && (cells[$0] != original[$0] || (ink[$0] ?? 0) != 0) }
            guard !changed.isEmpty else { return }
            recordUndo()
            var restored = cells
            for index in changed {
                ink[index] = 0
                restored[index] = original[index]
            }
            cells = restored
            endStroke()
            message = ""
            return
        }
        guard cells.contains(where: { $0 != 0 }) else { return }
        recordUndo()
        // A transparent coarse sample can still cover fine pixels in the underlying pose.
        for (index, value) in cells.enumerated() where side == Self.artSide || value != 0 { ink[index] = 0 }
        cells = Array(repeating: 0, count: side * side)
        endStroke()
        message = ""
    }

    private func recordUndo() {
        undoStack.append((cells, ink))
        if undoStack.count > 60 { undoStack.removeFirst() }
    }

    func save(in folder: URL = PixelPresetStore.folder, completion: @escaping (URL?) -> Void) {
        guard !isSaving else { completion(nil); return }
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            message = "先给这个像素形象起个名字"
            completion(nil)
            return
        }
        if source == nil, !cells.contains(where: { $0 != 0 }) {
            message = "至少画一个格子再保存"
            completion(nil)
            return
        }
        resolveSnapshot { snapshot in
            guard let snapshot, let url = PixelPresetStore.save(name: trimmed, snapshot: snapshot, in: folder) else {
                if snapshot != nil { self.message = "保存失败，请重试" }
                completion(nil)
                return
            }
            self.message = "已保存：\(trimmed)"
            completion(url)
        }
    }

    func resolveSnapshot(completion: @escaping (PixelEditSnapshot?) -> Void) {
        guard !isSaving, let png = PixelPresetStore.renderPNG(cells: cells, side: side) else { completion(nil); return }
        let changes = pixelChanges
        endStroke()
        isSaving = true
        message = ""
        let finish: (Data?) -> Void = { resolved in
            self.isSaving = false
            guard self.source == nil || resolved != nil else {
                self.message = "无法保存笔迹，请重试"
                completion(nil)
                return
            }
            completion(PixelEditSnapshot(png: png, source: resolved))
        }
        if let source, let resolveSource { resolveSource(source, changes, side, finish) }
        else { finish(nil) }
    }
}

// MARK: - View

struct PixelDrawingCanvas: View {
    @ObservedObject var model: PixelEditorModel
    let side: CGFloat
    let palette: PixelPalette

    var body: some View {
        let viewport = model.viewport
        Canvas { context, size in
            if let image = PixelPresetStore.image(cells: model.displayedCells, side: model.side)?.cropping(to: viewport.bounds) {
                let sprite = Image(decorative: image, scale: 1).interpolation(.none)
                context.draw(sprite, in: CGRect(origin: .zero, size: size))
            }
            let cell = side / CGFloat(viewport.span)
            guard cell >= 3 else { return }
            var grid = Path()
            for index in 1..<viewport.span {
                let position = CGFloat(index) * cell
                grid.move(to: CGPoint(x: position, y: 0))
                grid.addLine(to: CGPoint(x: position, y: side))
                grid.move(to: CGPoint(x: 0, y: position))
                grid.addLine(to: CGPoint(x: side, y: position))
            }
            context.stroke(grid, with: .color(.black.opacity(0.32)), lineWidth: 0.65)
            context.stroke(grid, with: .color(.white.opacity(0.32)), lineWidth: 0.35)
        }
        .frame(width: side, height: side)
        .background { PixelChecker(even: palette.panelAlt, odd: palette.panelDeep, cell: 10) }
        .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 2).allowsHitTesting(false))
        .contentShape(Rectangle())
        .accessibilityLabel("像素画布")
        .accessibilityValue("\(model.side) × \(model.side)")
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { value in
                    guard let pixel = viewport.pixel(at: value.location, displaySide: side) else {
                        model.breakStrokePath()
                        return
                    }
                    model.paint(column: pixel.column, row: pixel.row)
                }
                .onEnded { _ in model.endStroke() }
        )
        .disabled(model.isSaving || model.showingOriginal)
    }
}

private struct PixelEditorNavigator: View {
    @ObservedObject var model: PixelEditorModel
    let palette: PixelPalette
    private let side: CGFloat = 80

    var body: some View {
        Canvas { context, size in
            if let image = PixelPresetStore.image(cells: model.displayedCells, side: model.side) {
                context.draw(Image(decorative: image, scale: 1).interpolation(.none),
                             in: CGRect(origin: .zero, size: size))
            }
            let scale = side / CGFloat(model.side)
            let box = model.viewport.bounds.applying(CGAffineTransform(scaleX: scale, y: scale))
            context.stroke(Path(box), with: .color(.black), lineWidth: 2.5)
            context.stroke(Path(box), with: .color(palette.accent), lineWidth: 1.25)
        }
        .frame(width: side, height: side)
        .background { PixelChecker(even: palette.panelAlt, odd: palette.panelDeep, cell: 8) }
        .overlay(Rectangle().stroke(palette.border, lineWidth: 1).allowsHitTesting(false))
        .contentShape(Rectangle())
        .gesture(DragGesture(minimumDistance: 0).onChanged { value in
            let scale = CGFloat(model.side) / side
            model.centerViewport(column: Int(value.location.x * scale), row: Int(value.location.y * scale))
        })
        .help("点选小地图，移动左侧放大区域")
        .accessibilityLabel("像素画布小地图")
        .accessibilityHint("点击或拖动以移动放大区域")
    }
}

struct PixelEditorTools: View {
    @ObservedObject var model: PixelEditorModel
    let palette: PixelPalette

    private var brushColor: Color { Color(nsColor: PixelEditorPalette.color(model.paintColor)) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            viewportControls
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 5) {
                    toolButton("\(Int(model.brushSize)) 像素画笔", .paint)
                    toolButton("取色", .sample)
                    if !model.isFurOnly { toolButton("恢复原像素", .restore) }
                    toolButton(model.isFurOnly ? "恢复原毛色" : "橡皮擦", .erase)
                }
                colorControls
                DisclosureGroup("画笔设置") {
                    VStack(alignment: .leading, spacing: 8) {
                        brushControls
                        Button(model.isFurOnly ? "恢复可见毛色" : "清空画布") { model.clear() }
                            .buttonStyle(PixelButtonStyle(palette: palette))
                            .help(model.isFurOnly ? "恢复此姿势下可见的原毛色，可撤销" : "擦除当前画面，可撤销")
                    }.padding(.top, 7)
                }
                .font(PixelFont.font(11))
                .foregroundStyle(palette.ink)
                .tint(palette.ink)
            }
            .disabled(model.showingOriginal)
            if !model.message.isEmpty {
                Text(model.message)
                    .font(PixelFont.font(10))
                    .foregroundStyle(palette.inkSoft)
            }
        }
        .disabled(model.isSaving)
    }

    private var viewportControls: some View {
        HStack(alignment: .center, spacing: 10) {
            PixelEditorNavigator(model: model, palette: palette)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Button("−") { model.zoom(by: -1) }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .accessibilityLabel("缩小画布")
                        .disabled(model.viewport.zoom == PixelViewport.zoomLevels.first)
                    Text("\(model.viewport.zoom)×")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.ink)
                        .monospacedDigit()
                        .frame(minWidth: 28)
                    Button("+") { model.zoom(by: 1) }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .accessibilityLabel("放大画布")
                        .disabled(model.viewport.zoom == PixelViewport.zoomLevels.last)
                    Text("\(model.side)×\(model.side)")
                        .font(PixelFont.font(10))
                        .foregroundStyle(palette.inkSoft)
                        .monospacedDigit()
                }
                HStack(spacing: 6) {
                    Button(model.showingOriginal ? "返回微调稿" : "查看原稿") { model.toggleOriginal() }
                        .buttonStyle(PixelButtonStyle(palette: palette, prominent: model.showingOriginal))
                    Button("撤销") { model.undo() }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .keyboardShortcut("z", modifiers: .command)
                        .disabled(!model.canUndo || model.showingOriginal)
                }
            }
        }
    }

    private func toolButton(_ title: String, _ tool: PixelEditTool) -> some View {
        Button(title) { model.tool = tool }
            .buttonStyle(PixelButtonStyle(palette: palette, prominent: model.tool == tool))
            .accessibilityAddTraits(model.tool == tool ? .isSelected : [])
    }

    private var brushControls: some View {
        let sizeLabel = model.isErasing ? "橡皮粗细" : "画笔粗细"
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text(sizeLabel)
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.ink)
                PixelSlider(value: $model.brushSize, range: model.brushSizes, step: 1, palette: palette)
                    .accessibilityLabel(sizeLabel)
                Text("\(Int(model.brushSize)) px")
                    .font(PixelFont.font(11))
                    .monospacedDigit()
                    .foregroundStyle(palette.ink)
                    .frame(width: 40, alignment: .trailing)
                    .accessibilityHidden(true)
                brushPreview
            }
            HStack(spacing: 8) {
                Text(model.isErasing ? "橡皮形状" : "画笔形状")
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.ink)
                ForEach(PixelBrushShape.allCases, id: \.self) { shape in
                    let selected = model.brushShape == shape
                    Button(shape.rawValue) { model.brushShape = shape }
                        .buttonStyle(PixelTabStyle(palette: palette, selected: selected))
                        .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
        }
    }

    private var brushPreview: some View {
        let size = model.brushSizes.upperBound
        return Canvas { context, _ in
            let origin = Int((size - model.brushSize) / 2)
            let rows = model.brushShape.rows(diameter: Int(model.brushSize))
            var stamp = Path()
            for (row, span) in rows.enumerated() {
                stamp.addRect(CGRect(x: origin + span.left, y: origin + row, width: span.right - span.left + 1, height: 1))
            }
            context.fill(stamp, with: .color(model.isErasing ? palette.inkSoft : brushColor))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private var colorControls: some View {
        VStack(alignment: .leading, spacing: 8) {
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(22), spacing: 5), count: 11), alignment: .leading, spacing: 5) {
                ForEach(PixelEditorPalette.entries) { entry in
                    swatch(entry)
                }
            }
            ColorPicker(selection: customColor, supportsOpacity: false) {
                Text("自选颜色")
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.ink)
            }
        }
    }

    private var customColor: Binding<Color> {
        Binding(get: { brushColor }, set: { chosen in
            guard let color = NSColor(chosen).usingColorSpace(.sRGB) else { return }
            let channel = { (value: CGFloat) in UInt32((min(max(value, 0), 1) * 255).rounded()) }
            let hex = channel(color.redComponent) << 16 | channel(color.greenComponent) << 8 | channel(color.blueComponent)
            model.chooseColor(hex)
        })
    }

    private func swatch(_ entry: PixelPaletteEntry) -> some View {
        let selected = model.tool == .paint && model.paintColor == entry.hex
        return Button {
            model.chooseColor(entry.hex)
        } label: {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(nsColor: PixelEditorPalette.color(entry.hex)))
                .frame(width: 22, height: 22)
                .overlay(
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(selected ? palette.accent : palette.border, lineWidth: selected ? 3 : 2)
                )
        }
        .buttonStyle(.plain)
        .help("\(entry.name) \(entry.hexString)")
        .accessibilityLabel(entry.name)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
