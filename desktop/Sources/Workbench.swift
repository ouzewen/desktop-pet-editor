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

struct AppearanceCatalog: Decodable {
    let fieldsByFrame: [String: [String: [AppearanceOption]]]
    let presets: [AppearancePreset]
    let faceBasePalettes: Set<String>

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

enum TypingSyncStatus {
    case checking, needsPermission, unavailable, active

    var text: String {
        switch self {
        case .checking: return "正在检查打字同步"
        case .needsPermission: return "请授权输入监控以同步打字"
        case .unavailable: return "打字同步未连接，正在重试"
        case .active: return "全局打字同步已开启"
        }
    }

    var buttonTitle: String {
        self == .needsPermission ? "开启打字同步" : "检查打字同步"
    }
}

final class WorkbenchState: ObservableObject {
    @Published var catalog: AppearanceCatalog?
    @Published var appearance: [String: String] = [:]
    @Published var preset = "preset_cat_orange"
    @Published var action = "sit"
    @Published var petSize: Double = 240
    @Published var visible = true
    @Published var eyeFollow = true
    @Published var message = ""
    @Published var applying = false
    @Published var typingStatus = TypingSyncStatus.checking
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
    @Published var openingPixelEditor = false
    var choosePreset: (String) -> Void = { _ in }
    var refresh: () -> Void = {}
    var apply: () -> Void = {}
    var reset: () -> Void = {}
    var enableTyping: () -> Void = {}
    var setSize: (Double) -> Void = { _ in }
    var setVisibility: (Bool) -> Void = { _ in }
    var setEyeFollow: (Bool) -> Void = { _ in }
    var openPixelEditor: () -> Void = {}
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
        if !nameDirty { nameText = appearance["name", default: ""] }
        resetUnavailablePreview()
        refresh()
    }

    func commitName() {
        let trimmed = String(nameText.prefix(8))
        nameText = trimmed
        appearance["name"] = trimmed
        nameDirty = false
        refresh()
    }

    func resetUnavailablePreview() {
        if appearance["frame"] != "CAT" && (action == "typing-gentle" || action == "typing-fast") { action = "typing" }
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
    @State private var isPresented = false

    private var currentName: String {
        options.first { $0.id == selection }?.name ?? options.first?.name ?? ""
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

private struct PupilColorPicker: View {
    let title: String
    let side: String
    let colors: [AppearanceOption]
    let naturalSwatches: [String: String]
    let palette: PixelPalette
    @Binding var layers: String
    @Binding var outer: String
    @Binding var inner: String
    @State private var isPresented = false

    private var isDouble: Bool { layers == "round" }
    private let colorColumns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 4)

    private var summary: String {
        let outerName = colors.first { $0.id == outer }?.name ?? "原色"
        let innerName = colors.first { $0.id == inner }?.name ?? "原色"
        return isDouble ? "双瞳 · \(outerName) / \(innerName)" : "单瞳 · \(outerName)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            Button {
                isPresented.toggle()
            } label: {
                HStack(spacing: 4) {
                    Text(summary)
                    Spacer(minLength: 4)
                    PixelGlyph(kind: .chevron, color: palette.inkSoft, size: 10)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(PixelButtonStyle(palette: palette))
            .accessibilityLabel(title)
            .accessibilityValue(summary)
            .accessibilityIdentifier("\(side)-eye-pupil-picker")
            .popover(isPresented: $isPresented, arrowEdge: .top) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 6) {
                        modeButton("单瞳", value: "none")
                        modeButton("双瞳", value: "round")
                    }
                    colorGrid(isDouble ? "外层瞳色" : "瞳色", id: "outer", selection: $outer,
                              naturalKey: isDouble ? "eyeColor" : "singleEyeColor")
                    if isDouble {
                        colorGrid("内层瞳色", id: "inner", selection: $inner, naturalKey: "innerEyeColor")
                    }
                }
                .padding(12)
                .frame(width: 380)
                .background(palette.panel)
            }
        }
    }

    private func modeButton(_ title: String, value: String) -> some View {
        Button {
            layers = value
        } label: {
            Text(title).frame(maxWidth: .infinity)
        }
        .buttonStyle(PixelButtonStyle(palette: palette, prominent: layers == value))
        .accessibilityAddTraits(layers == value ? .isSelected : [])
        .accessibilityIdentifier("\(side)-eye-mode-\(value)")
    }

    private func colorGrid(_ title: String, id: String, selection: Binding<String>, naturalKey: String) -> some View {
        let defaultSwatch = WBTheme.swatchColors(naturalSwatches[naturalKey].map { [$0] })
        return VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            LazyVGrid(columns: colorColumns, alignment: .leading, spacing: 6) {
                ForEach(colors, id: \.id) { option in
                    Button {
                        selection.wrappedValue = option.id
                    } label: {
                        ColorOptionLabel(option: option, defaultSwatch: defaultSwatch, palette: palette, size: 10)
                    }
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: selection.wrappedValue == option.id))
                    .accessibilityLabel("\(title) \(option.name)")
                    .accessibilityAddTraits(selection.wrappedValue == option.id ? .isSelected : [])
                    .accessibilityIdentifier("\(side)-eye-\(id)-\(option.id)")
                }
            }
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

struct WorkbenchView: View {
    @ObservedObject var state: WorkbenchState
    let preview: WKWebView
    let typingActivity: TypingActivity
    @Environment(\.colorScheme) private var colorScheme

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
            return [("sit", "待机"), ("typing-gentle", "慢敲键盘"), ("typing-fast", "比较快"), ("typing", "特别快")]
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

    private var previewPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(spacing: 10) {
                ZStack {
                    PixelChecker(even: palette.panelAlt, odd: palette.panelDeep, cell: 12)
                    SpritePreview(web: preview)
                        .frame(width: 300, height: 300)
                        .accessibilityLabel("桌宠动作预览")
                }
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
                    }
                }

                TypingActivitySummary(activity: typingActivity, palette: palette)
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

    private var frameBadge: some View {
        Text(state.appearance["frame"] == "CAT" ? "猫" : "犬")
            .font(PixelFont.font(12))
            .foregroundStyle(palette.inkSoft)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(PixelBox(corner: 1).fill(palette.panelAlt.opacity(0.92)))
            .overlay(PixelBox(corner: 1).stroke(palette.border, lineWidth: 2))
    }

    @ViewBuilder
    private var detailPane: some View {
        if state.catalog != nil {
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 12) {
                    namePanel
                    breedPanel
                    appearancePanel
                    customPanel
                }
                .frame(maxWidth: .infinity)
                .padding(.bottom, 6)
            }
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

    private var breedPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text("品种")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)

                PixelSelect(
                    options: visiblePresets.map { (id: $0.id, name: $0.name) },
                    selection: Binding(
                        get: { state.preset },
                        set: { state.choosePreset($0) }
                    ),
                    palette: palette
                )
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityLabel("品种")
                .disabled(state.loadingCustom)
            }
        }
    }

    private var customPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("自定义")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)
                    Spacer()
                    if state.customSelected != nil {
                        Button("取消叠加") { state.clearCustom() }
                            .buttonStyle(PixelButtonStyle(palette: palette))
                            .disabled(state.applying)
                    }
                    Button("像素编辑") { state.openPixelEditor() }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .disabled(state.openingPixelEditor || state.loadingCustom)
                }
                if state.customPresets.isEmpty {
                    Text("从左侧预览开始编辑，保存后会出现在这里。")
                        .font(PixelFont.font(10))
                        .foregroundStyle(palette.inkSoft)
                } else {
                    LazyVGrid(columns: presetColumns, alignment: .leading, spacing: 8) {
                        ForEach(state.customPresets) { preset in
                            customChip(preset)
                        }
                    }
                }
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
            let frame = state.appearance["frame", default: "M1"]
            let optionGroup = frame == "CAT" && state.appearance["palette"] == "CC01" ? "CAT_ORANGE" : frame
            let fieldsForFrame = catalog.fieldsByFrame[optionGroup] ?? [:]
            let localMarkings = catalog.fieldsByFrame["CAT_MARKINGS"] ?? [:]

            PixelPanel(palette: palette, padding: 12) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("外观")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)

                    if frame == "CAT" {
                        partColorRow("ear", shapeTitle: "耳形", colorTitle: "内耳色", fields: fieldsForFrame)
                        pupilControls(options: fieldsForFrame)
                        partColorRow("nose", shapeTitle: "鼻形", colorTitle: "鼻色", fields: fieldsForFrame)
                        if let mouths = fieldsForFrame["mouth"] {
                            fieldPicker(title: "嘴巴", key: "mouth", options: mouths)
                        }
                        LazyVGrid(columns: fieldColumns, alignment: .leading, spacing: 8) {
                            if let tails = fieldsForFrame["tail"] {
                                fieldPicker(title: "尾形", key: "tail", options: tails)
                            }
                            if let options = localMarkings["tailPattern"] {
                                fieldPicker(title: "尾纹", key: "tailPattern", options: options)
                            }
                        }
                        HStack(alignment: .top, spacing: 10) {
                            if let foreheadPatterns = fieldsForFrame["pattern"] {
                                fieldPicker(title: "额头花纹", key: "pattern", options: foreheadPatterns)
                            }
                            if catalog.faceBasePalettes.contains(state.appearance["palette", default: "CC01"]),
                               let options = localMarkings["faceBase"] {
                                fieldPicker(title: "脸部底纹", key: "faceBase", options: options)
                            } else {
                                staticField(title: "脸部底纹", value: "均匀底色")
                            }
                            if let options = localMarkings["cheekPattern"] {
                                fieldPicker(title: "脸颊花纹", key: "cheekPattern", options: options)
                            }
                        }
                        LazyVGrid(columns: fieldColumns, alignment: .leading, spacing: 8) {
                            if let options = localMarkings["bodyBase"] {
                                fieldPicker(title: "身体底色", key: "bodyBase", options: options)
                            }
                            if let bodyPatterns = fieldsForFrame["bodyPattern"] {
                                fieldPicker(title: "身体花纹", key: "bodyPattern", options: bodyPatterns)
                            }
                        }
                        if let accessories = fieldsForFrame["accessory"] {
                            accessoryRow(accessories)
                        }
                        coatPicker(options: fieldsForFrame["coat"] ?? [], palettes: fieldsForFrame["palette"] ?? [])
                    } else {
                        LazyVGrid(columns: fieldColumns, alignment: .leading, spacing: 8) {
                            ForEach(dogFields, id: \.0) { key, title in
                                if let options = fieldsForFrame[key] {
                                    fieldPicker(title: title, key: key, options: options)
                                }
                            }
                        }
                        paletteRow(options: fieldsForFrame["palette"] ?? [])
                    }
                }
            }
        }
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
            HStack(alignment: .top, spacing: 10) {
                fieldPicker(title: shapeTitle, key: part, options: shapes)
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

    private func pupilControls(options: [String: [AppearanceOption]]) -> some View {
        let colors = options["eyeColor"] ?? []
        return LazyVGrid(columns: fieldColumns, alignment: .leading, spacing: 8) {
            pupilPicker(title: "左眼瞳色", side: "left", colors: colors)
            pupilPicker(title: "右眼瞳色", side: "right", colors: colors)
        }
    }

    private func pupilPicker(title: String, side: String, colors: [AppearanceOption]) -> some View {
        PupilColorPicker(
            title: title, side: side, colors: colors, naturalSwatches: naturalSwatches, palette: palette,
            layers: pupilBinding("\(side)InnerPupil", inherited: "innerPupil", defaultValue: "round"),
            outer: pupilBinding("\(side)EyeColor", inherited: "eyeColor", defaultValue: "natural"),
            inner: pupilBinding("\(side)InnerEyeColor", inherited: "innerEyeColor", defaultValue: "natural")
        )
    }

    private func pupilBinding(_ key: String, inherited: String, defaultValue: String) -> Binding<String> {
        let selection = appearanceBinding(key)
        return Binding(
            get: { state.appearance[key] ?? state.appearance[inherited] ?? defaultValue },
            set: { selection.wrappedValue = $0 }
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
        return fieldPicker(title: "毛色搭配", key: "coat", options: options,
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
                    Button("打字同步") {
                        state.enableTyping()
                    }
                    .buttonStyle(PixelButtonStyle(palette: palette))
                    .help(state.typingStatus.text)
                    .accessibilityIdentifier("typing-sync-button")

                    applyButton
                }

                PixelDivider(palette: palette)

                HStack(spacing: 10) {
                    Toggle("显示桌宠", isOn: $state.visible)
                        .toggleStyle(PixelToggleStyle(palette: palette))
                        .onChange(of: state.visible) { state.setVisibility($0) }

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
        let disabled = state.catalog == nil || state.applying || state.loadingCustom
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
        case .checking, .unavailable: return palette.inkSoft
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
