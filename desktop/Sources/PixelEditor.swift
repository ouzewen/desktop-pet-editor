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

enum PixelPresetStore {
    static let folderName = "custom"

    /// The repo's public folder when running from a checkout; otherwise the
    /// app-support folder, so the editor still works in a packaged build.
    static var exportFolder: URL {
        if let repo = repoRoot {
            let folder = repo.appendingPathComponent("public/assets/cat/\(folderName)", isDirectory: true)
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            return folder
        }
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent("DesktopPet/\(folderName)", isDirectory: true)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        return base
    }

    static var repoRoot: URL? {
        var url = Bundle.main.bundleURL
        for _ in 0..<8 {
            let candidate = url.appendingPathComponent("public/assets/cat", isDirectory: true)
            if FileManager.default.fileExists(atPath: candidate.path) { return url }
            url.deleteLastPathComponent()
        }
        return nil
    }

    static var manifestURL: URL { exportFolder.appendingPathComponent("presets.json") }

    static func load() -> [CustomPresetInfo] {
        guard let data = try? Data(contentsOf: manifestURL),
              let list = try? JSONSerialization.jsonObject(with: data) as? [[String: String]] else { return [] }
        return list.compactMap { item in
            guard let name = item["name"], let file = item["file"] else { return nil }
            let url = exportFolder.appendingPathComponent(file)
            guard FileManager.default.fileExists(atPath: url.path) else { return nil }
            return CustomPresetInfo(id: item["id"] ?? file, name: name, url: url)
        }
    }

    @discardableResult
    static func save(name: String, cells: [UInt32]) -> URL? {
        let slug = slugify(name)
        guard !slug.isEmpty else { return nil }
        let file = "\(slug).png"
        let url = exportFolder.appendingPathComponent(file)
        guard let png = renderPNG(cells: cells) else { return nil }
        do {
            try png.write(to: url)
        } catch {
            return nil
        }
        var list = (try? JSONSerialization.jsonObject(with: Data(contentsOf: manifestURL)) as? [[String: String]]) ?? []
        list.removeAll { $0["id"] == slug }
        list.append(["id": slug, "name": name, "file": file])
        if let data = try? JSONSerialization.data(withJSONObject: list, options: [.prettyPrinted, .sortedKeys]) {
            try? data.write(to: manifestURL)
        }
        // Keep a copy the running pet can read even outside the repo checkout.
        let runtime = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent("DesktopPet/\(folderName)", isDirectory: true)
        try? FileManager.default.createDirectory(at: runtime, withIntermediateDirectories: true)
        try? png.write(to: runtime.appendingPathComponent(file))
        return url
    }

    // Premultiplied sRGB pixels, in 0xAARRGGBB order as UInt32 values.
    private static let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    private static let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedFirst.rawValue)
        .union(.byteOrder32Little)

    static func pixels(from png: Data) -> [UInt32]? {
        guard let source = NSBitmapImageRep(data: png)?.cgImage else { return nil }
        let side = PixelEditorModel.side
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

    static func image(cells: [UInt32]) -> CGImage? {
        let side = PixelEditorModel.side
        guard cells.count == side * side,
              let provider = CGDataProvider(data: cells.withUnsafeBytes { Data($0) } as CFData) else { return nil }
        return CGImage(
            width: side, height: side, bitsPerComponent: 8, bitsPerPixel: 32,
            bytesPerRow: side * MemoryLayout<UInt32>.size, space: colorSpace,
            bitmapInfo: bitmapInfo, provider: provider, decode: nil,
            shouldInterpolate: false, intent: .defaultIntent
        )
    }

    static func renderPNG(cells: [UInt32]) -> Data? {
        guard let image = image(cells: cells) else { return nil }
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

final class PixelEditorModel: ObservableObject {
    static let side = 320
    static let brushSizes = 1.0...32.0

    @Published private(set) var cells: [UInt32]
    @Published var brushSize = 8.0
    @Published var brushShape: PixelBrushShape = .square
    @Published var paintColor = PixelEditorPalette.entries[0].hex
    @Published var isErasing = false
    @Published var name: String = ""
    @Published var message: String = ""
    private var undoStack: [[UInt32]] = []
    private var strokeOpen = false
    private var lastPoint: (column: Int, row: Int)?

    init?(previewPNG: Data) {
        guard let cells = PixelPresetStore.pixels(from: previewPNG) else { return nil }
        self.cells = cells
    }

    func chooseColor(_ hex: UInt32) {
        paintColor = hex
        isErasing = false
    }

    func paint(column: Int, row: Int) {
        guard (0..<Self.side).contains(column), (0..<Self.side).contains(row) else {
            lastPoint = nil
            return
        }
        let start = lastPoint ?? (column, row)
        lastPoint = (column, row)
        let dx = column - start.column
        let dy = row - start.row
        let steps = max(1, abs(dx), abs(dy))
        let value: UInt32 = isErasing ? 0 : 0xFF000000 | paintColor
        let diameter = Int(brushSize)
        let origin = -(diameter - 1) / 2
        let rows = brushShape.rows(diameter: diameter)
        var updated = cells
        for step in 0...steps {
            let x = start.column + dx * step / steps
            let y = start.row + dy * step / steps
            for (row, span) in rows.enumerated() {
                let targetY = y + origin + row
                guard (0..<Self.side).contains(targetY) else { continue }
                let left = max(0, x + origin + span.left)
                let right = min(Self.side - 1, x + origin + span.right)
                for targetX in left...right {
                    updated[targetY * Self.side + targetX] = value
                }
            }
        }
        guard updated != cells else { return }
        if !strokeOpen {
            recordUndo()
            strokeOpen = true
        }
        cells = updated
        message = ""
    }

    func endStroke() {
        strokeOpen = false
        lastPoint = nil
    }

    func undo() {
        guard let previous = undoStack.popLast() else {
            message = "没有可撤销的操作"
            return
        }
        cells = previous
        endStroke()
        message = ""
    }

    func clear() {
        guard cells.contains(where: { $0 != 0 }) else { return }
        recordUndo()
        cells = Array(repeating: 0, count: Self.side * Self.side)
        endStroke()
        message = ""
    }

    private func recordUndo() {
        undoStack.append(cells)
        if undoStack.count > 60 { undoStack.removeFirst() }
    }

    @discardableResult
    func save() -> URL? {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            message = "先给这个像素形象起个名字"
            return nil
        }
        guard cells.contains(where: { $0 != 0 }) else {
            message = "至少画一个格子再保存"
            return nil
        }
        guard let url = PixelPresetStore.save(name: trimmed, cells: cells) else {
            message = "保存失败"
            return nil
        }
        message = "已保存：\(trimmed)"
        return url
    }
}

// MARK: - View

struct PixelEditorView: View {
    @ObservedObject var model: PixelEditorModel
    var onSaved: (URL) -> Void = { _ in }

    @Environment(\.colorScheme) private var colorScheme

    private var palette: PixelPalette { .of(colorScheme) }
    private var brushColor: Color { Color(nsColor: PixelEditorPalette.color(model.paintColor)) }
    private let gridSide: CGFloat = 320

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Text("像素编辑")
                    .font(PixelFont.font(13))
                    .foregroundStyle(palette.ink)
                Spacer()
                Button("撤销") { model.undo() }
                    .buttonStyle(PixelButtonStyle(palette: palette))
                Button("清空") { model.clear() }
                    .buttonStyle(PixelButtonStyle(palette: palette))
                Button("保存") {
                    if let url = model.save() { onSaved(url) }
                }
                .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
            }

            grid

            brushControls

            colorControls

            HStack(spacing: 6) {
                TextField("给这个形象起个名字", text: $model.name)
                    .textFieldStyle(.plain)
                    .font(PixelFont.font(12))
                    .padding(.horizontal, 7)
                    .padding(.vertical, 5)
                    .background(PixelBox(corner: 2).fill(palette.panelAlt))
                    .overlay(PixelBox(corner: 2).stroke(palette.border, lineWidth: 2))
                Text(model.message)
                    .font(PixelFont.font(10))
                    .foregroundStyle(model.message.hasPrefix("已保存") ? palette.green : palette.inkSoft)
                    .lineLimit(1)
            }
        }
        .padding(12)
        .frame(width: gridSide + 24)
        .background(palette.panel)
    }

    private var grid: some View {
        Canvas { context, size in
            if let image = PixelPresetStore.image(cells: model.cells) {
                let sprite = Image(decorative: image, scale: 1).interpolation(.none)
                context.draw(sprite, in: CGRect(origin: .zero, size: size))
            }
        }
        .frame(width: gridSide, height: gridSide)
        .background { PixelChecker(even: palette.panelAlt, odd: palette.panelDeep, cell: 10) }
        .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 2).allowsHitTesting(false))
        .contentShape(Rectangle())
        .accessibilityLabel("像素画布")
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { value in
                    let cell = gridSide / CGFloat(PixelEditorModel.side)
                    let column = Int(floor(value.location.x / cell))
                    let row = Int(floor(value.location.y / cell))
                    model.paint(column: column, row: row)
                }
                .onEnded { _ in model.endStroke() }
        )
    }

    private var brushControls: some View {
        let sizeLabel = model.isErasing ? "橡皮粗细" : "画笔粗细"
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text(sizeLabel)
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.ink)
                PixelSlider(value: $model.brushSize, range: PixelEditorModel.brushSizes, step: 1, palette: palette)
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
        let size = PixelEditorModel.brushSizes.upperBound
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
            HStack {
                Button("橡皮擦") { model.isErasing = true }
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: model.isErasing))
                    .accessibilityAddTraits(model.isErasing ? .isSelected : [])
                Spacer()
                ColorPicker("自选颜色", selection: customColor, supportsOpacity: false)
                    .font(PixelFont.font(11))
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
        let selected = !model.isErasing && model.paintColor == entry.hex
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
