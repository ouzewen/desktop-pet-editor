import AppKit
import SwiftUI
import WebKit

struct AppearanceOption: Decodable {
    let id: String
    let name: String
}

struct AppearancePreset: Decodable {
    let id: String
    let name: String
    let frame: String
}

struct AppearanceCatalog: Decodable {
    let fieldsByFrame: [String: [String: [AppearanceOption]]]
    let presets: [AppearancePreset]
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
    var choosePreset: (String) -> Void = { _ in }
    var refresh: () -> Void = {}
    var apply: () -> Void = {}
    var reset: () -> Void = {}
    var enableTyping: () -> Void = {}
    var setSize: (Double) -> Void = { _ in }
    var setVisibility: (Bool) -> Void = { _ in }
    var setEyeFollow: (Bool) -> Void = { _ in }

    func update(_ config: [String: Any]) {
        appearance = config.compactMapValues { $0 as? String }
        refresh()
    }
}

// MARK: - Swatches

private enum WBTheme {
    static func presetColors(_ id: String) -> [Color] {
        switch id {
        case "preset_m1_12", "preset_m1_14": return [Color(pixelHex: 0xEFB373), Color(pixelHex: 0xFFF6E8)]
        case "preset_m1_13": return [Color(pixelHex: 0x2E2E31), Color(pixelHex: 0x996138), Color(pixelHex: 0xFFFFFF)]
        case "preset_cat_orange": return [Color(pixelHex: 0xE08A4A), Color(pixelHex: 0xFFF6E8)]
        case "preset_cat_black": return [Color(pixelHex: 0x2B2930), Color(pixelHex: 0x4A4750)]
        case "preset_cat_siamese": return paletteColors("CC04")
        case "preset_cat_calico": return [Color(pixelHex: 0xD98E4A), Color(pixelHex: 0x2B2930), Color(pixelHex: 0xFFFFFF)]
        default: return [Color(pixelHex: 0xE9A53C)]
        }
    }

    static func paletteColors(_ id: String) -> [Color] {
        switch id {
        case "C01": return [Color(pixelHex: 0xEFB373), Color(pixelHex: 0xFFFFFF)]
        case "C02": return [Color(pixelHex: 0x2E2E31), Color(pixelHex: 0xFFFFFF)]
        case "C03": return [Color(pixelHex: 0x2E2E31), Color(pixelHex: 0x996138), Color(pixelHex: 0xFFFFFF)]
        case "C04": return [Color(pixelHex: 0x996138), Color(pixelHex: 0xFFF6E8)]
        case "C05": return [Color(pixelHex: 0xF2D8A0), Color(pixelHex: 0xFFFFFF)]
        case "C06": return [Color(pixelHex: 0x8E949A), Color(pixelHex: 0xFFFFFF)]
        case "C07": return [Color(pixelHex: 0xC85A28), Color(pixelHex: 0xFFF3E6)]
        case "C08": return [Color(pixelHex: 0x232326), Color(pixelHex: 0x3D3D41)]
        case "CC01": return [Color(pixelHex: 0xE08A4A), Color(pixelHex: 0xFFF6E8)]
        case "CC02": return [Color(pixelHex: 0x2B2930), Color(pixelHex: 0x4A4750)]
        case "CC04": return [Color(pixelHex: 0xF6E3CA), Color(pixelHex: 0x704932), Color(pixelHex: 0x6794B5)]
        case "CC03": return [Color(pixelHex: 0xD98E4A), Color(pixelHex: 0x2B2930), Color(pixelHex: 0xFFFFFF)]
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
    @Environment(\.colorScheme) private var colorScheme

    private var palette: PixelPalette { .of(colorScheme) }

    private let fields = [
        ("ear", "耳朵"), ("muzzle", "嘴鼻"), ("tail", "尾巴"),
        ("eye", "眼型"), ("eyeColor", "瞳色"), ("pattern", "面部花纹"), ("accessory", "配饰"),
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

    private var actionOptions: [(String, String)] {
        let cat = state.appearance["frame"] == "CAT"
        return [
            ("sit", "待机"),
            ("left", cat ? "左拖" : "左跑"),
            ("right", cat ? "右拖" : "右跑"),
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
                    breedPanel
                    appearancePanel
                    tipsPanel
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

    private var breedPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text("品种")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)

                LazyVGrid(columns: presetColumns, alignment: .leading, spacing: 8) {
                    ForEach(visiblePresets, id: \.id) { preset in
                        breedChip(preset)
                    }
                }
            }
        }
    }

    private func breedChip(_ preset: AppearancePreset) -> some View {
        let selected = preset.id == state.preset
        return Button {
            state.choosePreset(preset.id)
        } label: {
            HStack(spacing: 6) {
                PixelSwatch(colors: WBTheme.presetColors(preset.id), palette: palette, size: 12)
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
            .background(PixelBox(corner: 2).fill(selected ? palette.accent.opacity(0.42) : palette.panelAlt))
            .overlay(PixelBox(corner: 2).stroke(palette.border, lineWidth: 2))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var appearancePanel: some View {
        if let catalog = state.catalog {
            let frame = state.appearance["frame", default: "M1"]
            let fieldsForFrame = catalog.fieldsByFrame[frame] ?? [:]
            let palettes = fieldsForFrame["palette"] ?? []

            PixelPanel(palette: palette, padding: 12) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("外观")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)

                    nameRow

                    PixelDivider(palette: palette)

                    LazyVGrid(columns: fieldColumns, alignment: .leading, spacing: 8) {
                        ForEach(fields, id: \.0) { key, title in
                            fieldPicker(title: title, key: key, options: fieldsForFrame[key] ?? [])
                        }
                    }

                    paletteRow(options: palettes)
                }
            }
        }
    }

    private var nameRow: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(alignment: .firstTextBaseline) {
                Text("宠物名")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                Spacer()
                Text("\(state.appearance["name", default: ""].count)/8")
                    .font(PixelFont.font(12))
                    .foregroundStyle(nameCountColor)
            }
            PixelTextField(
                text: appearanceBinding("name"),
                placeholder: "给桌宠起个名字",
                palette: palette
            )
            .onSubmit { state.refresh() }
        }
    }

    private var nameCountColor: Color {
        let count = state.appearance["name", default: ""].count
        return (count == 0 || count > 8) ? palette.red : palette.inkSoft
    }

    private func fieldPicker(title: String, key: String, options: [AppearanceOption]) -> some View {
        let disabled = key == "eyeColor" && state.appearance["eye"] == "Y02"
        return VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)
            PixelSelect(
                options: options.map { (id: $0.id, name: $0.name) },
                selection: appearanceBinding(key),
                palette: palette
            )
            .disabled(disabled)
            .opacity(disabled ? 0.45 : 1)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func paletteRow(options: [AppearanceOption]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
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
                            PixelSwatch(colors: WBTheme.paletteColors(option.id), palette: palette, size: 22)
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
                    .help(option.name)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private var tipsPanel: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 5) {
                    PixelGlyph(kind: .paw, color: palette.accent, size: 12)
                    Text("小贴士")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)
                }
                Text("拖动小猫可以移动位置，右键打开菜单。")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
                Text("提醒卡片和输入条会跟着小猫一起移动。")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity)
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
                        .help("让猫咪瞳孔跟随鼠标移动")
                        .onChange(of: state.eyeFollow) { state.setEyeFollow($0) }

                    Rectangle().fill(palette.borderSoft).frame(width: 2, height: 14)

                    Text("大小")
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.inkSoft)
                    PixelSlider(
                        value: $state.petSize,
                        range: 160...360,
                        step: 20,
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
        let disabled = state.catalog == nil || state.applying
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
        state.message.isEmpty ? state.typingStatus.text : state.message
    }

    private var statusColor: Color {
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
