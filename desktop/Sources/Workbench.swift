import AppKit
import SwiftUI
import WebKit

struct AppearanceOption: Decodable {
    let id: String
    let name: String
    let colors: [String]?
}

struct AppearancePreset: Decodable {
    let id: String
    let name: String
    let frame: String
    let palette: String?
    let colors: [String]?
    let naturalSwatches: [String: String]?
}

struct FurPatch: Codable, Identifiable, Equatable {
    var id: String
    var preset: String
    var shape: String
    var x: Int
    var y: Int
    var width: Int
    var height: Int
    var color: String
    var flipped: Bool
    var joinChin: Bool?

    init(preset: FurPatchPreset) {
        id = UUID().uuidString
        self.preset = preset.id
        shape = preset.shapes[0].id
        x = preset.x
        y = preset.y
        width = preset.width
        height = preset.height
        color = preset.color
        flipped = false
    }

    var config: [String: Any] {
        var fields: [String: Any] = ["id": id, "preset": preset, "shape": shape, "x": x, "y": y,
                                     "width": width, "height": height, "color": color, "flipped": flipped]
        if let joinChin { fields["joinChin"] = joinChin }
        return fields
    }
}

struct FurPatchPreset: Decodable, Identifiable {
    let id: String
    let name: String
    let part: String
    let x: Int
    let y: Int
    let width: Int
    let height: Int
    let color: String
    let shapes: [Shape]
    let mirror: String?

    struct Shape: Decodable, Identifiable {
        let id: String
        let name: String
    }
}

struct FurPatchBounds: Decodable {
    let x: Int
    let y: Int
    let width: Int
    let height: Int
}

struct FurPatchDimensions: Decodable {
    let min: Int
    let max: Int

    var range: ClosedRange<Int> { min...max }
}

struct AppearanceCatalog: Decodable {
    let fieldsByFrame: [String: [String: [AppearanceOption]]]
    let presets: [AppearancePreset]
    let faceBasePalettes: Set<String>
    let coatCards: [String: [AppearanceOption]]
    let furPatchPresets: [FurPatchPreset]
    let furPatchBounds: [String: FurPatchBounds]
    let furPatchDimensions: FurPatchDimensions
    let furPatchLimit: Int

    func matchingPreset(_ config: [String: Any]) -> String? {
        let candidates = presets.filter { $0.frame == config["frame"] as? String }
        if let breed = config["breed"] as? String,
           let saved = candidates.first(where: { $0.id == breed }) {
            return saved.id
        }
        if let palette = config["palette"] as? String,
           let match = candidates.first(where: { $0.palette == palette }) {
            return match.id
        }
        if let name = config["name"] as? String {
            return candidates.first { $0.name == name }?.id
        }
        return nil
    }
}

struct AppearanceThumbnails {
    let breeds: [String: NSImage]
    let parts: [String: [String: NSImage]]

    init(data: Data) throws {
        struct PNGs: Decodable {
            let breeds: [String: Data]
            let parts: [String: [String: Data]]
        }
        let pngs = try JSONDecoder().decode(PNGs.self, from: data)
        breeds = pngs.breeds.compactMapValues(NSImage.init(data:))
        parts = pngs.parts.mapValues { $0.compactMapValues(NSImage.init(data:)) }
    }
}

enum TypingSyncStatus {
    case off, needsPermission, unavailable, active

    var text: String {
        switch self {
        case .off: return "打字监听已关闭"
        case .needsPermission: return "打字功能等待输入监控权限"
        case .unavailable: return "输入监控暂未连接"
        case .active: return "输入监控已连接"
        }
    }
}

enum CustomAppearanceMode: String, CaseIterable {
    case patches, brush

    var title: String { self == .patches ? "按部位调花色" : "像素画笔" }
}

final class WorkbenchState: ObservableObject {
    @Published var catalog: AppearanceCatalog?
    @Published var thumbnails: AppearanceThumbnails?
    @Published var coatOverlayRevision = 0
    @Published var appearance: [String: String] = [:]
    @Published private(set) var furPatches: [FurPatch] = []
    @Published private(set) var selectedFurPatchID: String?

    var selectedFurPatch: FurPatch? {
        furPatches.first { $0.id == selectedFurPatchID }
    }
    @Published var preset = "preset_cat_orange"
    @Published var choosingBreed = false
    @Published var action = "sit"
    @Published var petSize: Double = 240
    @Published var visible = true
    @Published var temporarilyHidden = false
    var petIsVisible: Bool { visible && !temporarilyHidden }
    @Published var eyeFollow = true
    @Published var message = ""
    @Published var applying = false
    @Published var typingAnimationEnabled = false
    @Published var typingStatsEnabled = false
    @Published var showTypingStats = true
    @Published var typingStatus = TypingSyncStatus.off
    @Published var selectionTranslationEnabled = false
    @Published var translationNeedsPermission = false
    var needsKeyboardMonitoring: Bool { typingAnimationEnabled || typingStatsEnabled }
    @Published var customPresets: [CustomPresetInfo] = []
    @Published var customSelected: String?
    /// Purely descriptive; it never reaches the renderer or the pet config.
    @Published var gender: String {
        didSet { UserDefaults.standard.set(gender, forKey: "petGender") }
    }
    /// Descriptive only, like gender; never affects the renderer.
    @Published var mbti: String {
        didSet { UserDefaults.standard.set(mbti, forKey: "petMBTI") }
    }
    /// Descriptive only, like the name and gender; never reaches the renderer.
    @Published var birthDate: Date? {
        didSet {
            if let birthDate {
                UserDefaults.standard.set(birthDate.timeIntervalSince1970, forKey: "petBirthDate")
            } else {
                UserDefaults.standard.removeObject(forKey: "petBirthDate")
            }
        }
    }
    @Published var loadingCustom = false
    @Published var customMode: CustomAppearanceMode?
    @Published var pixelEditor: PixelEditorModel?
    @Published var editingCustom = false
    @Published var hasPendingBrush = false
    @Published var catPhotos: [CatPhotoInput?] = [nil, nil, nil]
    @Published var photoStatus = ""
    @Published var generatingPhoto = false
    @Published var showingManualTools = false
    var choosePreset: (String) -> Void = { _ in }
    var renderCoatThumbnails: () async -> [String: NSImage] = { [:] }
    var refresh: () -> Void = {}
    var apply: () -> Void = {}
    var reset: () -> Void = {}
    var setTypingAnimation: (Bool) -> Void = { _ in }
    var setTypingStats: (Bool) -> Void = { _ in }
    var setShowTypingStats: (Bool) -> Void = { _ in }
    var setSelectionTranslation: (Bool) -> Void = { _ in }
    var openInputSettings: () -> Void = {}
    var openAccessibilitySettings: () -> Void = {}
    var setSize: (Double) -> Void = { _ in }
    var setVisibility: (Bool) -> Void = { _ in }
    var setEyeFollow: (Bool) -> Void = { _ in }
    var exportAppearance: () -> Void = {}
    var changeCustomMode: (CustomAppearanceMode?) -> Void = { _ in }
    var chooseCatPhoto: (Int) -> Void = { _ in }
    var generateFromCatPhoto: () -> Void = {}
    var saveCustomAppearance: (String, @escaping (Bool) -> Void) -> Void = { _, done in done(false) }
    var chooseCustom: (CustomPresetInfo) -> Void = { _ in }
    var clearCustom: () -> Void = {}
    var deleteCustom: (CustomPresetInfo) -> Void = { _ in }

    /// Draft of the name field; only 确认修改 writes it into the appearance.
    @Published var nameText: String = ""
    var nameDirty = false

    static let genders = ["none", "♂", "♀"]
    static let mbtiTypes = [
        "INTJ", "INTP", "ENTJ", "ENTP",
        "INFJ", "INFP", "ENFJ", "ENFP",
        "ISTJ", "ISFJ", "ESTJ", "ESFJ",
        "ISTP", "ISFP", "ESTP", "ESFP",
    ]

    init() {
        let saved = UserDefaults.standard.string(forKey: "petGender") ?? "none"
        gender = Self.genders.contains(saved) ? saved : "none"
        let savedMBTI = UserDefaults.standard.string(forKey: "petMBTI") ?? "none"
        mbti = Self.mbtiTypes.contains(savedMBTI) ? savedMBTI : "none"
        let stamp = UserDefaults.standard.double(forKey: "petBirthDate")
        birthDate = stamp > 0 ? Date(timeIntervalSince1970: stamp) : nil
    }

    func update(_ config: [String: Any]) {
        appearance = config.compactMapValues { $0 as? String }
        selectedFurPatchID = nil
        if let raw = config["furPatches"], let data = try? JSONSerialization.data(withJSONObject: raw),
           let patches = try? JSONDecoder().decode([FurPatch].self, from: data) {
            furPatches = patches
        } else {
            furPatches = []
        }
        if !nameDirty { nameText = appearance["name", default: ""] }
        resetUnavailablePreview()
        refresh()
    }

    func furPatchPreset(_ id: String) -> FurPatchPreset? {
        catalog?.furPatchPresets.first { $0.id == id }
    }

    func selectFurPatch(_ id: String?) {
        selectedFurPatchID = id
        if id != nil { action = "sit" }
        refresh()
    }

    func addFurPatch(_ preset: FurPatchPreset) {
        guard let catalog, furPatches.count < catalog.furPatchLimit else { return }
        let patch = FurPatch(preset: preset)
        furPatches.append(patch)
        selectFurPatch(patch.id)
    }

    func adjustFurPatch(_ patch: FurPatch) {
        guard let index = furPatches.firstIndex(where: { $0.id == patch.id }),
              let catalog, let preset = furPatchPreset(patch.preset),
              let bounds = catalog.furPatchBounds[preset.part] else { return }
        var next = patch
        next.x = min(bounds.x + bounds.width, max(bounds.x, next.x))
        next.y = min(bounds.y + bounds.height, max(bounds.y, next.y))
        let dimensions = catalog.furPatchDimensions
        next.width = min(dimensions.max, max(dimensions.min, next.width))
        next.height = min(dimensions.max, max(dimensions.min, next.height))
        let previous = furPatches[index]
        guard next.x != previous.x || next.y != previous.y || next.width != previous.width
                || next.height != previous.height || next.color != previous.color
                || next.shape != previous.shape || next.flipped != previous.flipped else { return }
        furPatches[index] = next
        refresh()
    }

    func removeFurPatch(_ id: String) {
        furPatches.removeAll { $0.id == id }
        if selectedFurPatchID == id { selectedFurPatchID = furPatches.last?.id }
        refresh()
    }

    func mirrorFurPatch(_ patch: FurPatch) {
        guard let catalog, furPatches.count < catalog.furPatchLimit,
              let original = furPatchPreset(patch.preset) else { return }
        let oppositeID = original.mirror ?? original.id
        guard let opposite = furPatchPreset(oppositeID), let bounds = catalog.furPatchBounds[opposite.part] else { return }
        var copy = patch
        copy.id = UUID().uuidString
        copy.preset = opposite.id
        let x = opposite.id == original.id ? 302 - patch.x : opposite.x - (patch.x - original.x)
        copy.x = min(bounds.x + bounds.width, max(bounds.x, x))
        copy.flipped.toggle()
        furPatches.append(copy)
        selectFurPatch(copy.id)
    }

    func commitName() {
        let trimmed = String(nameText.prefix(8))
        nameText = trimmed
        appearance["name"] = trimmed
        nameDirty = false
        refresh()
    }

    func resetUnavailablePreview() {
        if appearance["frame"] != "CAT" {
            if action == "typing-gentle" || action == "typing-fast" { action = "typing" }
            if action == "listening" { action = "sit" }
        }
    }
}

// MARK: - Swatches

private enum WBTheme {
    static func swatchColors(_ hexColors: [String]?) -> [Color] {
        (hexColors ?? []).compactMap { hex in
            guard hex.count == 7, hex.first == "#" else { return nil }
            return UInt32(hex.dropFirst(), radix: 16).map { Color(pixelHex: $0) }
        }
    }

    static func paletteColors(_ id: String, catalogColors: [String]?) -> [Color] {
        let colors = swatchColors(catalogColors)
        if !colors.isEmpty { return colors }
        switch id {
        case "C01": return [Color(pixelHex: 0xEFB373), Color(pixelHex: 0xFFFFFF)]
        case "C02": return [Color(pixelHex: 0x2E2E31), Color(pixelHex: 0xFFFFFF)]
        case "C03": return [Color(pixelHex: 0x2E2E31), Color(pixelHex: 0x996138), Color(pixelHex: 0xFFFFFF)]
        case "C04": return [Color(pixelHex: 0x996138), Color(pixelHex: 0xFFF6E8)]
        case "C05": return [Color(pixelHex: 0xF2D8A0), Color(pixelHex: 0xFFFFFF)]
        case "C06": return [Color(pixelHex: 0x8E949A), Color(pixelHex: 0xFFFFFF)]
        case "C07": return [Color(pixelHex: 0xC85A28), Color(pixelHex: 0xFFF3E6)]
        case "C08": return [Color(pixelHex: 0x232326), Color(pixelHex: 0x3D3D41)]
        default: return [Color(pixelHex: 0x9E9E9E)]
        }
    }
}

private struct PixelSwatch: View {
    let colors: [Color]
    let palette: PixelPalette
    var size: CGFloat = 14

    var body: some View {
        ZStack {
            ForEach(colors.indices, id: \.self) { index in
                Rectangle()
                    .fill(colors[index])
                    .frame(height: size / CGFloat(colors.count))
                    .offset(y: (CGFloat(index) - CGFloat(colors.count - 1) / 2) * (size / CGFloat(colors.count)))
            }
        }
        .frame(width: size, height: size)
        .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 1))
    }
}

private struct ColorOptionLabel: View {
    let option: AppearanceOption
    let defaultSwatch: [Color]
    let palette: PixelPalette
    var size: CGFloat = 14

    var body: some View {
        let colors = WBTheme.swatchColors(option.colors)
        let swatch = colors.isEmpty ? defaultSwatch : colors
        HStack(spacing: 4) {
            Text(option.name)
            Spacer(minLength: 4)
            if !swatch.isEmpty {
                PixelSwatch(colors: swatch, palette: palette, size: size)
                    .accessibilityHidden(true)
            }
        }
    }
}

private struct PixelColorSelect: View {
    let title: String
    let options: [AppearanceOption]
    let defaultSwatch: [Color]
    let palette: PixelPalette
    @Binding var selection: String
    var mixedName: String? = nil
    @State private var isPresented = false

    private var currentName: String {
        options.first { $0.id == selection }?.name ?? mixedName ?? options.first?.name ?? ""
    }

    var body: some View {
        Button {
            isPresented.toggle()
        } label: {
            HStack(spacing: 4) {
                Text(currentName)
                Spacer(minLength: 4)
                PixelGlyph(kind: .chevron, color: palette.inkSoft, size: 10)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
        }
        .buttonStyle(PixelButtonStyle(palette: palette))
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityLabel(title)
        .accessibilityValue(currentName)
        .popover(isPresented: $isPresented, arrowEdge: .top) {
            ViewThatFits(in: .vertical) {
                optionList.fixedSize(horizontal: false, vertical: true)
                ScrollView { optionList }
            }
            .frame(width: 186)
            .frame(maxHeight: 360)
            .background(palette.panel)
        }
    }

    private var optionList: some View {
        VStack(spacing: 5) {
            ForEach(options, id: \.id) { option in
                Button {
                    selection = option.id
                    isPresented = false
                } label: {
                    ColorOptionLabel(option: option, defaultSwatch: defaultSwatch, palette: palette)
                }
                .buttonStyle(PixelButtonStyle(palette: palette, prominent: selection == option.id))
                .accessibilityAddTraits(selection == option.id ? .isSelected : [])
            }
        }
        .padding(10)
    }
}

private struct EyeChoiceStyle: ButtonStyle {
    let palette: PixelPalette
    let selected: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(PixelFont.font(12))
            .foregroundStyle(palette.ink)
            .lineLimit(1)
            .padding(.horizontal, 6)
            .frame(minHeight: 25)
            .background(PixelBox(corner: 2).fill(
                palette.accent.opacity(selected ? 0.24 : configuration.isPressed ? 0.12 : 0)
            ))
            .overlay(PixelBox(corner: 2).stroke(selected ? palette.accentDeep : .clear, lineWidth: 1))
            .contentShape(Rectangle())
    }
}

private struct PupilColorEditor: View {
    let side: String
    let colors: [AppearanceOption]
    let naturalSwatches: [String: String]
    let palette: PixelPalette
    @Binding var layers: String
    @Binding var outer: String
    @Binding var inner: String

    private var isDouble: Bool { layers == "round" }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            colorField(isDouble ? "外层瞳色" : "瞳色", selection: $outer,
                       naturalKey: isDouble ? "eyeColor" : "singleEyeColor", id: "outer")
            DisclosureGroup("瞳孔样式") {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 4) {
                        modeButton("单瞳", value: "none")
                        modeButton("双瞳", value: "round")
                    }
                    if isDouble {
                        colorField("内层瞳色", selection: $inner, naturalKey: "innerEyeColor", id: "inner")
                    }
                }
                .padding(.top, 6)
            }
            .font(PixelFont.font(12))
            .foregroundStyle(palette.ink)
        }
    }

    private func modeButton(_ title: String, value: String) -> some View {
        Button(title) { layers = value }
            .buttonStyle(EyeChoiceStyle(palette: palette, selected: layers == value))
            .accessibilityAddTraits(layers == value ? .isSelected : [])
            .accessibilityIdentifier("\(side)-eye-mode-\(value)")
    }

    private func colorField(_ title: String, selection: Binding<String>, naturalKey: String, id: String) -> some View {
        let swatch = WBTheme.swatchColors(naturalSwatches[naturalKey].map { [$0] })
        return HStack(spacing: 10) {
            Text(title)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            PixelColorSelect(title: title, options: colors, defaultSwatch: swatch, palette: palette,
                             selection: selection, mixedName: "左右不同")
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("\(side)-eye-color-\(id)")
        }
    }
}

private enum AppearancePage: String, CaseIterable {
    case breeds = "品种"
    case face = "脸部"
    case coat = "毛色与花纹"
    case tail = "尾巴"
    case accessories = "配饰"
}

private struct CoatThumbnailKey: Equatable {
    let appearance: [String: String]
    let patches: [FurPatch]
    let overlayRevision: Int
}

private enum FacePart: String, CaseIterable {
    case ears = "耳朵"
    case eyes = "眼睛"
    case nose = "鼻子"
    case mouth = "嘴巴"
}

private enum EyeEditScope: String, CaseIterable {
    case both, left, right

    var title: String {
        switch self {
        case .both: "双眼一起"
        case .left: "左眼"
        case .right: "右眼"
        }
    }
}

private struct PixelStatusBadge: View {
    let text: String
    let color: Color
    let palette: PixelPalette

    var body: some View {
        HStack(spacing: 5) {
            Rectangle().fill(color).frame(width: 6, height: 6)
            Text(text)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.ink)
                .lineLimit(1)
                .accessibilityIdentifier("workbench-status")
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(PixelBox(corner: 1).fill(color.opacity(0.16)))
        .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 1))
    }
}

private struct PixelDivider: View {
    let palette: PixelPalette
    var body: some View {
        Rectangle()
            .fill(palette.borderSoft.opacity(0.7))
            .frame(height: 2)
    }
}

private struct SpritePreview: NSViewRepresentable {
    let web: WKWebView
    func makeNSView(context: Context) -> WKWebView { web }
    func updateNSView(_ nsView: WKWebView, context: Context) {}
}

// MARK: - Workbench

private struct FurPatchSelection: View {
    let patch: FurPatch
    let size: CGFloat
    let tint: Color
    let change: (FurPatch) -> Void
    @State private var start: FurPatch?

    private enum Handle: Hashable {
        case move, width, height, corner
    }

    var body: some View {
        let scale = size / 320
        let x = CGFloat(patch.x) * scale
        let y = CGFloat(patch.y) * scale
        let width = CGFloat(patch.width) * scale
        let height = CGFloat(patch.height) * scale
        ZStack(alignment: .topLeading) {
            Color.clear
                .allowsHitTesting(false)
            Rectangle()
                .fill(Color.white.opacity(0.001))
                .overlay(Rectangle().strokeBorder(tint, style: StrokeStyle(lineWidth: 1.5, dash: [4, 3])))
                .frame(width: width, height: height)
                .position(x: x, y: y)
                .gesture(drag(.move))
                .accessibilityLabel("拖动斑块")
            handle(.width, at: CGPoint(x: x + width / 2, y: y), label: "调整宽度")
            handle(.height, at: CGPoint(x: x, y: y + height / 2), label: "调整高度")
            handle(.corner, at: CGPoint(x: x + width / 2, y: y + height / 2), label: "调整大小")
        }
        .frame(width: size, height: size)
    }

    private func handle(_ kind: Handle, at point: CGPoint, label: String) -> some View {
        Rectangle()
            .fill(tint)
            .overlay(Rectangle().strokeBorder(.white.opacity(0.85), lineWidth: 1))
            .frame(width: 7, height: 7)
            .frame(width: 14, height: 14)
            .contentShape(Rectangle())
            .position(x: min(size - 7, max(7, point.x)), y: min(size - 7, max(7, point.y)))
            .gesture(drag(kind))
            .accessibilityLabel(label)
    }

    private func drag(_ kind: Handle) -> some Gesture {
        DragGesture(minimumDistance: 1, coordinateSpace: .global)
            .onChanged { drag in
                let origin = start ?? patch
                if start == nil { start = origin }
                var next = origin
                let dx = drag.translation.width * 320 / size
                let dy = drag.translation.height * 320 / size
                if kind == .move {
                    next.x += Int(dx.rounded())
                    next.y += Int(dy.rounded())
                } else {
                    if kind != .height { next.width += Int((2 * dx).rounded()) }
                    if kind != .width { next.height += Int((2 * dy).rounded()) }
                }
                change(next)
            }
            .onEnded { _ in start = nil }
    }
}

struct WorkbenchView: View {
    @ObservedObject var state: WorkbenchState
    let preview: WKWebView
    let typingActivity: TypingActivity
    @Environment(\.colorScheme) private var colorScheme
    @State private var appearancePage = AppearancePage.breeds
    @State private var facePart = FacePart.ears
    @State private var eyeScope: EyeEditScope?
    @State private var coatThumbnails: (key: CoatThumbnailKey, images: [String: NSImage])?

    private var palette: PixelPalette { .of(colorScheme) }

    private let dogFields = [
        ("ear", "耳朵"), ("muzzle", "嘴鼻"), ("tail", "尾巴"), ("pattern", "面部花纹"),
    ]
    private let fieldColumns = [
        GridItem(.flexible(), spacing: 10, alignment: .top),
        GridItem(.flexible(), spacing: 10, alignment: .top),
    ]
    private let presetColumns = [
        GridItem(.flexible(), spacing: 8, alignment: .top),
        GridItem(.flexible(), spacing: 8, alignment: .top),
        GridItem(.flexible(), spacing: 8, alignment: .top),
    ]

    private var visiblePresets: [AppearancePreset] {
        (state.catalog?.presets ?? []).filter { $0.frame == "CAT" }
    }

    // The workbench only previews states you cannot reach by using the pet
    // itself. Left/right drag animation stays on the desktop pet, so it is not
    // offered here.
    private var actionOptions: [(String, String)] {
        if state.appearance["frame"] == "CAT" {
            return [("sit", "待机"), ("typing-gentle", "慢敲键盘"), ("typing-fast", "比较快"), ("typing", "特别快"), ("listening", "听音乐")]
        }
        return [
            ("sit", "待机"),
            ("typing", "打字"),
        ]
    }

    var body: some View {
        ZStack {
            PixelBackdrop(palette: palette)
            VStack(spacing: 14) {
                header
                HStack(alignment: .top, spacing: 16) {
                    previewPanel
                    detailPane
                }
                .frame(maxHeight: .infinity)
                footer
            }
            .padding(.horizontal, 20)
            .padding(.top, 30)
            .padding(.bottom, 16)
        }
        .frame(minWidth: 860, minHeight: 640)
    }

    private var header: some View {
        HStack(spacing: 12) {
            ZStack {
                PixelBox(corner: 3).fill(palette.panel)
                PixelBox(corner: 3).stroke(palette.border, lineWidth: 3)
                Image(nsImage: NSApp.applicationIconImage)
                    .resizable()
                    .interpolation(.none)
                    .frame(width: 38, height: 38)
            }
            .frame(width: 46, height: 46)
            .background(PixelBox(corner: 3).fill(palette.shadow).offset(x: 2, y: 2))

            VStack(alignment: .leading, spacing: 3) {
                Text("桌宠工作台")
                    .font(PixelFont.font(24))
                    .foregroundStyle(palette.ink)
                Text("挑选品种与外观，实时预览后应用到桌面")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
            }

            Spacer(minLength: 8)
        }
        .overlay(WindowDragArea())
    }

    private let previewSize: CGFloat = 300

    private var previewPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(spacing: 10) {
                ZStack {
                    PixelChecker(even: palette.panelAlt, odd: palette.panelDeep, cell: 12)
                    SpritePreview(web: preview)
                        .frame(width: previewSize, height: previewSize)
                        .accessibilityLabel("桌宠动作预览")
                        .overlay {
                            if let editor = state.pixelEditor {
                                PixelDrawingCanvas(model: editor, side: previewSize, palette: palette)
                            } else if state.customMode == .patches, let patch = state.selectedFurPatch, state.action == "sit" {
                                FurPatchSelection(patch: patch, size: previewSize, tint: palette.accent,
                                                  change: state.adjustFurPatch)
                                    .id(patch.id)
                            }
                        }
                }
                .disabled(state.editingCustom || state.applying)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipShape(PixelBox(corner: 2))
                .overlay(PixelBox(corner: 2).stroke(palette.borderSoft, lineWidth: 1))
                .overlay(alignment: .topLeading) { nameBadge.padding(7) }
                .overlay(alignment: .topTrailing) { frameBadge.padding(7) }

                HStack(spacing: 4) {
                    ForEach(actionOptions, id: \.0) { action, title in
                        Button(title) {
                            state.action = action
                            state.refresh()
                        }
                        .buttonStyle(PixelTabStyle(palette: palette, selected: state.action == action))
                        .frame(maxWidth: .infinity)
                        .disabled(state.pixelEditor != nil || state.editingCustom || state.applying || state.loadingCustom)
                    }
                }

                if state.showTypingStats {
                    TypingActivitySummary(activity: typingActivity, palette: palette)
                }
            }
        }
        .frame(width: 376)
    }

    private var nameBadge: some View {
        HStack(spacing: 5) {
            Rectangle().fill(palette.accent).frame(width: 6, height: 6)
            Text(state.appearance["name"].flatMap { $0.isEmpty ? nil : $0 } ?? "未命名")
                .font(PixelFont.font(12))
                .foregroundStyle(palette.ink)
                .lineLimit(1)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(PixelBox(corner: 1).fill(palette.panel.opacity(0.92)))
        .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 2))
    }

    @ViewBuilder
    private var frameBadge: some View {
        let breed = state.catalog?.presets.first { $0.id == state.preset }?.name
        if let breed, breed != state.appearance["name"] {
            Text(breed)
                .font(PixelFont.font(11))
                .foregroundStyle(palette.inkSoft)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(PixelBox(corner: 1).fill(palette.panelAlt.opacity(0.92)))
                .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 2))
                .accessibilityLabel("品种 \(breed)")
        }
    }

    @ViewBuilder
    private var detailPane: some View {
        if state.catalog != nil {
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 12) {
                    namePanel
                    appearancePanel
                        .disabled(state.pixelEditor != nil || state.editingCustom || state.loadingCustom)
                    customPanel
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
                .padding(.bottom, 6)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else {
            PixelPanel(palette: palette) {
                VStack(spacing: 10) {
                    ProgressView()
                    Text("正在加载形象…")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    private func sectionTab(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .buttonStyle(PixelTabStyle(palette: palette, selected: selected))
            .accessibilityAddTraits(selected ? .isSelected : [])
    }

    @State private var editingProfile = false
    @State private var draftYear = Calendar.current.component(.year, from: Date())
    @State private var draftMonth = 1
    @State private var draftDay = 1
    @State private var hasBirthDraft = false

    private var draftDays: Int {
        let calendar = Calendar.current
        guard let date = calendar.date(from: DateComponents(year: draftYear, month: draftMonth, day: 1)),
              let range = calendar.range(of: .day, in: .month, for: date) else { return 31 }
        return range.count
    }

    private var yearOptions: [Int] {
        let current = Calendar.current.component(.year, from: Date())
        let stored = state.birthDate.map { Calendar.current.component(.year, from: $0) } ?? current
        return Array(min(stored, current - 20)...max(current, stored))
    }

    private static let birthdayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy/MM/dd"
        return formatter
    }()

    private var ageText: String {
        guard let birth = state.birthDate else { return "未知" }
        let now = Date()
        guard birth <= now else { return "未知" }
        let years = Calendar.current.dateComponents([.year], from: birth, to: now).year ?? 0
        return "\(years) 岁"
    }

    private var birthText: String {
        guard let birth = state.birthDate else { return "未设置" }
        return Self.birthdayFormatter.string(from: birth)
    }

    private var genderText: String {
        switch state.gender {
        case "♂": return "♂ 男孩"
        case "♀": return "♀ 女孩"
        default: return "未选择"
        }
    }

    private func beginProfileEdit() {
        state.nameText = state.appearance["name", default: ""]
        state.nameDirty = false
        let calendar = Calendar.current
        let base = state.birthDate ?? Date()
        draftYear = calendar.component(.year, from: base)
        draftMonth = calendar.component(.month, from: base)
        draftDay = calendar.component(.day, from: base)
        hasBirthDraft = state.birthDate != nil
        editingProfile = true
    }

    private func saveProfile() {
        state.commitName()
        if hasBirthDraft {
            var components = DateComponents()
            components.year = draftYear
            components.month = draftMonth
            components.day = min(draftDay, draftDays)
            state.birthDate = Calendar.current.date(from: components)
        } else {
            state.birthDate = nil
        }
        editingProfile = false
    }

    private var namePanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    profileLabel("档案卡")
                    Spacer(minLength: 8)
                    Button(editingProfile ? "保存" : "编辑") {
                        if editingProfile { saveProfile() } else { beginProfileEdit() }
                    }
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: editingProfile))
                    .accessibilityIdentifier(editingProfile ? "profile-save" : "profile-edit")
                }

                Rectangle()
                    .fill(palette.borderSoft.opacity(0.7))
                    .frame(height: 1)

                if editingProfile {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 8) {
                            profileLabel("姓名")
                            PixelTextField(
                                text: Binding(
                                    get: { state.nameText },
                                    set: { state.nameText = $0; state.nameDirty = true }
                                ),
                                placeholder: "给桌宠起个名字",
                                palette: palette
                            )
                            .accessibilityLabel("桌宠姓名")
                            Text("\(state.nameText.count)/8")
                                .font(PixelFont.font(11))
                                .foregroundStyle(state.nameText.count > 8 ? palette.red : palette.inkSoft)
                                .fixedSize()
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            profileLabel("性别")
                            PixelSelect(
                                options: [("none", "未选择"), ("♂", "♂ 男孩"), ("♀", "♀ 女孩")],
                                selection: $state.gender,
                                palette: palette
                            )
                            .accessibilityLabel("性别")
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            profileLabel("MBTI")
                            PixelSelect(
                                options: [("none", "未选择")] + WorkbenchState.mbtiTypes.map { ($0, $0) },
                                selection: $state.mbti,
                                palette: palette
                            )
                            .accessibilityLabel("MBTI")
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 8) {
                                profileLabel("出生日期")
                                Spacer(minLength: 0)
                                if !hasBirthDraft {
                                    Text("未设置，选择年月日即设置")
                                        .font(PixelFont.font(10))
                                        .foregroundStyle(palette.inkSoft)
                                }
                                if hasBirthDraft {
                                    Button("清除") { hasBirthDraft = false }
                                        .buttonStyle(PixelButtonStyle(palette: palette))
                                }
                            }
                            HStack(spacing: 8) {
                                birthSelect("年", values: yearOptions, selection: $draftYear)
                                birthSelect("月", values: Array(1...12), selection: $draftMonth)
                                birthSelect("日", values: Array(1...draftDays), selection: $draftDay)
                            }
                            .onChange(of: draftYear) { _ in
                                hasBirthDraft = true
                                draftDay = min(draftDay, draftDays)
                            }
                            .onChange(of: draftMonth) { _ in
                                hasBirthDraft = true
                                draftDay = min(draftDay, draftDays)
                            }
                            .onChange(of: draftDay) { _ in hasBirthDraft = true }
                        }
                    }
                    .onExitCommand {
                        editingProfile = false
                        state.nameText = state.appearance["name", default: ""]
                        state.nameDirty = false
                    }
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 8) {
                            profileLabel("姓名")
                            Text(state.appearance["name", default: ""].isEmpty
                                 ? "未命名" : state.appearance["name", default: ""])
                                .font(PixelFont.font(13))
                                .foregroundStyle(state.appearance["name", default: ""].isEmpty ? palette.inkSoft : palette.ink)
                                .lineLimit(1)
                        }
                        HStack(spacing: 8) {
                            profileLabel("性别")
                            Text(genderText)
                                .font(PixelFont.font(13))
                                .foregroundStyle(state.gender == "none" ? palette.inkSoft : palette.ink)
                        }
                        HStack(spacing: 8) {
                            profileLabel("MBTI")
                            Text(state.mbti == "none" ? "未选择" : state.mbti)
                                .font(PixelFont.font(13))
                                .foregroundStyle(state.mbti == "none" ? palette.inkSoft : palette.ink)
                        }
                        HStack(spacing: 8) {
                            profileLabel("出生日期")
                            Text(birthText)
                                .font(PixelFont.font(13))
                                .monospacedDigit()
                                .foregroundStyle(state.birthDate == nil ? palette.inkSoft : palette.ink)
                            Spacer(minLength: 8)
                            Text("年龄 \(ageText)")
                                .font(PixelFont.font(11))
                                .foregroundStyle(palette.inkSoft)
                                .help("年龄根据出生日期自动计算")
                        }
                    }
                }
            }
        }
    }

    private func birthSelect(_ label: String, values: [Int], selection: Binding<Int>) -> some View {
        PixelSelect(
            options: values.map { (String($0), "\($0) \(label)") },
            selection: Binding(
                get: { String(selection.wrappedValue) },
                set: { if let value = Int($0) { selection.wrappedValue = value } }
            ),
            palette: palette
        )
        .accessibilityLabel("出生\(label)")
    }

    private func profileLabel(_ text: String) -> some View {
        Text(text)
            .font(PixelFont.font(12))
            .foregroundStyle(palette.inkSoft)
            .fixedSize()
    }

    @State private var savingAppearance = false
    @State private var customName = ""

    @State private var customExpanded = false

    private var customPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 9) {
                HStack(spacing: 8) {
                    Button {
                        customExpanded.toggle()
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: customExpanded ? "chevron.down" : "chevron.right")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(palette.inkSoft)
                                .frame(width: 10)
                            Text("自定义外观")
                                .font(PixelFont.font(12))
                                .foregroundStyle(palette.ink)
                            if !state.customPresets.isEmpty {
                                Text("\(state.customPresets.count)")
                                    .font(PixelFont.font(10))
                                    .foregroundStyle(palette.inkSoft)
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 1)
                                    .background(PixelBox(corner: 1).fill(palette.panelDeep))
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(customExpanded ? "收起自定义外观" : "展开自定义外观")
                    .accessibilityIdentifier("custom-appearance-toggle")

                    Spacer(minLength: 8)

                    if customExpanded {
                        Button("存为形象") { savingAppearance.toggle() }
                            .buttonStyle(PixelButtonStyle(palette: palette))
                            .accessibilityIdentifier("save-custom-appearance")
                        Button("导出 PNG") { state.exportAppearance() }
                            .buttonStyle(PixelButtonStyle(palette: palette))
                            .accessibilityIdentifier("export-appearance")
                    }
                }

                if customExpanded {
                    if savingAppearance {
                        HStack(spacing: 8) {
                            TextField("形象名称", text: $customName)
                                .textFieldStyle(.roundedBorder)
                                .onSubmit(saveCurrentAppearance)
                            Button("保存", action: saveCurrentAppearance)
                                .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                                .disabled(customName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                    }
                    if state.appearance["frame"] == "CAT" { photoGenerator }
                    Button {
                        state.showingManualTools.toggle()
                        if !state.showingManualTools { state.changeCustomMode(nil) }
                    } label: {
                        Label("手动微调", systemImage: state.showingManualTools ? "chevron.down" : "chevron.right")
                    }
                    .buttonStyle(PixelButtonStyle(palette: palette))
                    .accessibilityIdentifier("manual-appearance-tools")
                    .disabled(state.pixelEditor != nil)
                    if state.showingManualTools { manualTools }
                    if !state.customPresets.isEmpty || state.customSelected != nil || state.hasPendingBrush {
                        PixelDivider(palette: palette)
                        HStack {
                            Text(!state.customPresets.isEmpty ? "已保存形象" : "当前笔迹")
                                .font(PixelFont.font(11))
                                .foregroundStyle(palette.inkSoft)
                            Spacer()
                            if state.customSelected != nil || state.hasPendingBrush {
                                Button("取消笔迹叠加") { state.clearCustom() }
                                    .buttonStyle(PixelButtonStyle(palette: palette))
                                    .disabled(state.pixelEditor != nil)
                            }
                        }
                        LazyVGrid(columns: presetColumns, alignment: .leading, spacing: 8) {
                            ForEach(state.customPresets) { preset in
                                customChip(preset)
                            }
                        }
                        .disabled(state.pixelEditor != nil)
                    }
                }
            }
            .disabled(customExpanded && (state.editingCustom || state.loadingCustom || state.applying))
        }
    }

    private var photoGenerator: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(alignment: .top, spacing: 8) {
                ForEach(state.catPhotos.indices, id: \.self) { slot in
                    VStack(alignment: .leading, spacing: 4) {
                        Button {
                            state.chooseCatPhoto(slot)
                        } label: {
                            VStack(spacing: 4) {
                                if let photo = state.catPhotos[slot] {
                                    Image(nsImage: photo.image)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 65, height: 49)
                                        .accessibilityHidden(true)
                                }
                                Text(slot == 0 ? "首图" : "补图 \(slot)")
                                Text(state.catPhotos[slot] == nil ? (slot == 0 ? "上传" : "添加") : "更换")
                                    .font(PixelFont.font(10))
                            }
                            .frame(minWidth: 65, minHeight: 55)
                        }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .accessibilityIdentifier(slot == 0 ? "cat-photo-upload" : "cat-photo-upload-\(slot + 1)")
                        .disabled(state.editingCustom || state.applying || state.pixelEditor != nil
                                  || (slot > 0 && state.catPhotos[slot - 1] == nil))
                        if slot > 0 && state.catPhotos[slot] != nil {
                            Button("移除") {
                                var photos = state.catPhotos
                                photos.remove(at: slot)
                                state.catPhotos = photos + [nil]
                                state.photoStatus = ""
                            }
                            .buttonStyle(PixelButtonStyle(palette: palette))
                            .accessibilityLabel("移除补图 \(slot)")
                            .disabled(state.editingCustom || state.applying || state.pixelEditor != nil)
                        }
                    }
                }
            }
            if state.catPhotos[0] != nil {
                Button(state.generatingPhoto ? "正在生成…" : "生成桌宠") { state.generateFromCatPhoto() }
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                    .accessibilityIdentifier("cat-photo-generate")
                    .disabled(state.editingCustom || state.loadingCustom || state.applying || state.pixelEditor != nil)
            }
            Text(state.photoStatus.isEmpty
                 ? (CatPhotoClient.recognizesLocally ? "照片在本机识别。" : "点击生成后，照片会发送到云端识别。")
                    + "首图建议用正面照，可加两张同猫补图，拍清被挡住的部位。"
                 : state.photoStatus)
                .font(PixelFont.font(10))
                .foregroundStyle(palette.inkSoft)
                .accessibilityIdentifier("cat-photo-status")
        }
    }

    private var manualTools: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Spacer(minLength: 0)
                if state.customMode != nil {
                    Button("完成微调") { state.changeCustomMode(nil) }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                }
            }
            HStack(spacing: 6) {
                ForEach(CustomAppearanceMode.allCases, id: \.self) { mode in
                    if mode != .patches || state.appearance["frame"] == "CAT" {
                        Button(mode.title) { state.changeCustomMode(mode) }
                            .buttonStyle(PixelTabStyle(palette: palette, selected: state.customMode == mode))
                            .accessibilityAddTraits(state.customMode == mode ? .isSelected : [])
                            .accessibilityIdentifier("custom-appearance-\(mode.rawValue)")
                    }
                }
            }
            if state.customMode == .patches, let catalog = state.catalog {
                furPatchEditor(catalog)
            }
            if let editor = state.pixelEditor {
                PixelEditorTools(model: editor, palette: palette)
                Text("在左侧画布上补画，完成微调后可预览动作。")
                    .font(PixelFont.font(10))
                    .foregroundStyle(palette.inkSoft)
            }
        }
    }

    private func saveCurrentAppearance() {
        state.saveCustomAppearance(customName) { saved in
            if saved {
                savingAppearance = false
                customName = ""
            }
        }
    }

    private func customChip(_ preset: CustomPresetInfo) -> some View {
        let selected = state.customSelected == preset.id
        return ZStack(alignment: .topTrailing) {
            Button {
                state.chooseCustom(preset)
            } label: {
            HStack(spacing: 6) {
                if let image = NSImage(contentsOf: preset.url) {
                    Image(nsImage: image)
                        .resizable()
                        .interpolation(.none)
                        .frame(width: 22, height: 22)
                }
                Text(preset.name)
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
                    .lineLimit(1)
                Spacer(minLength: 2)
                if selected {
                    PixelGlyph(kind: .check, color: palette.green, size: 10)
                }
            }
            .padding(.horizontal, 7)
            .padding(.vertical, 5)
            .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
                .background(PixelBox(corner: 2).fill(selected ? palette.accent.opacity(0.42) : palette.panelAlt))
                .overlay(PixelBox(corner: 2).stroke(palette.border, lineWidth: 2))
            }
            .buttonStyle(.plain)
            .disabled(state.applying)
            .help("在左侧预览这个自定义形象")
            .accessibilityAddTraits(selected ? .isSelected : [])

            Button {
                state.deleteCustom(preset)
            } label: {
                PixelGlyph(kind: .close, color: palette.inkSoft, size: 8)
                    .frame(width: 13, height: 13)
                    .background(PixelBox(corner: 1).fill(palette.panelDeep))
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(state.applying || state.loadingCustom)
            .offset(x: 3, y: -3)
            .help("删除这个自定义形象")
        }
    }


    @ViewBuilder
    private var appearancePanel: some View {
        if let catalog = state.catalog {
            let frame = state.appearance["frame", default: "CAT"]
            let optionGroup = frame == "CAT" && state.appearance["palette"] == "CC01" ? "CAT_ORANGE" : frame
            let fields = catalog.fieldsByFrame[optionGroup] ?? [:]
            let markings = catalog.fieldsByFrame["CAT_MARKINGS"] ?? [:]
            let canChooseFaceBase = catalog.faceBasePalettes.contains(state.appearance["palette", default: "CC01"])

            PixelPanel(palette: palette, padding: 12) {
                if frame == "CAT" {
                    VStack(alignment: .leading, spacing: 10) {
                        appearanceNavigation
                        PixelDivider(palette: palette)
                        if appearancePage == .face { faceNavigation }
                        appearanceContent(fields: fields, markings: markings, canChooseFaceBase: canChooseFaceBase)
                            .disabled(state.choosingBreed && appearancePage != .breeds)
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                    }
                    .onChange(of: state.preset) { _ in eyeScope = nil }
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        LazyVGrid(columns: fieldColumns, alignment: .leading, spacing: 8) {
                            ForEach(dogFields, id: \.0) { key, title in
                                if let options = fields[key] {
                                    fieldPicker(title: title, key: key, options: options)
                                }
                            }
                        }
                        paletteRow(options: fields["palette"] ?? [])
                    }
                }
            }
        }
    }

    private var appearanceNavigation: some View {
        HStack(spacing: 4) {
            ForEach(AppearancePage.allCases, id: \.self) { page in
                if page == .face {
                    Rectangle().fill(palette.borderSoft).frame(width: 1, height: 18)
                        .padding(.horizontal, 2)
                }
                sectionTab(page.rawValue, selected: appearancePage == page) {
                    if appearancePage != page { eyeScope = nil }
                    appearancePage = page
                }
                .accessibilityIdentifier("appearance-\(page)")
            }
            Spacer(minLength: 0)
        }
    }

    private var faceNavigation: some View {
        HStack(spacing: 4) {
            ForEach(FacePart.allCases, id: \.self) { part in
                sectionTab(part.rawValue, selected: facePart == part) {
                    if facePart != part { eyeScope = nil }
                    facePart = part
                }
                .accessibilityIdentifier("appearance-\(part)")
            }
            Spacer(minLength: 0)
        }
    }

    @ViewBuilder
    private func appearanceContent(
        fields: [String: [AppearanceOption]], markings: [String: [AppearanceOption]],
        canChooseFaceBase: Bool
    ) -> some View {
        switch appearancePage {
        case .breeds:
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 7), count: 4), spacing: 7) {
                ForEach(visiblePresets, id: \.id) { preset in
                    appearanceCard(preset.name, image: state.thumbnails?.breeds[preset.id], selected: state.preset == preset.id,
                                   imageHeight: 88) { state.choosePreset(preset.id) }
                        .accessibilityIdentifier("breed-\(preset.id)")
                }
            }
        case .face:
            switch facePart {
            case .ears:
                partColorRow("ear", shapeTitle: "耳形", colorTitle: "内耳色", fields: fields)
            case .eyes:
                pupilControls(colors: fields["eyeColor"] ?? [])
            case .nose:
                partColorRow("nose", shapeTitle: "鼻形", colorTitle: "鼻色", fields: fields)
            case .mouth:
                if let options = fields["mouth"] { partChoices("嘴形", key: "mouth", options: options) }
            }
        case .coat:
            VStack(alignment: .leading, spacing: 11) {
                coatCards
                DisclosureGroup("细调花纹") {
                    VStack(alignment: .leading, spacing: 10) {
                        if let options = fields["coat"] { coatPicker(options: options, palettes: fields["palette"] ?? []) }
                        markingsControls(fields, markings, canChooseFaceBase: canChooseFaceBase)
                    }
                    .padding(.top, 8)
                }
                .font(PixelFont.font(12))
                .foregroundStyle(palette.ink)
            }
        case .tail:
            if let options = fields["tail"] { partChoices("尾形", key: "tail", options: options, imageHeight: 88) }
        case .accessories:
            if let options = fields["accessory"] { accessoryRow(options) }
        }
    }

    private var currentCoatCards: [AppearanceOption] {
        state.catalog?.coatCards[state.appearance["palette", default: "CC01"]] ?? []
    }

    private var coatCards: some View {
        // A different coat selection still uses the same set of thumbnails.
        let key = CoatThumbnailKey(appearance: state.appearance.filter { $0.key != "coat" && $0.key != "name" },
                                   patches: state.furPatches, overlayRevision: state.coatOverlayRevision)
        let images = coatThumbnails?.key == key ? coatThumbnails?.images : nil
        return VStack(alignment: .leading, spacing: 6) {
            if let breed = nativeCatPreset { profileLabel("\(breed.name)的花色") }
            LazyVGrid(columns: presetColumns, spacing: 8) {
                ForEach(currentCoatCards, id: \.id) { coat in
                    appearanceCard(coat.name, image: images?[coat.id], selected: state.appearance["coat"] == coat.id,
                                   imageHeight: 104) {
                        appearanceBinding("coat").wrappedValue = coat.id
                    }
                    .accessibilityIdentifier("coat-\(coat.id)")
                }
            }
        }
        .task(id: key) {
            guard images == nil else { return }
            let rendered = await state.renderCoatThumbnails()
            if !Task.isCancelled, !rendered.isEmpty { coatThumbnails = (key, rendered) }
        }
    }

    private func markingsControls(
        _ fields: [String: [AppearanceOption]], _ markings: [String: [AppearanceOption]], canChooseFaceBase: Bool
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 7) {
                if let options = fields["pattern"] { fieldPicker(title: "额头花纹", key: "pattern", options: options) }
                if canChooseFaceBase, let options = markings["faceBase"] {
                    fieldPicker(title: "脸部底纹", key: "faceBase", options: options)
                } else {
                    staticField(title: "脸部底纹", value: "均匀底色")
                }
                if let options = markings["cheekPattern"] { fieldPicker(title: "脸颊花纹", key: "cheekPattern", options: options) }
            }
            HStack(alignment: .top, spacing: 7) {
                if let options = markings["bodyBase"] { fieldPicker(title: "身体底色", key: "bodyBase", options: options) }
                if let options = fields["bodyPattern"] { fieldPicker(title: "身体花纹", key: "bodyPattern", options: options) }
                if let options = markings["tailPattern"] { fieldPicker(title: "尾纹", key: "tailPattern", options: options) }
            }
        }
    }

    private func appearanceCard(
        _ title: String, image: NSImage?, selected: Bool, imageHeight: CGFloat, labelHeight: CGFloat = 20,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 3) {
                ZStack {
                    PixelChecker(even: Color(pixelHex: 0xD4B99B), odd: Color(pixelHex: 0xDEC5AA), cell: 8)
                    if let image {
                        Image(nsImage: image)
                            .resizable()
                            .interpolation(.none)
                            .scaledToFit()
                            .padding(5)
                    }
                }
                .frame(height: imageHeight)
                .clipped()
                .accessibilityHidden(true)
                Text(title)
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.ink)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(height: labelHeight)
            }
            .padding(4)
            .frame(maxWidth: .infinity)
            .background(PixelBox(corner: 2).fill(selected ? palette.accent.opacity(0.23) : palette.panelAlt))
            .overlay(PixelBox(corner: 2).stroke(selected ? palette.accent : palette.borderSoft, lineWidth: selected ? 2 : 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func partChoices(
        _ title: String, key: String, options: [AppearanceOption], imageHeight: CGFloat = 59
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            profileLabel(title)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: min(5, max(1, options.count))),
                      spacing: 6) {
                ForEach(options, id: \.id) { option in
                    appearanceCard(option.name, image: state.thumbnails?.parts[key]?[option.id],
                                   selected: state.appearance[key] == option.id, imageHeight: imageHeight) {
                        appearanceBinding(key).wrappedValue = option.id
                    }
                    .accessibilityIdentifier("\(key)-shape-\(option.id)")
                }
            }
        }
    }

    private let patchRegions = [
        ("head", "头脸"), ("torso", "胸口／后身"),
        ("leftForeleg", "画面左前肢"), ("rightForeleg", "画面右前肢"),
        ("leftPaw", "画面左前爪"), ("rightPaw", "画面右前爪"),
    ]

    private func furPatchEditor(_ catalog: AppearanceCatalog) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Menu("按部位添加斑块") {
                ForEach(patchRegions, id: \.0) { part, label in
                    Menu(label) {
                        ForEach(catalog.furPatchPresets.filter { $0.part == part }) { preset in
                            Button(preset.name) { state.addFurPatch(preset) }
                        }
                    }
                }
            }
            .fixedSize()
            .disabled(state.furPatches.count >= catalog.furPatchLimit)
            .accessibilityIdentifier("fur-patch-add")
            if !state.furPatches.isEmpty {
                Menu {
                    ForEach(Array(state.furPatches.enumerated()), id: \.element.id) { index, patch in
                        Button("\(index + 1) · \(state.furPatchPreset(patch.preset)?.name ?? "斑块")") {
                            state.selectFurPatch(patch.id)
                        }
                    }
                } label: {
                    if let patch = state.selectedFurPatch, let preset = state.furPatchPreset(patch.preset) {
                        let index = state.furPatches.firstIndex { $0.id == patch.id } ?? 0
                        Label("\(index + 1) · \(preset.name)", systemImage: "square.on.square")
                    } else {
                        Text("选择斑块（\(state.furPatches.count)）")
                    }
                }
                .accessibilityIdentifier("fur-patch-selection")
            }
            if let patch = state.selectedFurPatch, let preset = state.furPatchPreset(patch.preset) {
                furPatchControls(patch, preset: preset, catalog: catalog)
            }
        }
    }

    private func furPatchControls(_ patch: FurPatch, preset: FurPatchPreset, catalog: AppearanceCatalog) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Menu {
                    ForEach(preset.shapes) { shape in
                        Button(shape.name) { editFurPatch(patch) { $0.shape = shape.id } }
                    }
                } label: {
                    Text(preset.shapes.first { $0.id == patch.shape }?.name ?? "形状")
                }
                .accessibilityLabel("斑块形状")
                .accessibilityIdentifier("fur-patch-shape")
                ColorPicker("颜色", selection: Binding(
                    get: { WBTheme.swatchColors([patch.color]).first ?? .white },
                    set: { color in
                        guard let rgb = NSColor(color).usingColorSpace(.sRGB) else { return }
                        let channels = [rgb.redComponent, rgb.greenComponent, rgb.blueComponent].map { Int(($0 * 255).rounded()) }
                        let code = String(format: "#%02X%02X%02X", channels[0], channels[1], channels[2])
                        editFurPatch(patch) { $0.color = code }
                    }), supportsOpacity: false)
                    .fixedSize()
            }
            HStack(spacing: 8) {
                Stepper("宽 \(patch.width)", value: Binding(
                    get: { patch.width }, set: { width in editFurPatch(patch) { $0.width = width } }),
                        in: catalog.furPatchDimensions.range)
                Stepper("高 \(patch.height)", value: Binding(
                    get: { patch.height }, set: { height in editFurPatch(patch) { $0.height = height } }),
                        in: catalog.furPatchDimensions.range)
            }
            .font(PixelFont.font(11))
            HStack(spacing: 7) {
                Button("翻转") { editFurPatch(patch) { $0.flipped.toggle() } }
                Button("镜像复制") { state.mirrorFurPatch(patch) }
                    .disabled(state.furPatches.count >= catalog.furPatchLimit)
                Button("删除") { state.removeFurPatch(patch.id) }
                Spacer(minLength: 0)
                Button("收起选框") { state.selectFurPatch(nil) }
            }
            .buttonStyle(PixelTabStyle(palette: palette, selected: false))
            Text(state.action == "sit" ? "拖选框移动，拖方块调宽高。" : "切回待机可继续在预览上拖动。")
                .font(PixelFont.font(10))
                .foregroundStyle(palette.inkSoft)
        }
    }

    private func editFurPatch(_ patch: FurPatch, change: (inout FurPatch) -> Void) {
        var updated = patch
        change(&updated)
        state.adjustFurPatch(updated)
    }

    private var nameCountColor: Color {
        let count = state.appearance["name", default: ""].count
        return (count == 0 || count > 8) ? palette.red : palette.inkSoft
    }

    @ViewBuilder
    private func partColorRow(
        _ part: String, shapeTitle: String, colorTitle: String, fields: [String: [AppearanceOption]]
    ) -> some View {
        let colorKey = part + "Color"
        if let shapes = fields[part], let colors = fields[colorKey] {
            VStack(alignment: .leading, spacing: 11) {
                partChoices(shapeTitle, key: part, options: shapes)
                fieldPicker(title: colorTitle, key: colorKey, options: colors,
                            defaultSwatch: WBTheme.swatchColors(naturalSwatches[colorKey].map { [$0] }))
            }
        }
    }

    private func accessoryRow(_ options: [AppearanceOption]) -> some View {
        HStack(alignment: .top, spacing: 10) {
            fieldPicker(title: "头顶配饰", key: "accessory", options: options)
            staticField(title: "服装配饰", value: "无")
        }
    }

    private func staticField(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            Text(value)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 10)
                .padding(.vertical, 10)
                .background(PixelBox(corner: 3).fill(palette.panelAlt))
                .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1))
        }
        .accessibilityElement(children: .combine)
    }

    private func fieldPicker(
        title: String, key: String, options: [AppearanceOption], defaultSwatch: [Color]? = nil
    ) -> some View {
        let accessibilityID = switch key {
        case "eyeColor": "eye-color-picker"
        case "earColor": "ear-color-picker"
        case "noseColor": "nose-color-picker"
        default: "\(key)-picker"
        }
        return VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            Group {
                if let defaultSwatch {
                    PixelColorSelect(title: title, options: options, defaultSwatch: defaultSwatch,
                                     palette: palette, selection: appearanceBinding(key))
                } else {
                    PixelSelect(options: options.map { (id: $0.id, name: $0.name) },
                                selection: appearanceBinding(key), palette: palette)
                        .accessibilityLabel(title)
                }
            }
            .accessibilityIdentifier(accessibilityID)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var hasDifferentEyes: Bool {
        func differs(_ suffix: String, inherited: String, defaultValue: String) -> Bool {
            pupilValue(.left, suffix, inherited: inherited, defaultValue: defaultValue)
                != pupilValue(.right, suffix, inherited: inherited, defaultValue: defaultValue)
        }
        let leftIsDouble = pupilValue(.left, "InnerPupil", inherited: "innerPupil", defaultValue: "round") == "round"
        return differs("InnerPupil", inherited: "innerPupil", defaultValue: "round")
            || differs("EyeColor", inherited: "eyeColor", defaultValue: "natural")
            || (leftIsDouble && differs("InnerEyeColor", inherited: "innerEyeColor", defaultValue: "natural"))
    }

    private func pupilControls(colors: [AppearanceOption]) -> some View {
        let scope = eyeScope ?? (hasDifferentEyes ? .left : .both)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 5) {
                if scope != .both || hasDifferentEyes {
                    ForEach(EyeEditScope.allCases, id: \.self) { option in
                        sectionTab(option.title, selected: scope == option) { eyeScope = option }
                            .accessibilityIdentifier("\(option.rawValue)-eye-pupil-picker")
                    }
                } else {
                    Button("左右分别编辑") { eyeScope = .left }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .accessibilityIdentifier("split-eye-colors")
                }
                Spacer(minLength: 0)
            }
            PupilColorEditor(
                side: scope.rawValue, colors: colors, naturalSwatches: naturalSwatches, palette: palette,
                layers: pupilBinding(scope, "InnerPupil", inherited: "innerPupil", defaultValue: "round"),
                outer: pupilBinding(scope, "EyeColor", inherited: "eyeColor", defaultValue: "natural"),
                inner: pupilBinding(scope, "InnerEyeColor", inherited: "innerEyeColor", defaultValue: "natural")
            )
            .id(scope)
        }
    }

    private func pupilValue(_ side: EyeEditScope, _ suffix: String, inherited: String, defaultValue: String) -> String {
        state.appearance[side.rawValue + suffix] ?? state.appearance[inherited] ?? defaultValue
    }

    private func pupilBinding(_ scope: EyeEditScope, _ suffix: String, inherited: String, defaultValue: String) -> Binding<String> {
        let sides = scope == .both ? [EyeEditScope.left, .right] : [scope]
        return Binding(
            get: {
                let values = sides.map { pupilValue($0, suffix, inherited: inherited, defaultValue: defaultValue) }
                guard let first = values.first, values.allSatisfy({ $0 == first }) else { return "" }
                return first
            },
            set: { value in
                var appearance = state.appearance
                for side in sides { appearance[side.rawValue + suffix] = value }
                state.appearance = appearance
                state.refresh()
            }
        )
    }

    private var nativeCatPreset: AppearancePreset? {
        let paletteID = state.appearance["palette", default: "CC01"]
        return state.catalog?.presets.first { $0.frame == "CAT" && $0.palette == paletteID }
    }

    private var naturalSwatches: [String: String] { nativeCatPreset?.naturalSwatches ?? [:] }

    private func coatPicker(options: [AppearanceOption], palettes: [AppearanceOption]) -> some View {
        let paletteID = state.appearance["palette", default: "CC01"]
        let nativeColors = palettes.first { $0.id == paletteID }?.colors ?? nativeCatPreset?.colors
        let curated = Set((state.catalog?.coatCards.values.flatMap { $0.dropFirst().map(\.id) }) ?? [])
        let visible = options.filter { !curated.contains($0.id) || $0.id == state.appearance["coat"] }
        return fieldPicker(title: "自选毛色", key: "coat", options: visible,
                           defaultSwatch: WBTheme.paletteColors(paletteID, catalogColors: nativeColors))
    }

    private func paletteRow(options: [AppearanceOption]) -> some View {
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text("毛色")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                if let selected = options.first(where: { $0.id == state.appearance["palette"] }) {
                    Text(selected.name)
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft.opacity(0.8))
                }
            }
            HStack(spacing: 6) {
                ForEach(options, id: \.id) { option in
                    let selected = state.appearance["palette"] == option.id
                    Button {
                        state.appearance["palette"] = option.id
                        state.refresh()
                    } label: {
                        ZStack {
                            PixelSwatch(colors: WBTheme.paletteColors(option.id, catalogColors: option.colors),
                                        palette: palette, size: 22)
                            if selected {
                                PixelBox(corner: 1)
                                    .stroke(palette.accent, lineWidth: 2)
                                    .frame(width: 27, height: 27)
                            }
                        }
                        .frame(width: 27, height: 27)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(option.name)
                    .accessibilityIdentifier("palette-\(option.id)")
                    .help(option.name)
                }
                Spacer(minLength: 0)
            }
        }
    }


    private var footer: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    PixelStatusBadge(text: statusText, color: statusColor, palette: palette)
                    Spacer(minLength: 8)
                    applyButton
                }

                HStack(spacing: 12) {
                    Toggle("打字动画", isOn: Binding(get: { state.typingAnimationEnabled }, set: state.setTypingAnimation))
                        .toggleStyle(PixelToggleStyle(palette: palette))
                        .help("按键时让桌面上的小猫打字，需要输入监控")
                        .accessibilityIdentifier("typing-animation-toggle")

                    Toggle("本地打字统计", isOn: Binding(get: { state.typingStatsEnabled }, set: state.setTypingStats))
                        .toggleStyle(PixelToggleStyle(palette: palette))
                        .help("在本机记录活跃打字时长和按键次数，需要输入监控")
                        .accessibilityIdentifier("typing-stats-toggle")

                    Toggle("显示打字统计", isOn: Binding(get: { state.showTypingStats }, set: state.setShowTypingStats))
                        .toggleStyle(PixelToggleStyle(palette: palette))
                        .help("在预览下方显示今日数据，统计由本地打字统计开关控制")
                        .accessibilityIdentifier("typing-stats-display-toggle")

                    Toggle("划词翻译", isOn: Binding(get: { state.selectionTranslationEnabled }, set: state.setSelectionTranslation))
                        .toggleStyle(PixelToggleStyle(palette: palette))
                        .disabled(!TranslationEngine.isAvailable)
                        .help(TranslationEngine.isAvailable ? "选中英文后显示翻译按钮，需要辅助功能权限" : "需要 macOS 15 或更新版本")
                        .accessibilityIdentifier("selection-translation-toggle")

                    Spacer(minLength: 8)
                    if state.typingStatus == .needsPermission {
                        Button("输入监控设置", action: state.openInputSettings)
                            .buttonStyle(PixelButtonStyle(palette: palette))
                    }
                    if state.translationNeedsPermission {
                        Button("辅助功能设置", action: state.openAccessibilitySettings)
                            .buttonStyle(PixelButtonStyle(palette: palette))
                    }
                }

                PixelDivider(palette: palette)

                HStack(spacing: 10) {
                    Toggle("显示桌宠", isOn: Binding(get: { state.petIsVisible }, set: state.setVisibility))
                        .toggleStyle(PixelToggleStyle(palette: palette))

                    Rectangle().fill(palette.borderSoft).frame(width: 2, height: 14)

                    Toggle("眼神跟随", isOn: $state.eyeFollow)
                        .toggleStyle(PixelToggleStyle(palette: palette))
                        .accessibilityIdentifier("eye-follow-toggle")
                        .help("让猫咪眼睛的小高光跟随鼠标方向")
                        .onChange(of: state.eyeFollow) { state.setEyeFollow($0) }

                    Rectangle().fill(palette.borderSoft).frame(width: 2, height: 14)

                    Text("大小")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)
                    PixelSlider(
                        value: $state.petSize,
                        range: 120...320,
                        step: 10,
                        palette: palette
                    )
                    .frame(width: 140)
                    .accessibilityLabel("桌宠大小")
                    .onChange(of: state.petSize) { state.setSize($0) }
                    Text("\(Int(state.petSize)) px")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.ink)
                        .frame(width: 52, alignment: .leading)

                    Spacer(minLength: 8)

                    Button("归位") { state.reset() }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .help("将桌宠移回屏幕")
                }
            }
        }
    }

    private var applyButton: some View {
        let disabled = state.catalog == nil || state.applying || state.loadingCustom || state.editingCustom || state.choosingBreed
        return Button {
            state.apply()
        } label: {
            HStack(spacing: 5) {
                if !state.applying {
                    PixelGlyph(kind: .check, color: palette.ink, size: 10)
                }
                Text(state.applying ? "正在应用…" : "应用到桌宠")
            }
        }
        .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
        .disabled(disabled)
        .opacity(disabled ? 0.55 : 1)
        .keyboardShortcut(.defaultAction)
    }

    private var statusText: String {
        if state.loadingCustom { return "正在载入自定义形象…" }
        return state.message.isEmpty ? state.typingStatus.text : state.message
    }

    private var statusColor: Color {
        if state.loadingCustom { return palette.accent }
        if !state.message.isEmpty {
            let failed = state.message.contains("无法") || state.message.contains("失败")
            return failed ? palette.red : palette.green
        }
        switch state.typingStatus {
        case .active: return palette.green
        case .needsPermission: return palette.accent
        case .off, .unavailable: return palette.inkSoft
        }
    }

    private func appearanceBinding(_ key: String) -> Binding<String> {
        Binding(get: { state.appearance[key, default: ""] }, set: { value in
            state.appearance[key] = value
            state.refresh()
        })
    }
}

private struct TypingActivitySummary: View {
    @ObservedObject var activity: TypingActivity
    let palette: PixelPalette

    private var duration: String {
        let seconds = Int(activity.today.activeSeconds)
        if seconds >= 3600 { return "\(seconds / 3600) 小时 \(seconds % 3600 / 60) 分" }
        if seconds >= 60 { return "\(seconds / 60) 分 \(seconds % 60) 秒" }
        return "\(seconds) 秒"
    }

    var body: some View {
        HStack(spacing: 12) {
            metric("今日活跃打字时长", value: duration)
            Rectangle()
                .fill(palette.borderSoft)
                .frame(width: 1, height: 26)
                .accessibilityHidden(true)
            metric("今日按键次数", value: "\(activity.today.keyCount.formatted()) 次")
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(PixelBox(corner: 2).fill(palette.panelAlt))
        .overlay(PixelBox(corner: 2).stroke(palette.borderSoft, lineWidth: 1))
    }

    private func metric(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            Text(value)
                .font(PixelFont.font(16))
                .foregroundStyle(palette.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}
