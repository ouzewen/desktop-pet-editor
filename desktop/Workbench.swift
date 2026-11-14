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

final class WorkbenchState: ObservableObject {
    @Published var catalog: AppearanceCatalog?
    @Published var appearance: [String: String] = [:]
    @Published var preset = "preset_cat_orange"
    @Published var action = "sit"
    @Published var petSize: Double = 240
    @Published var visible = true
    @Published var message = ""
    @Published var applying = false
    @Published var typingStatus = "打字同步未开启"
    var choosePreset: (String) -> Void = { _ in }
    var refresh: () -> Void = {}
    var apply: () -> Void = {}
    var reset: () -> Void = {}
    var enableTyping: () -> Void = {}
    var importConfig: () -> Void = {}
    var setSize: (Double) -> Void = { _ in }
    var setVisibility: (Bool) -> Void = { _ in }

    func update(_ config: [String: Any]) {
        appearance = config.compactMapValues { $0 as? String }
        refresh()
    }
}

// MARK: - Theme

private enum WBTheme {
    static let accent = Color(red: 0.90, green: 0.55, blue: 0.24)
    static let accentDeep = Color(red: 0.78, green: 0.40, blue: 0.13)

    static func hex(_ value: UInt32) -> Color {
        Color(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }

    static func presetColors(_ id: String) -> [Color] {
        switch id {
        case "preset_m1_12", "preset_m1_14": return [hex(0xEFB373), hex(0xFFF6E8)]
        case "preset_m1_13": return [hex(0x2E2E31), hex(0x996138), hex(0xFFFFFF)]
        case "preset_cat_orange": return [hex(0xE08A4A), hex(0xFFF6E8)]
        case "preset_cat_black": return [hex(0x2B2930), hex(0x4A4750)]
        case "preset_cat_calico": return [hex(0xD98E4A), hex(0x2B2930), hex(0xFFFFFF)]
        default: return [accent]
        }
    }

    static func paletteColors(_ id: String) -> [Color] {
        switch id {
        case "C01": return [hex(0xEFB373), hex(0xFFFFFF)]
        case "C02": return [hex(0x2E2E31), hex(0xFFFFFF)]
        case "C03": return [hex(0x2E2E31), hex(0x996138), hex(0xFFFFFF)]
        case "C04": return [hex(0x996138), hex(0xFFF6E8)]
        case "C05": return [hex(0xF2D8A0), hex(0xFFFFFF)]
        case "C06": return [hex(0x8E949A), hex(0xFFFFFF)]
        case "C07": return [hex(0xC85A28), hex(0xFFF3E6)]
        case "C08": return [hex(0x232326), hex(0x3D3D41)]
        case "CC01": return [hex(0xE08A4A), hex(0xFFFFFF)]
        case "CC02": return [hex(0x2B2930), hex(0x4A4750)]
        case "CC03": return [hex(0xD98E4A), hex(0x2B2930), hex(0xFFFFFF)]
        default: return [hex(0x9E9E9E)]
        }
    }
}

// MARK: - Building blocks

private struct WBCard: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    func body(content: Content) -> some View {
        content
            .padding(15)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(isDark ? Color.white.opacity(0.055) : Color(nsColor: .controlBackgroundColor))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(
                        isDark ? Color.white.opacity(0.10) : Color.black.opacity(0.06),
                        lineWidth: 1
                    )
            )
            .shadow(
                color: Color.black.opacity(isDark ? 0.30 : 0.07),
                radius: isDark ? 14 : 10,
                x: 0,
                y: 5
            )
    }
}

private extension View {
    func wbCard() -> some View { modifier(WBCard()) }
}

private struct Checkerboard: View {
    var cell: CGFloat = 14

    var body: some View {
        Canvas { context, size in
            let columns = Int(ceil(size.width / cell))
            let rows = Int(ceil(size.height / cell))
            guard columns > 0, rows > 0 else { return }
            for row in 0..<rows {
                for column in 0..<columns where (row + column).isMultiple(of: 2) {
                    let rect = CGRect(
                        x: CGFloat(column) * cell,
                        y: CGFloat(row) * cell,
                        width: cell,
                        height: cell
                    )
                    context.fill(Path(rect), with: .color(Color.primary.opacity(0.06)))
                }
            }
        }
    }
}

private struct SwatchCircle: View {
    let colors: [Color]
    var size: CGFloat = 18

    var body: some View {
        Circle()
            .fill(fillStyle)
            .overlay(Circle().strokeBorder(Color.primary.opacity(0.16), lineWidth: 1))
            .frame(width: size, height: size)
    }

    private var fillStyle: AnyShapeStyle {
        if colors.count > 1 {
            return AnyShapeStyle(AngularGradient(colors: colors, center: .center))
        }
        return AnyShapeStyle(colors.first ?? WBTheme.accent)
    }
}

private struct BreedChip: View {
    let preset: AppearancePreset
    let selected: Bool
    let colors: [Color]
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 7) {
                SwatchCircle(colors: colors, size: 15)
                Text(preset.name)
                    .font(.system(size: 12, weight: selected ? .semibold : .medium))
                    .lineLimit(1)
                if selected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(WBTheme.accent)
                }
            }
            .foregroundStyle(Color.primary.opacity(selected ? 0.95 : 0.72))
            .padding(.horizontal, 11)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(height: 32)
            .background(
                Capsule().fill(selected ? WBTheme.accent.opacity(0.16) : Color.primary.opacity(0.05))
            )
            .overlay(
                Capsule().strokeBorder(
                    selected ? WBTheme.accent.opacity(0.65) : Color.primary.opacity(0.07),
                    lineWidth: 1
                )
            )
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct PaletteSwatch: View {
    let option: AppearanceOption
    let selected: Bool
    let colors: [Color]
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                SwatchCircle(colors: colors, size: 26)
                if selected {
                    Circle()
                        .strokeBorder(WBTheme.accent, lineWidth: 2)
                        .frame(width: 30, height: 30)
                }
            }
            .frame(width: 32, height: 32)
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .help(option.name)
    }
}

private struct StatusPill: View {
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 7) {
            Circle()
                .fill(color)
                .frame(width: 7, height: 7)
            Text(text)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.primary.opacity(0.75))
                .lineLimit(1)
                .truncationMode(.tail)
                .accessibilityIdentifier("workbench-status")
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 6)
        .background(Capsule().fill(color.opacity(0.12)))
        .overlay(Capsule().strokeBorder(color.opacity(0.25), lineWidth: 1))
    }
}

private struct FieldPicker: View {
    let title: String
    let options: [AppearanceOption]
    @Binding var selection: String
    var isDisabled = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.secondary)
            Picker(title, selection: $selection) {
                ForEach(options, id: \.id) { option in
                    Text(option.name).tag(option.id)
                }
            }
            .labelsHidden()
            .pickerStyle(.menu)
            .disabled(isDisabled)
            .opacity(isDisabled ? 0.4 : 1)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Preview bridge

private struct SpritePreview: NSViewRepresentable {
    let web: WKWebView
    func makeNSView(context: Context) -> WKWebView { web }
    func updateNSView(_ nsView: WKWebView, context: Context) {}
}

// MARK: - Workbench

struct WorkbenchView: View {
    @ObservedObject var state: WorkbenchState
    let preview: WKWebView

    private let fields = [
        ("ear", "耳朵"), ("muzzle", "嘴鼻"), ("tail", "尾巴"),
        ("eye", "眼型"), ("eyeColor", "瞳色"), ("pattern", "面部花纹"),
    ]
    private let gridColumns = [
        GridItem(.flexible(), spacing: 12, alignment: .top),
        GridItem(.flexible(), spacing: 12, alignment: .top),
    ]
    private let presetColumns = [
        GridItem(.flexible(), spacing: 8, alignment: .top),
        GridItem(.flexible(), spacing: 8, alignment: .top),
        GridItem(.flexible(), spacing: 8, alignment: .top),
    ]

    var body: some View {
        ZStack {
            background
            VStack(spacing: 18) {
                header
                HStack(alignment: .top, spacing: 18) {
                    previewCard
                    detailPane
                }
                .frame(maxHeight: .infinity)
                footer
            }
            .padding(22)
        }
        .frame(minWidth: 840, minHeight: 620)
    }

    private var background: some View {
        ZStack {
            Color(nsColor: .windowBackgroundColor)
            LinearGradient(
                colors: [
                    WBTheme.accent.opacity(0.07),
                    Color.clear,
                    WBTheme.accentDeep.opacity(0.035),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
        .ignoresSafeArea()
    }

    private var header: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [WBTheme.accent, WBTheme.accentDeep],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                Image(systemName: "pawprint.fill")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .frame(width: 44, height: 44)
            .shadow(color: WBTheme.accentDeep.opacity(0.3), radius: 6, x: 0, y: 3)

            VStack(alignment: .leading, spacing: 3) {
                Text("桌宠工作台")
                    .font(.system(size: 22, weight: .semibold, design: .rounded))
                Text("挑选品种与外观，实时预览后应用到桌面")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 12)

            Button {
                state.importConfig()
            } label: {
                Label("导入配置", systemImage: "square.and.arrow.down")
            }
            .controlSize(.large)
            .help("从 JSON 文件导入已有的宠物配置")
        }
    }

    private var previewCard: some View {
        VStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color(nsColor: .textBackgroundColor).opacity(0.45))
                Checkerboard()
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                RadialGradient(
                    colors: [WBTheme.accent.opacity(0.16), Color.clear],
                    center: .center,
                    startRadius: 12,
                    endRadius: 165
                )
                SpritePreview(web: preview)
                    .frame(width: 300, height: 300)
                    .accessibilityLabel("桌宠动作预览")
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(Color.primary.opacity(0.08))
            )
            .overlay(alignment: .topLeading) { nameChip.padding(10) }
            .overlay(alignment: .topTrailing) { frameChip.padding(10) }

            VStack(spacing: 6) {
                Text("动作预览")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Picker("动作预览", selection: $state.action) {
                    Text("待机").tag("sit")
                    Text(state.appearance["frame"] == "CAT" ? "左走" : "左跑").tag("left")
                    Text(state.appearance["frame"] == "CAT" ? "右走" : "右跑").tag("right")
                    Text("打字").tag("typing")
                }
                .labelsHidden()
                .pickerStyle(.segmented)
                .tint(WBTheme.accent)
                .onChange(of: state.action) { _ in state.refresh() }
            }
        }
        .wbCard()
        .frame(width: 392)
    }

    private var nameChip: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(WBTheme.accent)
                .frame(width: 6, height: 6)
            Text(state.appearance["name"].flatMap { $0.isEmpty ? nil : $0 } ?? "未命名")
                .font(.system(size: 11, weight: .medium))
                .lineLimit(1)
        }
        .padding(.horizontal, 10)
        .frame(height: 24)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().strokeBorder(Color.primary.opacity(0.08)))
    }

    private var frameChip: some View {
        Text(state.appearance["frame"] == "CAT" ? "猫" : "犬")
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(Color.primary.opacity(0.65))
            .padding(.horizontal, 9)
            .frame(height: 22)
            .background(Color.primary.opacity(0.06), in: Capsule())
    }

    @ViewBuilder
    private var detailPane: some View {
        if state.catalog != nil {
            GeometryReader { proxy in
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 14) {
                        breedCard
                        appearanceCard
                    }
                    .frame(maxWidth: .infinity, minHeight: proxy.size.height, alignment: .top)
                    .padding(.bottom, 20)
                }
            }
        } else {
            VStack(spacing: 12) {
                ProgressView()
                Text("正在加载形象…")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .wbCard()
        }
    }

    private var breedCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("品种", detail: "犬与猫的预设形象")
            LazyVGrid(columns: presetColumns, alignment: .leading, spacing: 8) {
                if let catalog = state.catalog {
                    ForEach(catalog.presets, id: \.id) { preset in
                        BreedChip(
                            preset: preset,
                            selected: preset.id == state.preset,
                            colors: WBTheme.presetColors(preset.id)
                        ) {
                            state.choosePreset(preset.id)
                        }
                    }
                }
            }
        }
        .wbCard()
    }

    @ViewBuilder
    private var appearanceCard: some View {
        if let catalog = state.catalog {
            let frame = state.appearance["frame", default: "M1"]
            let fieldsForFrame = catalog.fieldsByFrame[frame] ?? [:]
            let palettes = fieldsForFrame["palette"] ?? []

            VStack(alignment: .leading, spacing: 12) {
                sectionHeader("外观", detail: "改动会实时预览")
                nameRow

                Divider()

                LazyVGrid(columns: gridColumns, alignment: .leading, spacing: 10) {
                    ForEach(fields, id: \.0) { key, title in
                        FieldPicker(
                            title: title,
                            options: fieldsForFrame[key] ?? [],
                            selection: appearanceBinding(key),
                            isDisabled: key == "eyeColor" && state.appearance["eye"] == "Y02"
                        )
                    }
                }

                paletteRow(options: palettes)

                Spacer(minLength: 12)
            }
            .frame(maxHeight: .infinity, alignment: .top)
            .wbCard()
        }
    }

    private var nameRow: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(alignment: .firstTextBaseline) {
                Text("宠物名")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(state.appearance["name", default: ""].count)/8")
                    .font(.system(size: 10, weight: .medium).monospacedDigit())
                    .foregroundStyle(nameCountColor)
            }
            TextField("给桌宠起个名字", text: appearanceBinding("name"))
                .textFieldStyle(.roundedBorder)
                .onSubmit { state.refresh() }
        }
    }

    private var nameCountColor: Color {
        let count = state.appearance["name", default: ""].count
        return (count == 0 || count > 8) ? .red : .secondary
    }

    private func paletteRow(options: [AppearanceOption]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text("毛色")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
                if let selected = options.first(where: { $0.id == state.appearance["palette"] }) {
                    Text(selected.name)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.tertiary)
                }
            }
            HStack(spacing: 6) {
                ForEach(options, id: \.id) { option in
                    PaletteSwatch(
                        option: option,
                        selected: state.appearance["palette"] == option.id,
                        colors: WBTheme.paletteColors(option.id)
                    ) {
                        state.appearance["palette"] = option.id
                        state.refresh()
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func sectionHeader(_ title: String, detail: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
            Text(detail)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
        }
    }

    private var footer: some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                StatusPill(text: statusText, color: statusColor)
                Spacer(minLength: 8)
                Button {
                    state.enableTyping()
                } label: {
                    Label("打字同步", systemImage: "keyboard")
                }
                .help(state.typingStatus)

                applyButton
            }

            Divider()

            HStack(spacing: 12) {
                Toggle("显示桌宠", isOn: $state.visible)
                    .toggleStyle(.switch)
                    .tint(WBTheme.accent)
                    .onChange(of: state.visible) { state.setVisibility($0) }

                Divider().frame(height: 18)

                Text("大小")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                Slider(value: $state.petSize, in: 160...360, step: 20)
                    .frame(width: 150)
                    .labelsHidden()
                    .accessibilityLabel("桌宠大小")
                    .tint(WBTheme.accent)
                    .onChange(of: state.petSize) { state.setSize($0) }
                Text("\(Int(state.petSize)) px")
                    .font(.system(size: 12).monospacedDigit())
                    .foregroundStyle(.secondary)
                    .frame(width: 52, alignment: .leading)

                Spacer(minLength: 8)

                Button {
                    state.reset()
                } label: {
                    Label("归位", systemImage: "scope")
                }
                .help("将桌宠移回屏幕")
            }
        }
        .wbCard()
    }

    private var applyButton: some View {
        Button {
            state.apply()
        } label: {
            HStack(spacing: 6) {
                if state.applying {
                    ProgressView().controlSize(.small)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                }
                Text(state.applying ? "正在应用…" : "应用到桌宠")
            }
            .frame(minWidth: 108)
        }
        .buttonStyle(.borderedProminent)
        .tint(WBTheme.accent)
        .controlSize(.large)
        .keyboardShortcut(.defaultAction)
        .disabled(state.catalog == nil || state.applying)
    }

    private var statusText: String {
        state.message.isEmpty ? state.typingStatus : state.message
    }

    private var statusColor: Color {
        if !state.message.isEmpty {
            let failed = state.message.contains("无法") || state.message.contains("失败")
            return failed ? .red : .green
        }
        return state.typingStatus.contains("已开启") ? .green : .orange
    }

    private func appearanceBinding(_ key: String) -> Binding<String> {
        Binding(get: { state.appearance[key, default: ""] }, set: { value in
            state.appearance[key] = value
            state.refresh()
        })
    }
}
