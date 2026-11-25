import AppKit
import SwiftUI
import WebKit

struct AppearanceOption: Decodable {
    let id: String
    let name: String
    let colors: [String]?
    var accessoryCategory: String? = nil
    var accessorySide: String? = nil
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
    let photoEarMarks: [String: [AppearanceOption]]
    let photoEarPigments: [AppearanceOption]
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

enum CustomAppearanceMode: String {
    case patches, brush
}

final class WorkbenchState: ObservableObject {
    @Published var catalog: AppearanceCatalog?
    @Published var thumbnails: AppearanceThumbnails?
    @Published private var accessoryOwnership = AccessoryOwnership.load()
    @Published private(set) var accessoryThumbnails: [String: NSImage] = [:]

    var accessoryDirectory: [AccessoryShopItem] {
        catalog.map(AccessoryShopItem.directory(from:)) ?? []
    }

    func ownsAccessory(_ id: String) -> Bool {
        accessoryOwnership.ids.contains(AccessoryShopItem.ownershipID(id))
    }

    func acquireAccessory(_ id: String) {
        guard accessoryDirectory.contains(where: { $0.id == id }) else { return }
        grantAccessories([id])
    }

    func recognizeLegacyAccessories(_ configs: [[String: Any]]) {
        let compatible = configs.reduce(into: Set<String>()) { ids, config in
            ids.formUnion(AccessoryShopItem.legacyOwnership(in: config))
        }
        grantAccessories(compatible.intersection(accessoryDirectory.map(\.id)))
    }

    private func grantAccessories(_ ids: Set<String>) {
        guard !ids.isSubset(of: accessoryOwnership.ids) else { return }
        accessoryOwnership.ids.formUnion(ids)
        accessoryOwnership.save()
    }

    @MainActor
    func loadAccessoryThumbnails() async {
        guard accessoryDirectory.contains(where: { accessoryThumbnails[$0.id] == nil }) else { return }
        let images = await renderAccessoryThumbnails()
        for item in accessoryDirectory {
            if let image = images[item.id] ?? (item.id == "A07" ? images["A06"] : nil) {
                accessoryThumbnails[item.id] = image
            }
        }
    }
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
    @Published var petSize = DesktopPetSize.defaultValue
    @Published var visible = true
    @Published var temporarilyHidden = false
    var petIsVisible: Bool { visible && !temporarilyHidden }
    @Published var eyeFollow = true
    @Published var message = ""
    @Published var applying = false
    @Published var applyError: String?
    @Published private(set) var hasUnappliedAppearance = false
    @Published private(set) var applyConfirmed = false
    private var applyConfirmationExpiry: DispatchWorkItem?
    @Published var typingAnimationEnabled = false
    @Published var typingStatsEnabled = false
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
    @Published var hasPhotoResult = false
    @Published var photoEarMarks: [String: String] = [:]
    @Published var photoEarColors: [String: String] = [:]
    @Published var showsMeetingRecordings = false
    @Published var availableUpdateVersion: String?
    @Published var updateSessionInProgress = false
    @Published var checkUpdate: (() -> Void)?
    var installUpdate: () -> Void = {}
    var choosePreset: (String) -> Void = { _ in }
    var renderCoatThumbnails: () async -> [String: NSImage] = { [:] }
    var renderAccessoryThumbnails: () async -> [String: NSImage] = { [:] }
    var refresh: () -> Void = {}
    var apply: () -> Void = {}
    var reset: () -> Void = {}
    var setTypingAnimation: (Bool) -> Void = { _ in }
    var setTypingStats: (Bool) -> Void = { _ in }
    var setSelectionTranslation: (Bool) -> Void = { _ in }
    var openInputSettings: () -> Void = {}
    var openAccessibilitySettings: () -> Void = {}
    var setSize: (Double) -> Void = { _ in }
    var setVisibility: (Bool) -> Void = { _ in }
    var setEyeFollow: (Bool) -> Void = { _ in }
    @Published var renderingPreview = false
    @Published var exportingAppearance = false

    var canExportAppearance: Bool {
        catalog != nil && !renderingPreview && !exportingAppearance &&
            !choosingBreed && !loadingCustom && !editingCustom && !applying
    }

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
    var committedNameEdit = false
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

    func updateUnappliedAppearance(_ changed: Bool) {
        if hasUnappliedAppearance != changed { hasUnappliedAppearance = changed }
        if changed { clearApplyConfirmation() }
    }

    func confirmApply() {
        clearApplyConfirmation()
        message = ""
        applyConfirmed = true
        let expiry = DispatchWorkItem { [weak self] in self?.applyConfirmed = false }
        applyConfirmationExpiry = expiry
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5, execute: expiry)
    }

    func clearApplyConfirmation() {
        applyConfirmationExpiry?.cancel()
        if applyConfirmed { applyConfirmed = false }
    }

    func update(_ config: [String: Any]) {
        appearance = config.compactMapValues { $0 as? String }
        let photoParts = config["photoCoatParts"] as? [String] ?? []
        photoEarMarks = ["left", "right"].reduce(into: [:]) { marks, side in
            marks[side] = photoParts.first { $0.hasPrefix("ear-\(side)-") }
        }
        photoEarColors = config["photoEarColors"] as? [String: String] ?? [:]
        selectedFurPatchID = nil
        if let raw = config["furPatches"], let data = try? JSONSerialization.data(withJSONObject: raw),
           let patches = try? JSONDecoder().decode([FurPatch].self, from: data) {
            furPatches = patches
        } else {
            furPatches = []
        }
        if !nameDirty { nameText = appearance["name", default: ""] }
        resetUnavailablePreview()
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
        if nameDirty { committedNameEdit = true }
        nameDirty = false
        refresh()
    }

    func resetUnavailablePreview() {
        if appearance["frame"] != "CAT" {
            if action == "typing-gentle" || action == "typing-fast" { action = "typing" }
            if ["listening", "shredder", "zip", "convert"].contains(action) { action = "sit" }
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
            .font(WorkbenchTypography.body())
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
            .font(WorkbenchTypography.body())
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
                .font(WorkbenchTypography.body())
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
    case coat = "毛色与花纹"
    case face = "头部"
    case tail = "尾巴"
    case accessories = "配饰"
    case photo = "照片生成"
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

private enum EarEditScope: String, CaseIterable {
    case both, separate

    var title: String {
        switch self {
        case .both: "左右同时编辑"
        case .separate: "左右分别编辑"
        }
    }
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
                .font(WorkbenchTypography.body())
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

final class WorkbenchPreviewWebView: WKWebView {
    override var acceptsFirstResponder: Bool { false }
}

private enum PreviewBackdrop: String, CaseIterable, Identifiable {
    case warm, gray, light, dark

    var id: Self { self }

    var title: String {
        switch self {
        case .warm: "暖沙色"
        case .gray: "灰底"
        case .light: "浅底"
        case .dark: "深底"
        }
    }

    var color: Color {
        switch self {
        case .warm: Color(pixelHex: 0xECDFC3)
        case .gray: Color(pixelHex: 0xC5CAD0)
        case .light: Color(pixelHex: 0xF2F1EE)
        case .dark: Color(pixelHex: 0x424853)
        }
    }
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

enum WorkbenchLayout {
    static let defaultSize = CGSize(width: 880, height: 660)
    static let minimumSize = CGSize(width: 840, height: 620)
    static let outerInset: CGFloat = 16
    static let titlebarInset: CGFloat = 6
    static let panelGap: CGFloat = 12
    static let controlGap: CGFloat = 8
    static let tightGap: CGFloat = 4
    static let previewWidth: CGFloat = 352
    static let previewCanvasLimit: CGFloat = 288
    static let appearanceCardPadding: CGFloat = 4
    static let appearanceCardSpacing: CGFloat = 3
    static let breedLabelHeight: CGFloat = 18
    static let breedThumbnailHeight: CGFloat = 66
    static let fittedBreedPanelLimit: CGFloat = 520
}

struct WorkbenchView: View {
    @ObservedObject var state: WorkbenchState
    let preview: WKWebView
    let typingActivity: TypingActivity
    let meetingPage: ((PixelPalette) -> AnyView)?
    @AppStorage("workbenchTheme") private var workbenchTheme = WorkbenchTheme.sand
    @AppStorage(PetUserAddress.defaultsKey) private var savedUserAddress = ""
    @State private var userAddressDraft = ""
    @State private var isEditingUserAddress = false
    @State private var appearancePage = AppearancePage.breeds
    @State private var facePart = FacePart.ears
    @State private var earScope: EarEditScope?
    @State private var eyeScope: EyeEditScope?
    @State private var coatThumbnails: (key: CoatThumbnailKey, images: [String: NSImage])?
    @State private var showingGuide = false
    @State private var showingAccessoryShop = false
    @State private var showingFeedback = false
    @State private var feedbackDraft = FeedbackDraft()
    @State private var previewBackdrop = PreviewBackdrop.warm
    @State private var inspectingTransparency = false
    @State private var showingBackdropChoices = false
    @State private var showingTypingActions = false
    @State private var showingFileActions = false
    @State private var showingProfile = false
    @State private var showingDesktopSettings = false
    @State private var showingTypingSummary = false
    @State private var showingWorkbenchThemes = false

    private var palette: PixelPalette { workbenchTheme.palette }

    private var systemColorScheme: ColorScheme {
        NSApp.effectiveAppearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? .dark : .light
    }

    private var checkerPalette: PixelPalette { .workbench(systemColorScheme) }

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

    private let typingActions = [("typing-gentle", "慢速"), ("typing-fast", "快速"), ("typing", "极速")]
    private let fileActions = [("shredder", "碎纸机"), ("zip", "压缩"), ("convert", "格式转换")]

    private var typingIsSelected: Bool { typingActions.contains { $0.0 == state.action } }

    private var typingActionTitle: String {
        guard typingIsSelected, let speed = typingActions.first(where: { $0.0 == state.action })?.1 else {
            return "打字"
        }
        return "打字 · \(speed)"
    }

    private func selectPreviewAction(_ action: String) {
        state.action = action
        state.refresh()
    }

    private var showsMeetingPage: Bool {
        meetingPage != nil && state.showsMeetingRecordings
    }

    var body: some View {
        ZStack {
            palette.background.ignoresSafeArea()
            WorkbenchPixelSurface(palette: palette, fill: palette.background, corner: 9)
                .padding(8)
                .ignoresSafeArea()
            VStack(spacing: WorkbenchLayout.controlGap) {
                topBar
                ZStack {
                    VStack(spacing: WorkbenchLayout.panelGap) {
                        HStack(alignment: .top, spacing: WorkbenchLayout.panelGap) {
                            previewPanel
                            detailPane
                        }
                        .frame(maxHeight: .infinity)
                        footer
                    }
                    .opacity(showsMeetingPage ? 0 : 1)
                    .allowsHitTesting(!showsMeetingPage)
                    .accessibilityHidden(showsMeetingPage)

                    if showsMeetingPage, let meetingPage {
                        PixelPanel(palette: palette, padding: 0) {
                            meetingPage(palette)
                        }
                    }
                }
                .frame(maxHeight: .infinity)
            }
            .padding(.horizontal, WorkbenchLayout.outerInset)
            .padding(.top, WorkbenchLayout.titlebarInset)
            .padding(.bottom, WorkbenchLayout.panelGap)
        }
        .font(WorkbenchTypography.body())
        .environment(\.workbenchChrome, true)
        .environment(\.usesWorkbenchWindowTypography, true)
        .sheet(isPresented: $showingGuide) {
            WorkbenchGuideSheet(palette: palette, recordingAvailable: meetingPage != nil,
                                opensOnRecording: showsMeetingPage)
        }
        .sheet(isPresented: $showingAccessoryShop) {
            AccessoryShopSheet(state: state, theme: workbenchTheme)
        }
        .sheet(isPresented: $showingFeedback) {
            FeedbackSheet(draft: $feedbackDraft, palette: palette)
        }
        .environment(\.workbenchTheme, workbenchTheme)
        .preferredColorScheme(.light)
    }

    private var topBar: some View {
        HStack(spacing: WorkbenchLayout.controlGap) {
            helpMenu
            Button("商店") { showingAccessoryShop = true }
                .workbenchButton(palette: palette)
                .disabled(state.catalog == nil)
                .help("打开配饰商店")
                .accessibilityIdentifier("workbench-accessory-shop")
            if meetingPage != nil {
                pageNavigation.fixedSize()
            }
            Color.clear
                .frame(minWidth: 32, maxWidth: .infinity)
                .frame(height: 32)
                .overlay { WindowDragArea() }
                .accessibilityHidden(true)
            headerActions
                .fixedSize(horizontal: true, vertical: false)
        }
    }

    private var pageNavigation: some View {
        HStack(spacing: WorkbenchLayout.controlGap) {
            Button {
                state.showsMeetingRecordings = false
            } label: {
                entryLabel("外观设置", glyph: .workbenchCat, selected: !showsMeetingPage)
            }
            .workbenchButton(palette: palette, selected: !showsMeetingPage)
            .keyboardShortcut("1", modifiers: .command)
            .help("外观设置（⌘1）")
            .accessibilityAddTraits(showsMeetingPage ? [] : .isSelected)
            .accessibilityIdentifier("workbench-page-appearance")

            Button {
                state.showsMeetingRecordings = true
            } label: {
                entryLabel("会议录音", glyph: .workbenchRecord, selected: showsMeetingPage)
            }
            .workbenchButton(palette: palette, selected: showsMeetingPage)
            .keyboardShortcut("2", modifiers: .command)
            .help("会议录音（⌘2）")
            .accessibilityAddTraits(showsMeetingPage ? .isSelected : [])
            .accessibilityIdentifier("workbench-page-recording")
        }
    }

    private func entryLabel(_ title: String, glyph: PixelIconKind, selected: Bool = false) -> some View {
        HStack(spacing: 6) {
            PixelGlyph(kind: glyph, color: selected ? palette.accentDeep : palette.inkSoft, size: 12)
            Text(title)
        }
        .fixedSize()
    }

    private var workbenchThemeMenu: some View {
        Button {
            showingWorkbenchThemes.toggle()
        } label: {
            HStack(spacing: 6) {
                themeSwatch(workbenchTheme)
                Text("工作台配色")
                Image(systemName: "chevron.down").font(.system(size: 8, weight: .semibold))
            }
            .fixedSize()
        }
        .workbenchButton(palette: palette)
        .accessibilityIdentifier("workbench-theme")
        .accessibilityValue(workbenchTheme.title)
        .popover(isPresented: $showingWorkbenchThemes, arrowEdge: .bottom) {
            VStack(spacing: 5) {
                ForEach(WorkbenchTheme.allCases) { theme in
                    let selected = workbenchTheme == theme
                    Button {
                        showingWorkbenchThemes = false
                        workbenchTheme = theme
                    } label: {
                        HStack(spacing: 6) {
                            themeSwatch(theme)
                            Text(theme.title)
                            Spacer()
                            actionSelectionMark(selected)
                        }
                    }
                    .workbenchButton(palette: palette, selected: selected)
                    .accessibilityIdentifier("workbench-theme-\(theme.rawValue)")
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
            .frame(width: 150)
            .padding(9)
        }
    }

    private func themeSwatch(_ theme: WorkbenchTheme) -> some View {
        let colors = theme.palette
        return RoundedRectangle(cornerRadius: 2)
            .fill(colors.background)
            .overlay(RoundedRectangle(cornerRadius: 2).strokeBorder(colors.border, lineWidth: 1))
            .frame(width: 11, height: 11)
            .accessibilityHidden(true)
    }

    private var headerActions: some View {
        let hasUpdate = state.availableUpdateVersion != nil
        return HStack(spacing: WorkbenchLayout.controlGap) {
            if let version = state.availableUpdateVersion {
                Text("发现新版 \(version)")
                    .font(WorkbenchTypography.supporting())
                    .foregroundStyle(palette.ink)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .frame(maxWidth: 110)
                    .help("发现新版 \(version)")
                    .accessibilityIdentifier("workbench-available-update")
            }

            Button(hasUpdate ? "安装并重启" : "检查更新") {
                if hasUpdate {
                    state.installUpdate()
                } else {
                    state.checkUpdate?()
                }
            }
            .workbenchButton(palette: palette, prominent: hasUpdate)
            .disabled(!hasUpdate && (state.checkUpdate == nil || state.updateSessionInProgress))
            .accessibilityIdentifier(hasUpdate ? "workbench-install-update" : "workbench-check-update")

            if let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String {
                Text("v\(version)")
                    .font(WorkbenchTypography.supporting())
                    .foregroundStyle(palette.inkSoft)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .frame(maxWidth: 72)
                    .help("当前版本 v\(version)")
            }

            workbenchThemeMenu
        }
    }

    private var helpMenu: some View {
        Menu {
            Button("查看使用说明") { showingGuide = true }
                .accessibilityIdentifier("workbench-open-guide")
            Button("意见反馈") { showingFeedback = true }
                .accessibilityIdentifier("workbench-feedback")
        } label: {
            HStack(spacing: 6) {
                Text("帮助")
                Image(systemName: "chevron.down").font(.system(size: 8, weight: .semibold))
            }
            .fixedSize()
        }
        .menuStyle(.borderlessButton)
        .menuIndicator(.hidden)
        .workbenchButton(palette: palette)
        .fixedSize()
        .accessibilityIdentifier("workbench-help")
    }

    private var previewPanel: some View {
        let canvasInk = previewBackdrop == .dark && !inspectingTransparency ? Color.white :
            inspectingTransparency ? checkerPalette.ink : Color(pixelHex: 0x302A24)
        return VStack(alignment: .leading, spacing: WorkbenchLayout.controlGap) {
            HStack {
                Text("预览").font(WorkbenchTypography.sectionTitle)
                Spacer()
                exportPNGButton(id: "preview-export-png")
                previewBackdropControls
            }
            previewStage

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(state.appearance["name"].flatMap { $0.isEmpty ? nil : $0 } ?? "未命名")
                    .font(WorkbenchTypography.sectionTitle)
                    .lineLimit(1)
                if let breed = state.catalog?.presets.first(where: { $0.id == state.preset })?.name,
                   breed != state.appearance["name"] {
                    Text(breed).font(WorkbenchTypography.supporting()).lineLimit(1).opacity(0.8)
                }
                Spacer()
                Button("档案") { showingProfile.toggle() }
                    .workbenchButton(palette: palette)
                    .accessibilityIdentifier("workbench-profile")
                    .popover(isPresented: $showingProfile, arrowEdge: .bottom) {
                        namePanel.frame(width: 340).padding(10)
                    }
            }
            .foregroundStyle(canvasInk)

            previewActionControls
                .disabled(state.pixelEditor?.isFurOnly == true || (state.hasPhotoResult && state.editingCustom))
                .disabled(state.pixelEditor != nil || state.editingCustom || state.applying || state.loadingCustom)
        }
        .foregroundStyle(canvasInk)
        .padding(WorkbenchLayout.panelGap)
        .background {
            if inspectingTransparency {
                PixelChecker(even: checkerPalette.panelAlt, odd: checkerPalette.panelDeep, cell: 12)
            } else {
                previewBackdrop.color
            }
        }
        .clipShape(PixelBox(corner: 6))
        .overlay(PixelBox(corner: 6, inset: 0.5).stroke(palette.border, lineWidth: 1).allowsHitTesting(false))
        .frame(width: WorkbenchLayout.previewWidth)
    }

    private var previewStage: some View {
        let editing = state.pixelEditor != nil || state.customMode == .patches
        return GeometryReader { geometry in
            let side = max(1, min(WorkbenchLayout.previewCanvasLimit, geometry.size.width, geometry.size.height))
            SpritePreview(web: preview)
                .frame(width: side, height: side)
                .accessibilityLabel("桌宠动作预览")
                .overlay {
                    if let editor = state.pixelEditor {
                        PixelDrawingCanvas(model: editor, side: side, palette: palette)
                    } else if state.customMode == .patches, let patch = state.selectedFurPatch, state.action == "sit" {
                        FurPatchSelection(patch: patch, size: side, tint: palette.accent,
                                          change: state.adjustFurPatch)
                            .id(patch.id)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .allowsHitTesting(editing)
                .disabled(state.editingCustom || state.applying)
        }
    }

    private func exportPNGButton(id: String) -> some View {
        Button("导出 PNG") { state.exportAppearance() }
            .workbenchButton(palette: palette)
            .disabled(!state.canExportAppearance)
            .help("将当前预览画面导出为透明 PNG")
            .accessibilityLabel("导出 PNG")
            .accessibilityHint("将当前预览画面导出为透明 PNG")
            .accessibilityIdentifier(id)
    }

    private var previewBackdropControls: some View {
        Button {
            showingBackdropChoices.toggle()
        } label: {
            HStack(spacing: 6) {
                backdropSwatch(inspectingTransparency ? nil : previewBackdrop)
                Text("背景")
                Image(systemName: "chevron.down").font(.system(size: 8, weight: .semibold))
            }
        }
        .workbenchButton(palette: palette)
        .accessibilityIdentifier("preview-background")
        .accessibilityValue(inspectingTransparency ? "透明度检查" : previewBackdrop.title)
        .popover(isPresented: $showingBackdropChoices, arrowEdge: .bottom) {
            VStack(spacing: 5) {
                ForEach(PreviewBackdrop.allCases) { backdrop in
                    backdropChoice(backdrop.title, id: backdrop.rawValue, backdrop: backdrop,
                                   selected: !inspectingTransparency && previewBackdrop == backdrop) {
                        previewBackdrop = backdrop
                        inspectingTransparency = false
                    }
                }
                backdropChoice("透明度检查", id: "transparency", backdrop: nil, selected: inspectingTransparency) {
                    inspectingTransparency.toggle()
                }
            }
            .frame(width: 150)
            .padding(9)
        }
    }

    private func backdropChoice(_ title: String, id: String, backdrop: PreviewBackdrop?, selected: Bool,
                                change: @escaping () -> Void) -> some View {
        Button {
            change()
            showingBackdropChoices = false
        } label: {
            HStack(spacing: 6) {
                backdropSwatch(backdrop)
                Text(title)
                Spacer()
                actionSelectionMark(selected)
            }
        }
        .workbenchButton(palette: palette, selected: selected)
        .accessibilityIdentifier("preview-background-\(id)")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func backdropSwatch(_ backdrop: PreviewBackdrop?) -> some View {
        Group {
            if let backdrop {
                backdrop.color
            } else {
                PixelChecker(even: checkerPalette.panelAlt, odd: checkerPalette.panelDeep, cell: 3)
            }
        }
        .frame(width: 11, height: 11)
        .clipShape(RoundedRectangle(cornerRadius: 2))
        .overlay(RoundedRectangle(cornerRadius: 2).strokeBorder(palette.border, lineWidth: 1))
        .accessibilityHidden(true)
    }

    private var previewActionControls: some View {
        let cat = state.appearance["frame"] == "CAT"
        let fileActionTitle = fileActions.first(where: { $0.0 == state.action })?.1
        return HStack(spacing: WorkbenchLayout.tightGap) {
            previewActionButton("待机", action: "sit")
            if cat {
                previewActionMenu(typingActionTitle, id: "preview-action-typing-mode", selected: typingIsSelected,
                                  choices: typingActions, showing: $showingTypingActions)
                previewActionButton("听音乐", action: "listening")
                Spacer(minLength: 0)
                previewActionMenu(fileActionTitle ?? "文件动作", id: "preview-more-actions", selected: fileActionTitle != nil,
                                  choices: fileActions, showing: $showingFileActions)
            } else {
                previewActionButton("打字", action: "typing", id: "typing-mode")
                Spacer(minLength: 0)
            }
        }
        .padding(WorkbenchLayout.tightGap)
        .background(WorkbenchPixelSurface(palette: palette, fill: palette.panel, corner: 3))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("预览动作")
    }

    private func previewActionMenu(_ title: String, id: String, selected: Bool,
                                   choices: [(String, String)], showing: Binding<Bool>) -> some View {
        Button {
            showing.wrappedValue.toggle()
        } label: {
            HStack(spacing: 5) {
                actionSelectionMark(selected)
                Text(title)
                Image(systemName: "chevron.down").font(.system(size: 8, weight: .semibold))
            }
            .fixedSize()
        }
        .workbenchButton(palette: palette, selected: selected)
        .accessibilityIdentifier(id)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .popover(isPresented: showing, arrowEdge: .top) {
            VStack(alignment: .leading, spacing: 5) {
                ForEach(choices, id: \.0) { action, title in
                    previewActionButton(title, action: action) { showing.wrappedValue = false }
                }
            }
            .padding(9)
        }
    }

    private func previewActionButton(_ title: String, action: String, id: String? = nil,
                                     completion: (() -> Void)? = nil) -> some View {
        let selected = state.action == action
        return Button {
            selectPreviewAction(action)
            completion?()
        } label: {
            HStack(spacing: 5) {
                actionSelectionMark(selected)
                Text(title)
            }
            .fixedSize()
        }
        .workbenchButton(palette: palette, selected: selected)
        .accessibilityIdentifier("preview-action-\(id ?? action)")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    @ViewBuilder
    private func actionSelectionMark(_ selected: Bool) -> some View {
        if selected {
            Image(systemName: "checkmark")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(palette.accentDeep)
                .accessibilityHidden(true)
        }
    }

    private enum DetailAnchor {
        case customActions, pixelEditor
    }

    private var fitsBreedPanel: Bool {
        appearancePage == .breeds && !customExpanded && state.pixelEditor == nil
            && state.appearance["frame", default: "CAT"] == "CAT" && visiblePresets.count == 12
    }

    @ViewBuilder
    private var detailPane: some View {
        if state.catalog != nil {
            GeometryReader { viewport in
                let fittedHeight = fitsBreedPanel ? min(viewport.size.height, WorkbenchLayout.fittedBreedPanelLimit) : nil
                ScrollViewReader { scroll in
                    ScrollView(.vertical) {
                        Group {
                            if state.pixelEditor != nil {
                                PixelPanel(palette: palette) {
                                    pixelEditorControls.frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .id(DetailAnchor.pixelEditor)
                            } else {
                                appearancePanel(fittedHeight: fittedHeight)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .topLeading)
                        .padding(.bottom, fittedHeight == nil ? 6 : 0)
                    }
                    .onChange(of: customExpanded) { expanded in
                        if expanded { scroll.scrollTo(DetailAnchor.customActions, anchor: .bottom) }
                    }
                    .onChange(of: state.pixelEditor != nil) { editing in
                        if editing {
                            scroll.scrollTo(DetailAnchor.pixelEditor, anchor: .top)
                        } else if customExpanded {
                            scroll.scrollTo(DetailAnchor.customActions, anchor: .bottom)
                        }
                    }
                }
            }
        } else {
            PixelPanel(palette: palette) {
                VStack(spacing: 10) {
                    ProgressView()
                    Text("正在加载形象…")
                        .font(WorkbenchTypography.body())
                        .foregroundStyle(palette.inkSoft)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    private func sectionTab(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .workbenchButton(palette: palette, selected: selected)
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
                    .workbenchButton(palette: palette, prominent: editingProfile)
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
                                .font(WorkbenchTypography.supporting())
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
                                        .font(WorkbenchTypography.supporting())
                                        .foregroundStyle(palette.inkSoft)
                                }
                                if hasBirthDraft {
                                    Button("清除") { hasBirthDraft = false }
                                        .workbenchButton(palette: palette)
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
                                .font(WorkbenchTypography.body())
                                .foregroundStyle(state.appearance["name", default: ""].isEmpty ? palette.inkSoft : palette.ink)
                                .lineLimit(1)
                        }
                        HStack(spacing: 8) {
                            profileLabel("性别")
                            Text(genderText)
                                .font(WorkbenchTypography.body())
                                .foregroundStyle(state.gender == "none" ? palette.inkSoft : palette.ink)
                        }
                        HStack(spacing: 8) {
                            profileLabel("MBTI")
                            Text(state.mbti == "none" ? "未选择" : state.mbti)
                                .font(WorkbenchTypography.body())
                                .foregroundStyle(state.mbti == "none" ? palette.inkSoft : palette.ink)
                        }
                        HStack(spacing: 8) {
                            profileLabel("出生日期")
                            Text(birthText)
                                .font(WorkbenchTypography.body())
                                .monospacedDigit()
                                .foregroundStyle(state.birthDate == nil ? palette.inkSoft : palette.ink)
                            Spacer(minLength: 8)
                            Text("年龄 \(ageText)")
                                .font(WorkbenchTypography.supporting())
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
            .font(WorkbenchTypography.body())
            .foregroundStyle(palette.inkSoft)
            .fixedSize()
    }

    @State private var savingAppearance = false
    @State private var customName = ""

    @State private var customExpanded = false

    private var customAppearanceSection: some View {
        let count = state.customPresets.count
        return VStack(alignment: .leading, spacing: WorkbenchLayout.controlGap) {
            Button {
                customExpanded.toggle()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: customExpanded ? "chevron.down" : "chevron.right")
                        .font(.system(size: 10, weight: .semibold))
                        .frame(width: 10)
                        .accessibilityHidden(true)
                    Text("自定义外观")
                    if count > 0 {
                        Text(count.formatted())
                            .font(WorkbenchTypography.supporting())
                            .monospacedDigit()
                    }
                    Spacer(minLength: 0)
                }
                .foregroundStyle(palette.inkSoft)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .workbenchButton(palette: palette, quiet: true)
            .accessibilityLabel(customExpanded ? "收起自定义外观" : "展开自定义外观")
            .accessibilityValue(count > 0 ? "\(count) 个已保存形象" : "")
            .accessibilityIdentifier("custom-appearance-toggle")

            if customExpanded {
                HStack(spacing: WorkbenchLayout.controlGap) {
                    pixelEditorControls
                    Spacer(minLength: 0)
                    Button("存为形象") { savingAppearance.toggle() }
                        .workbenchButton(palette: palette)
                        .accessibilityIdentifier("save-custom-appearance")
                    exportPNGButton(id: "export-appearance")
                }
                .padding(.bottom, WorkbenchLayout.tightGap)
                .id(DetailAnchor.customActions)

                if savingAppearance && (appearancePage != .photo || !state.hasPhotoResult) {
                    saveAppearanceForm
                }
                if !state.customPresets.isEmpty || state.customSelected != nil || state.hasPendingBrush {
                    PixelDivider(palette: palette)
                    HStack {
                        Text(!state.customPresets.isEmpty ? "已保存形象" : "当前笔迹")
                            .font(WorkbenchTypography.supporting())
                            .foregroundStyle(palette.inkSoft)
                        Spacer()
                        if state.customSelected != nil || state.hasPendingBrush {
                            Button("取消笔迹叠加") { state.clearCustom() }
                                .workbenchButton(palette: palette)
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
                                    .font(WorkbenchTypography.supporting())
                            }
                            .frame(minWidth: 65, minHeight: 55)
                        }
                        .workbenchButton(palette: palette)
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
                            .workbenchButton(palette: palette)
                            .accessibilityLabel("移除补图 \(slot)")
                            .disabled(state.editingCustom || state.applying || state.pixelEditor != nil)
                        }
                    }
                }
            }
            if state.catPhotos[0] != nil {
                Button(state.generatingPhoto ? "正在生成…" : "生成桌宠") { state.generateFromCatPhoto() }
                    .workbenchButton(palette: palette, prominent: true)
                    .accessibilityIdentifier("cat-photo-generate")
                    .disabled(state.editingCustom || state.loadingCustom || state.applying || state.pixelEditor != nil)
            }
            Text(state.photoStatus.isEmpty
                 ? (CatPhotoClient.recognizesLocally ? "照片在本机识别。" : "点击生成后，照片会发送到云端识别。")
                    + "首图建议用正面照，可加两张同猫补图，拍清被挡住的部位。"
                 : state.photoStatus)
                .font(WorkbenchTypography.supporting())
                .foregroundStyle(palette.inkSoft)
                .accessibilityIdentifier("cat-photo-status")
            if state.hasPhotoResult {
                PixelDivider(palette: palette)
                Text("生成结果")
                    .font(WorkbenchTypography.sectionTitle)
                    .foregroundStyle(palette.ink)
                HStack(spacing: 8) {
                    Button("调整花纹与颜色") { appearancePage = .coat }
                        .workbenchButton(palette: palette)
                        .accessibilityIdentifier("photo-result-appearance")
                    Button("毛色画笔") { state.changeCustomMode(.brush) }
                        .workbenchButton(palette: palette, prominent: true)
                        .accessibilityIdentifier("photo-result-brush")
                    Button("存为形象") { savingAppearance.toggle() }
                        .workbenchButton(palette: palette)
                        .accessibilityIdentifier("photo-result-save")
                }
                if savingAppearance { saveAppearanceForm }
                if let catalog = state.catalog {
                    photoEarControls(catalog.fieldsByFrame["CAT"]?["ear"] ?? [], catalog: catalog)
                }
            }
        }
    }

    private func photoEarControls(_ shapes: [AppearanceOption], catalog: AppearanceCatalog) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            earShapeRow(shapes, identifierPrefix: "photo-ear-shape")
            DisclosureGroup("耳斑") {
                HStack(alignment: .top, spacing: 10) {
                    photoEarMark("画面左耳斑", side: "left", catalog: catalog)
                    photoEarMark("画面右耳斑", side: "right", catalog: catalog)
                }
                .padding(.top, 6)
            }
            .font(WorkbenchTypography.body())
            .foregroundStyle(palette.ink)
        }
    }

    private func earShapeControls(_ options: [AppearanceOption]) -> some View {
        let scope = earScope ?? (earShapeValue("left") == earShapeValue("right") ? .both : .separate)
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                ForEach(EarEditScope.allCases, id: \.self) { option in
                    sectionTab(option.title, selected: scope == option) { earScope = option }
                        .accessibilityIdentifier("ear-scope-\(option.rawValue)")
                }
                Spacer(minLength: 0)
            }
            if scope == .both {
                let mixed = "左右不同，选定后统一"
                let selection = Binding(
                    get: {
                        let left = earShapeValue("left")
                        return left == earShapeValue("right") ? left : ""
                    },
                    set: { value in
                        var appearance = state.appearance
                        appearance["ear"] = value
                        appearance["leftEar"] = value
                        appearance["rightEar"] = value
                        state.appearance = appearance
                        state.refresh()
                    }
                )
                VStack(alignment: .leading, spacing: 4) {
                    profileLabel("双耳耳型")
                    PixelSelect(options: options.map { ($0.id, $0.name) }, selection: selection,
                                palette: palette, placeholder: mixed)
                        .accessibilityLabel("双耳耳型")
                        .accessibilityValue(options.first { $0.id == selection.wrappedValue }?.name ?? mixed)
                        .accessibilityIdentifier("ear-shape-both")
                }
            } else {
                earShapeRow(options, identifierPrefix: "ear-shape")
            }
        }
    }

    private func earShapeValue(_ side: String) -> String {
        state.appearance["\(side)Ear"] ?? state.appearance["ear"] ?? "CE01"
    }

    private func earShapeRow(_ options: [AppearanceOption], identifierPrefix: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            earShape("画面左耳", side: "left", options: options, identifierPrefix: identifierPrefix)
            earShape("画面右耳", side: "right", options: options, identifierPrefix: identifierPrefix)
        }
    }

    private func earShape(_ title: String, side: String, options: [AppearanceOption],
                          identifierPrefix: String) -> some View {
        let key = "\(side)Ear"
        let selection = Binding(
            get: { earShapeValue(side) },
            set: { appearanceBinding(key).wrappedValue = $0 }
        )
        return VStack(alignment: .leading, spacing: 4) {
            profileLabel(title)
            PixelSelect(options: options.map { ($0.id, $0.name) }, selection: selection, palette: palette)
                .accessibilityLabel(title)
                .accessibilityValue(options.first { $0.id == selection.wrappedValue }?.name ?? "")
                .accessibilityIdentifier("\(identifierPrefix)-\(side)")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func photoEarMark(_ title: String, side: String, catalog: AppearanceCatalog) -> some View {
        let key = "\(side)Ear"
        let options = catalog.photoEarMarks[side] ?? []
        return VStack(alignment: .leading, spacing: 5) {
            profileLabel(title)
            PixelSelect(options: [("none", "无耳斑")] + options.map { ($0.id, $0.name) },
                        selection: Binding(get: { state.photoEarMarks[side] ?? "none" }, set: { mark in
                            state.photoEarMarks[side] = mark == "none" ? nil : mark
                            if mark != "none" && state.appearance[key] == nil {
                                state.appearance[key] = state.appearance["ear"] ?? "CE01"
                            }
                            state.refresh()
                        }), palette: palette)
                .accessibilityLabel(title)
                .accessibilityIdentifier("photo-ear-mark-\(side)")
            if state.photoEarMarks[side] != nil {
                PixelSelect(options: catalog.photoEarPigments.map { ($0.id, $0.name) },
                            selection: Binding(get: { state.photoEarColors[side] ?? "orange" }, set: {
                                state.photoEarColors[side] = $0
                                state.refresh()
                            }), palette: palette)
                    .accessibilityLabel(title + "颜色")
                    .accessibilityIdentifier("photo-ear-pigment-\(side)")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var saveAppearanceForm: some View {
        HStack(spacing: 8) {
            TextField("形象名称", text: $customName)
                .textFieldStyle(.roundedBorder)
                .onSubmit(saveCurrentAppearance)
                .accessibilityIdentifier("custom-appearance-name")
            Button("保存", action: saveCurrentAppearance)
                .workbenchButton(palette: palette, prominent: true)
                .disabled(customName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
    }

    private var pixelEditorControls: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let editor = state.pixelEditor {
                HStack {
                    if !editor.isFurOnly {
                        entryLabel("像素编辑器", glyph: .workbenchBrush, selected: true)
                        Spacer(minLength: 8)
                    } else {
                        Text("毛色画笔")
                            .font(WorkbenchTypography.sectionTitle)
                            .foregroundStyle(palette.ink)
                        Spacer(minLength: 8)
                    }
                    Button("完成编辑") { state.changeCustomMode(nil) }
                        .workbenchButton(palette: palette, prominent: editor.isFurOnly)
                        .accessibilityIdentifier("finish-pixel-editing")
                }
                PixelEditorTools(model: editor, palette: palette)
                Text(editor.isFurOnly
                     ? "点小地图切换部位。画笔只改可见毛发，恢复原毛色可擦掉笔迹。"
                     : "点小地图切换部位，在左侧逐格点绘。完成编辑后可预览动作。")
                    .font(WorkbenchTypography.supporting())
                    .foregroundStyle(palette.inkSoft)
            } else {
                Button {
                    state.changeCustomMode(.brush)
                } label: {
                    entryLabel("像素编辑器", glyph: .workbenchBrush)
                }
                .workbenchButton(palette: palette)
                .accessibilityIdentifier("custom-appearance-brush")
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
                    .font(WorkbenchTypography.body())
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
    private func appearancePanel(fittedHeight: CGFloat?) -> some View {
        if let catalog = state.catalog {
            let frame = state.appearance["frame", default: "CAT"]
            let optionGroup = frame == "CAT" && state.appearance["palette"] == "CC01" ? "CAT_ORANGE" : frame
            let fields = catalog.fieldsByFrame[optionGroup] ?? [:]
            let markings = catalog.fieldsByFrame["CAT_MARKINGS"] ?? [:]
            let canChooseFaceBase = catalog.faceBasePalettes.contains(state.appearance["palette", default: "CC01"])

            PixelPanel(palette: palette, padding: 12) {
                VStack(alignment: .leading, spacing: WorkbenchLayout.controlGap) {
                    Group {
                        if frame == "CAT" {
                            VStack(alignment: .leading, spacing: WorkbenchLayout.controlGap) {
                                HStack(alignment: .center, spacing: 6) {
                                    PixelGlyph(kind: .workbenchCat, color: palette.accentDeep, size: 12)
                                    Text("外观")
                                        .font(WorkbenchTypography.sectionTitle)
                                        .foregroundStyle(palette.ink)
                                }
                                .accessibilityElement(children: .combine)
                                .accessibilityAddTraits(.isHeader)
                                .accessibilityIdentifier("workbench-appearance-heading")
                                appearanceNavigation
                                Divider()
                                if appearancePage == .face { faceNavigation }
                                appearanceContent(fields: fields, markings: markings, canChooseFaceBase: canChooseFaceBase,
                                                  fitsBreedGrid: fittedHeight != nil)
                                    .disabled(state.choosingBreed && appearancePage != .breeds)
                                    .frame(maxWidth: .infinity, alignment: .topLeading)
                            }
                            .onChange(of: state.preset) { _ in
                                earScope = nil
                                eyeScope = nil
                            }
                            .onChange(of: state.customSelected) { _ in earScope = nil }
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
                    .disabled(state.editingCustom || state.loadingCustom)
                    PixelDivider(palette: palette)
                    customAppearanceSection
                }
            }
            .frame(height: fittedHeight)
        }
    }

    private var appearanceNavigation: some View {
        HStack(spacing: 4) {
            ForEach(AppearancePage.allCases.filter { $0 != .photo }, id: \.self) { page in
                if page == .coat {
                    Rectangle().fill(palette.borderSoft).frame(width: 1, height: 18)
                        .padding(.horizontal, 2)
                }
                sectionTab(page.rawValue, selected: appearancePage == page) {
                    if appearancePage != page {
                        earScope = nil
                        eyeScope = nil
                    }
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
                    if facePart != part {
                        earScope = nil
                        eyeScope = nil
                    }
                    facePart = part
                }
                .accessibilityIdentifier("appearance-\(part)")
            }
            Spacer(minLength: 0)
        }
    }

    @ViewBuilder
    private func breedGrid(fillsPanel: Bool) -> some View {
        let presets = visiblePresets
        let preferredRows = [
            ["preset_cat_black", "preset_cat_CC09", "preset_cat_orange", "preset_cat_british_blue"],
            ["preset_cat_american_shorthair", "preset_cat_CC11", "preset_cat_siamese", "preset_cat_ragdoll"],
            ["preset_cat_li_hua", "preset_cat_CC10", "preset_cat_calico", "preset_cat_CC12"],
        ]
        let arrangedIDs = Set(preferredRows.joined())
        let rows = (preferredRows.map { row in
            row.compactMap { id in presets.first { $0.id == id } }
        } + [presets.filter { !arrangedIDs.contains($0.id) }]).filter { !$0.isEmpty }

        if fillsPanel {
            GeometryReader { grid in
                let rowCount = CGFloat(rows.count)
                let rowSpacing = WorkbenchLayout.controlGap * (rowCount - 1)
                let cardChrome = WorkbenchLayout.breedLabelHeight + WorkbenchLayout.appearanceCardSpacing
                    + WorkbenchLayout.appearanceCardPadding * 2
                let imageHeight = (grid.size.height - rowSpacing) / rowCount - cardChrome
                breedRows(rows, imageHeight: max(WorkbenchLayout.breedThumbnailHeight, imageHeight))
            }
        } else {
            breedRows(rows, imageHeight: WorkbenchLayout.breedThumbnailHeight)
        }
    }

    private func breedRows(_ rows: [[AppearancePreset]], imageHeight: CGFloat) -> some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: WorkbenchLayout.controlGap), count: 4)
        return VStack(spacing: WorkbenchLayout.controlGap) {
            ForEach(rows.indices, id: \.self) { index in
                LazyVGrid(columns: columns, spacing: WorkbenchLayout.controlGap) {
                    ForEach(rows[index], id: \.id) { preset in
                        appearanceCard(preset.name, image: state.thumbnails?.breeds[preset.id],
                                       selected: state.preset == preset.id, imageHeight: imageHeight,
                                       labelHeight: WorkbenchLayout.breedLabelHeight) {
                            state.choosePreset(preset.id)
                        }
                        .accessibilityIdentifier("breed-\(preset.id)")
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func appearanceContent(
        fields: [String: [AppearanceOption]], markings: [String: [AppearanceOption]],
        canChooseFaceBase: Bool, fitsBreedGrid: Bool
    ) -> some View {
        switch appearancePage {
        case .breeds:
            breedGrid(fillsPanel: fitsBreedGrid)
        case .face:
            switch facePart {
            case .ears:
                VStack(alignment: .leading, spacing: 11) {
                    if state.hasPhotoResult, let catalog = state.catalog {
                        photoEarControls(fields["ear"] ?? [], catalog: catalog)
                    } else if let shapes = fields["ear"] {
                        earShapeControls(shapes)
                    }
                    if let colors = fields["earColor"] {
                        fieldPicker(title: "内耳色", key: "earColor", options: colors,
                                    defaultSwatch: WBTheme.swatchColors(naturalSwatches["earColor"].map { [$0] }))
                    }
                }
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
                if let options = fields["coat"] { extraCoatPicker(options: options, palettes: fields["palette"] ?? []) }
                DisclosureGroup("细调花纹") {
                    markingsControls(fields, markings, canChooseFaceBase: canChooseFaceBase)
                        .padding(.top, 8)
                }
                .font(WorkbenchTypography.body())
                .foregroundStyle(palette.ink)
            }
        case .tail:
            if let options = fields["tail"] { partChoices("尾形", key: "tail", options: options, imageHeight: 88) }
        case .accessories:
            VStack(alignment: .leading, spacing: 11) {
                if let headAccessories = fields["accessory"] {
                    HStack(alignment: .top, spacing: 10) {
                        headAccessoryPicker(title: "帽子", category: "hat", options: headAccessories)
                        headAccessoryPicker(title: "发饰", category: "hair", options: headAccessories)
                    }
                    Text("帽子和发饰共用一个佩戴位置，只能选一件。")
                        .font(WorkbenchTypography.body())
                        .foregroundStyle(palette.inkSoft)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let eyeAccessories = fields["eyeAccessory"] {
                    HStack(alignment: .top, spacing: 10) {
                        accessoryPicker(title: "眼部配饰", key: "eyeAccessory", options: eyeAccessories)
                        accessorySidePicker(key: "eyeAccessory", title: "眼罩位置", part: "眼", options: eyeAccessories)
                    }
                }
                if let colors = fields["headphoneColor"] {
                    fieldPicker(title: "听歌耳机颜色", key: "headphoneColor", options: colors, defaultSwatch: [])
                }
            }
        case .photo:
            photoGenerator
        }
    }

    private var currentCoatCards: [AppearanceOption] {
        state.catalog?.coatCards[state.appearance["palette", default: "CC01"]] ?? []
    }

    private var ownPaletteCoat: String {
        "breed:\(state.appearance["palette", default: "CC01"])"
    }

    private var selectedCoat: String {
        let coat = state.appearance["coat", default: ""]
        return coat == ownPaletteCoat ? "native" : coat
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
                    appearanceCard(coat.name, image: images?[coat.id], selected: selectedCoat == coat.id,
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
            VStack(spacing: WorkbenchLayout.appearanceCardSpacing) {
                ZStack {
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
                    .font(WorkbenchTypography.supporting(selected ? .semibold : .regular))
                    .foregroundStyle(palette.ink)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(height: labelHeight)
            }
            .padding(WorkbenchLayout.appearanceCardPadding)
            .frame(maxWidth: .infinity)
            .overlay(alignment: .topTrailing) {
                if selected {
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 13))
                        .foregroundStyle(palette.accentDeep).padding(7).accessibilityHidden(true)
                }
            }
        }
        .workbenchButton(palette: palette, selected: selected, card: true)
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
            .font(WorkbenchTypography.supporting())
            HStack(spacing: 7) {
                Button("翻转") { editFurPatch(patch) { $0.flipped.toggle() } }
                Button("镜像复制") { state.mirrorFurPatch(patch) }
                    .disabled(state.furPatches.count >= catalog.furPatchLimit)
                Button("删除") { state.removeFurPatch(patch.id) }
                Spacer(minLength: 0)
                Button("收起选框") { state.selectFurPatch(nil) }
            }
            .workbenchButton(palette: palette, selected: false)
            Text(state.action == "sit" ? "拖选框移动，拖方块调宽高。" : "切回待机可继续在预览上拖动。")
                .font(WorkbenchTypography.supporting())
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

    private func staticField(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(WorkbenchTypography.body())
                .foregroundStyle(palette.inkSoft)
            Text(value)
                .font(WorkbenchTypography.body())
                .foregroundStyle(palette.inkSoft)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 10)
                .padding(.vertical, 10)
                .background(PixelBox(corner: 3).fill(palette.panelAlt))
                .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1))
        }
        .accessibilityElement(children: .combine)
    }

    private func headAccessoryPicker(title: String, category: String, options: [AppearanceOption]) -> some View {
        let categoryOptions = options.filter { $0.id == "A00" || $0.accessoryCategory == category }
        return VStack(alignment: .leading, spacing: 8) {
            accessoryPicker(title: title, key: "accessory", options: categoryOptions,
                            controlID: "\(category)-accessory-picker")
            accessorySidePicker(key: "accessory", title: "\(title)位置", part: "耳", options: categoryOptions)
        }
    }

    private func accessoryPicker(
        title: String, key: String, options: [AppearanceOption], controlID: String? = nil
    ) -> some View {
        let choices = options.filter { $0.id == "A00" || state.ownsAccessory($0.id) }
        let selection = Binding(
            get: {
                let worn = state.appearance[key, default: "A00"]
                return choices.contains { $0.id == worn } ? worn : "A00"
            },
            set: { value in
                // Clearing a hat must not take off an item worn in the hair category (or vice versa).
                let worn = state.appearance[key, default: "A00"]
                guard value != worn, value != "A00" || options.contains(where: { $0.id == worn }) else { return }
                var appearance = state.appearance
                appearance[key] = value
                appearance.removeValue(forKey: "\(key)Side")
                state.appearance = appearance
                state.refresh()
            }
        )
        return fieldPicker(title: title, key: key, options: choices, selection: selection, controlID: controlID)
    }

    @ViewBuilder
    private func accessorySidePicker(key: String, title: String, part: String, options: [AppearanceOption]) -> some View {
        let worn = state.appearance[key, default: "A00"]
        if let original = options.first(where: { $0.id == worn })?.accessorySide, state.ownsAccessory(worn) {
            let sideKey = "\(key)Side"
            let selection = Binding(
                get: { state.appearance[sideKey, default: original] },
                set: { side in
                    state.appearance[sideKey] = side == original ? nil : side
                    state.refresh()
                }
            )
            fieldPicker(title: title, key: sideKey, options: [
                AppearanceOption(id: "left", name: "画面左\(part)", colors: nil),
                AppearanceOption(id: "right", name: "画面右\(part)", colors: nil),
            ], selection: selection)
        }
    }

    private func fieldPicker(
        title: String, key: String, options: [AppearanceOption], defaultSwatch: [Color]? = nil,
        selection: Binding<String>? = nil, controlID: String? = nil
    ) -> some View {
        let binding = selection ?? appearanceBinding(key)
        let accessibilityID = switch key {
        case "eyeColor": "eye-color-picker"
        case "earColor": "ear-color-picker"
        case "noseColor": "nose-color-picker"
        case "headphoneColor": "headphone-color-picker"
        default: "\(key)-picker"
        }
        return VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(WorkbenchTypography.body())
                .foregroundStyle(palette.inkSoft)
            Group {
                if let defaultSwatch {
                    PixelColorSelect(title: title, options: options, defaultSwatch: defaultSwatch,
                                     palette: palette, selection: binding)
                } else {
                    PixelSelect(options: options.map { (id: $0.id, name: $0.name) },
                                selection: binding, palette: palette)
                        .accessibilityLabel(title)
                }
            }
            .accessibilityIdentifier(controlID ?? accessibilityID)
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
                        .workbenchButton(palette: palette)
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

    private func extraCoatPicker(options: [AppearanceOption], palettes: [AppearanceOption]) -> some View {
        let curatedIDs = Set(state.catalog?.coatCards.values.flatMap { $0.dropFirst().map(\.id) } ?? [])
        let original = currentCoatCards.first?.id
        let nativeColors = palettes.first { $0.id == state.appearance["palette"] }?.colors
        let extras = options.filter { $0.id != original && $0.id != ownPaletteCoat && !curatedIDs.contains($0.id) }.map { option in
            option.id == "native" ? AppearanceOption(id: option.id, name: "底稿色", colors: nativeColors) : option
        }
        let ordered = extras.filter { !$0.id.hasPrefix("breed:") } + extras.filter { $0.id.hasPrefix("breed:") }
        return VStack(alignment: .leading, spacing: 3) {
            profileLabel("特别毛色")
            PixelColorSelect(title: "特别毛色", options: ordered, defaultSwatch: [], palette: palette,
                             selection: Binding(get: { selectedCoat }, set: { appearanceBinding("coat").wrappedValue = $0 }),
                             mixedName: "选择特别毛色")
                .accessibilityIdentifier("coat-picker")
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func paletteRow(options: [AppearanceOption]) -> some View {
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text("毛色")
                    .font(WorkbenchTypography.body())
                    .foregroundStyle(palette.inkSoft)
                if let selected = options.first(where: { $0.id == state.appearance["palette"] }) {
                    Text(selected.name)
                        .font(WorkbenchTypography.body())
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
        PixelPanel(palette: palette, padding: WorkbenchLayout.controlGap) {
            HStack(spacing: WorkbenchLayout.controlGap) {
                Button {
                    showingDesktopSettings.toggle()
                } label: {
                    entryLabel("桌面设置", glyph: .workbenchSettings)
                }
                    .workbenchButton(palette: palette)
                    .accessibilityIdentifier("workbench-desktop-settings")
                    .popover(isPresented: $showingDesktopSettings, arrowEdge: .top) {
                        desktopSettings.padding(WorkbenchLayout.panelGap).frame(width: 290)
                            .background(WorkbenchPixelSurface(palette: palette, fill: palette.panel, framed: true))
                    }
                    .onChange(of: showingDesktopSettings) { open in
                        if !open {
                            showingTypingSummary = false
                            discardUserAddressEdit()
                        }
                    }
                Text("桌宠大小").font(WorkbenchTypography.supporting()).foregroundStyle(palette.inkSoft)
                Slider(value: $state.petSize, in: DesktopPetSize.range)
                    .frame(width: 115)
                    .tint(palette.accentDeep)
                    .accessibilityLabel("桌宠大小")
                    .onChange(of: state.petSize) { state.setSize($0) }
                Text("\(Int(state.petSize)) px")
                    .font(WorkbenchTypography.supporting()).monospacedDigit()
                    .foregroundStyle(palette.inkSoft)
                    .fixedSize()
                Spacer(minLength: 8)
                if let editor = state.pixelEditor {
                    WorkbenchBrushStatus(editor: editor) { applyStatus(brushChanged: $0) }
                } else {
                    applyStatus(brushChanged: false)
                }
                applyButton
            }
        }
    }

    private var desktopSettings: some View {
        VStack(alignment: .leading, spacing: WorkbenchLayout.controlGap) {
            userAddressField
            Divider()
            Toggle("显示桌宠", isOn: Binding(get: { state.petIsVisible }, set: state.setVisibility))
            Toggle("眼神跟随", isOn: $state.eyeFollow)
                .accessibilityIdentifier("eye-follow-toggle")
                .help("让猫咪眼睛的小高光跟随鼠标方向")
                .onChange(of: state.eyeFollow) { state.setEyeFollow($0) }
            Toggle("打字动画", isOn: Binding(get: { state.typingAnimationEnabled }, set: state.setTypingAnimation))
                .help("按键时让桌面上的小猫打字，需要输入监控")
                .accessibilityIdentifier("typing-animation-toggle")
            Toggle("本地打字统计", isOn: Binding(get: { state.typingStatsEnabled }, set: state.setTypingStats))
                .help("在本机记录活跃打字时长和按键次数，需要输入监控")
                .accessibilityIdentifier("typing-stats-toggle")
            DisclosureGroup(isExpanded: $showingTypingSummary) {
                TypingActivitySummary(activity: typingActivity, palette: palette)
                    .padding(.top, WorkbenchLayout.tightGap)
            } label: {
                Text("今日打字统计")
            }
            .accessibilityIdentifier("typing-stats-disclosure")
            .onChange(of: showingTypingSummary) { expanded in
                if expanded { typingActivity.refreshToday() }
            }
            Text(state.typingStatus.text)
                .font(WorkbenchTypography.supporting())
                .foregroundStyle(palette.inkSoft)
            Toggle("划词翻译", isOn: Binding(get: { state.selectionTranslationEnabled }, set: state.setSelectionTranslation))
                .disabled(!TranslationEngine.isAvailable)
                .help(TranslationEngine.isAvailable ? "选中英文后显示翻译按钮，需要辅助功能权限" : "需要 macOS 15 或更新版本")
                .accessibilityIdentifier("selection-translation-toggle")
            Divider()
            if state.typingStatus == .needsPermission {
                Button("输入监控设置", action: state.openInputSettings)
                    .workbenchButton(palette: palette)
            }
            if state.translationNeedsPermission {
                Button("辅助功能设置", action: state.openAccessibilitySettings)
                    .workbenchButton(palette: palette)
            }
            Button("归位", action: state.reset)
                .workbenchButton(palette: palette)
                .help("将桌宠移回屏幕")
        }
        .toggleStyle(.checkbox)
        .tint(palette.accent)
        .font(WorkbenchTypography.body())
    }

    private var userAddressField: some View {
        let address = isEditingUserAddress ? PetUserAddress.normalized(userAddressDraft) : savedUserAddress
        return VStack(alignment: .leading, spacing: 5) {
            Text("小猫怎么称呼你")
                .foregroundStyle(palette.ink)
            HStack(spacing: 8) {
                if isEditingUserAddress {
                    UserAddressInput(text: $userAddressDraft, palette: palette, onSubmit: commitUserAddress)
                    Button("保存", action: commitUserAddress)
                        .workbenchButton(palette: palette)
                        .accessibilityIdentifier("pet-user-address-save")
                } else {
                    Text(verbatim: address.isEmpty ? "未设置" : address)
                        .foregroundStyle(address.isEmpty ? palette.inkSoft : palette.ink)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .accessibilityIdentifier("pet-user-address-value")
                    Button("编辑", action: beginUserAddressEdit)
                        .workbenchButton(palette: palette)
                        .accessibilityIdentifier("pet-user-address-edit")
                }
            }
            Text(verbatim: "专注完成时 · " + PetUserAddress.focusFinishedMessage(address: address))
                .font(WorkbenchTypography.supporting())
                .foregroundStyle(palette.inkSoft)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("pet-user-address-example")
        }
    }

    private struct UserAddressInput: View {
        @Binding var text: String
        let palette: PixelPalette
        let onSubmit: () -> Void
        @FocusState private var focused: Bool

        var body: some View {
            PixelTextField(text: $text, placeholder: "例如：阿澄", palette: palette)
                .focused($focused)
                .accessibilityLabel("小猫怎么称呼你")
                .accessibilityIdentifier("pet-user-address")
                .onSubmit(onSubmit)
                .onAppear {
                    DispatchQueue.main.async { focused = true }
                }
        }
    }

    private func beginUserAddressEdit() {
        userAddressDraft = savedUserAddress
        isEditingUserAddress = true
    }

    private func commitUserAddress() {
        guard isEditingUserAddress else { return }
        let address = PetUserAddress.normalized(userAddressDraft)
        if savedUserAddress != address { savedUserAddress = address }
        discardUserAddressEdit()
    }

    private func discardUserAddressEdit() {
        isEditingUserAddress = false
        userAddressDraft = ""
    }

    @ViewBuilder
    private func applyStatus(brushChanged: Bool) -> some View {
        let error = state.applyError ?? (state.message.contains("无法") || state.message.contains("失败")
            || state.message.hasPrefix("请输入") ? state.message : nil)
        let pending = brushChanged || state.hasUnappliedAppearance
        let applied = state.applyConfirmed && !pending && error == nil && !state.applying && !state.loadingCustom
        let message = if state.applying {
            "正在应用当前外观…"
        } else if state.loadingCustom {
            "正在载入自定义形象…"
        } else if let error {
            error
        } else if pending {
            "有改动待应用"
        } else if applied {
            "已应用"
        } else {
            state.message
        }

        if !message.isEmpty {
            let failed = message == error
            HStack(spacing: 5) {
                if applied || failed {
                    Image(systemName: applied ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundStyle(applied ? palette.green : palette.red)
                        .accessibilityHidden(true)
                }
                Text(message)
                    .font(WorkbenchTypography.supporting(applied || failed ? .semibold : .regular))
                    .foregroundStyle(applied || failed ? palette.ink : palette.inkSoft)
                    .lineLimit(1)
                    .help(message)
                    .accessibilityIdentifier("workbench-apply-status")
            }
        }
    }

    private var applyButton: some View {
        let disabled = state.catalog == nil || state.applying || state.loadingCustom || state.editingCustom || state.choosingBreed
        return Button {
            state.apply()
        } label: {
            HStack(spacing: 5) {
                if state.applying {
                    ProgressView().controlSize(.mini).frame(width: 12, height: 12).accessibilityHidden(true)
                } else {
                    PixelGlyph(kind: .workbenchApply, color: disabled ? palette.inkSoft : Color(pixelHex: 0xFFF9EC), size: 12)
                }
                Text("应用到桌宠")
            }
            .fixedSize()
        }
        .workbenchButton(palette: palette, prominent: true)
        .disabled(disabled)
        .keyboardShortcut(.defaultAction)
        .accessibilityIdentifier("workbench-apply")
    }

    private func appearanceBinding(_ key: String) -> Binding<String> {
        Binding(get: { state.appearance[key, default: key == "headphoneColor" ? "natural" : ""] }, set: { value in
            state.appearance[key] = value
            if key == "headphoneColor" { state.action = "listening" }
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
        HStack(spacing: WorkbenchLayout.controlGap) {
            metric("今日活跃时长", value: duration)
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
                .font(WorkbenchTypography.supporting())
                .foregroundStyle(palette.inkSoft)
            Text(value)
                .font(WorkbenchTypography.body(.semibold)).monospacedDigit()
                .foregroundStyle(palette.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

private struct WorkbenchBrushStatus<Content: View>: View {
    @ObservedObject var editor: PixelEditorModel
    @ViewBuilder let content: (Bool) -> Content

    var body: some View { content(editor.hasChanges) }
}
