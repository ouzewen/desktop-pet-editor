import AppKit
import SwiftUI

// MARK: - Font

enum PixelFont {
    static let postScriptName = "Ark-Pixel-12px-Mono-zh-Hans-Regular"

    static func font(_ size: CGFloat = 12) -> Font {
        .custom(postScriptName, size: size)
    }
}

extension Color {
    init(pixelHex value: UInt32) {
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

// MARK: - Palette

struct PixelPalette {
    let background: Color
    let backgroundAlt: Color
    let panel: Color
    let panelAlt: Color
    let panelDeep: Color
    let border: Color
    let borderSoft: Color
    let ink: Color
    let inkSoft: Color
    let accent: Color
    let accentDeep: Color
    let green: Color
    let red: Color
    let shadow: Color

    static func of(_ scheme: ColorScheme) -> PixelPalette {
        scheme == .dark ? dark : light
    }

    static func workbench(_ scheme: ColorScheme) -> PixelPalette {
        let dark = scheme == .dark
        return PixelPalette(
            background: Color(pixelHex: dark ? 0x24211E : 0xEEE8DF),
            backgroundAlt: Color(pixelHex: dark ? 0x292521 : 0xF5F0E5),
            panel: Color(pixelHex: dark ? 0x2D2925 : 0xFCFAF5),
            panelAlt: Color(pixelHex: dark ? 0x38312B : 0xF3EDE3),
            panelDeep: Color(pixelHex: dark ? 0x211E1B : 0xEDE1CB),
            border: Color(pixelHex: dark ? 0x5A4D40 : 0xAF8D59),
            borderSoft: Color(pixelHex: dark ? 0x51453B : 0xDFD4C2),
            ink: Color(pixelHex: dark ? 0xF6F0E4 : 0x302A24),
            inkSoft: Color(pixelHex: dark ? 0xC8B9A9 : 0x6D5D4C),
            accent: Color(pixelHex: dark ? 0xCFAB76 : 0xA47642),
            accentDeep: Color(pixelHex: dark ? 0xE8BC83 : 0x8E542B),
            green: Color(pixelHex: dark ? 0xA0B981 : 0x5C8238),
            red: Color(pixelHex: dark ? 0xE39783 : 0x9F4E37),
            shadow: Color(pixelHex: dark ? 0x171411 : 0x4A3314)
        )
    }

    private static let light = PixelPalette(
        background: Color(pixelHex: 0xE7C98B),
        backgroundAlt: Color(pixelHex: 0xDDBB77),
        panel: Color(pixelHex: 0xFBF0D2),
        panelAlt: Color(pixelHex: 0xF1DDB0),
        panelDeep: Color(pixelHex: 0xE3C98F),
        border: Color(pixelHex: 0x5B3A24),
        borderSoft: Color(pixelHex: 0xC9A86F),
        ink: Color(pixelHex: 0x3F2A1A),
        inkSoft: Color(pixelHex: 0x7A5B3C),
        accent: Color(pixelHex: 0xE9A53C),
        accentDeep: Color(pixelHex: 0xC27A22),
        green: Color(pixelHex: 0x6C9B45),
        red: Color(pixelHex: 0xB54A3C),
        shadow: Color(pixelHex: 0x3A2517)
    )

    private static let dark = PixelPalette(
        background: Color(pixelHex: 0x2B2118),
        backgroundAlt: Color(pixelHex: 0x33271C),
        panel: Color(pixelHex: 0x3B2D20),
        panelAlt: Color(pixelHex: 0x463628),
        panelDeep: Color(pixelHex: 0x2F241A),
        border: Color(pixelHex: 0x120C07),
        borderSoft: Color(pixelHex: 0x6B4E33),
        ink: Color(pixelHex: 0xF4E3C0),
        inkSoft: Color(pixelHex: 0xC7A97C),
        accent: Color(pixelHex: 0xE9A53C),
        accentDeep: Color(pixelHex: 0xA96A1E),
        green: Color(pixelHex: 0x7FAE57),
        red: Color(pixelHex: 0xC45A4B),
        shadow: Color(pixelHex: 0x0E0905)
    )
}

// MARK: - Shapes

struct PixelBox: Shape {
    var corner: CGFloat = 4
    var insetAmount: CGFloat = 0

    init(corner: CGFloat = 4, inset: CGFloat = 0) {
        self.corner = corner
        self.insetAmount = inset
    }

    func path(in rect: CGRect) -> Path {
        let r = rect.insetBy(dx: insetAmount, dy: insetAmount)
        let c = min(corner, min(r.width, r.height) / 2)
        var path = Path()
        guard r.width > 0, r.height > 0 else { return path }
        path.move(to: CGPoint(x: r.minX + c, y: r.minY))
        path.addLine(to: CGPoint(x: r.maxX - c, y: r.minY))
        path.addLine(to: CGPoint(x: r.maxX - c, y: r.minY + c))
        path.addLine(to: CGPoint(x: r.maxX, y: r.minY + c))
        path.addLine(to: CGPoint(x: r.maxX, y: r.maxY - c))
        path.addLine(to: CGPoint(x: r.maxX - c, y: r.maxY - c))
        path.addLine(to: CGPoint(x: r.maxX - c, y: r.maxY))
        path.addLine(to: CGPoint(x: r.minX + c, y: r.maxY))
        path.addLine(to: CGPoint(x: r.minX + c, y: r.maxY - c))
        path.addLine(to: CGPoint(x: r.minX, y: r.maxY - c))
        path.addLine(to: CGPoint(x: r.minX, y: r.minY + c))
        path.addLine(to: CGPoint(x: r.minX + c, y: r.minY + c))
        path.closeSubpath()
        return path
    }
}

// MARK: - Backdrop

struct PixelBackdrop: View {
    let palette: PixelPalette

    var body: some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(palette.background))
            let cell: CGFloat = 10
            var row = 0
            var y: CGFloat = 0
            while y < size.height {
                var column = 0
                var x: CGFloat = 0
                while x < size.width {
                    if (row + column).isMultiple(of: 2) {
                        context.fill(
                            Path(CGRect(x: x, y: y, width: cell, height: cell)),
                            with: .color(palette.backgroundAlt.opacity(0.55))
                        )
                    }
                    x += cell
                    column += 1
                }
                y += cell
                row += 1
            }
            let frameRect = CGRect(origin: .zero, size: size).insetBy(dx: 8, dy: 8)
            context.stroke(PixelBox(corner: 8).path(in: frameRect), with: .color(palette.shadow.opacity(0.35)), lineWidth: 2)
        }
        .ignoresSafeArea()
    }
}

struct WorkbenchPixelSurface: View {
    let palette: PixelPalette
    let fill: Color
    var corner: CGFloat = 5
    var framed = false

    var body: some View {
        PixelBox(corner: corner)
            .fill(fill)
            .overlay(PixelBox(corner: corner, inset: 0.5).stroke(palette.borderSoft, lineWidth: 1))
            .overlay {
                if framed {
                    PixelBox(corner: corner, inset: 4).stroke(palette.border, lineWidth: 1)
                }
            }
            .allowsHitTesting(false)
            .accessibilityHidden(true)
    }
}

// MARK: - Panel

struct PixelPanel<Content: View>: View {
    @Environment(\.workbenchChrome) private var workbenchChrome
    let palette: PixelPalette
    var padding: CGFloat
    private let content: Content

    init(palette: PixelPalette, padding: CGFloat = 14, @ViewBuilder content: () -> Content) {
        self.palette = palette
        self.padding = padding
        self.content = content()
    }

    @ViewBuilder var body: some View {
        if workbenchChrome {
            content.padding(padding)
                .background(WorkbenchPixelSurface(palette: palette, fill: palette.panel))
        } else {
            content
            .padding(padding)
            .background(PixelBox(corner: 4).fill(palette.panel))
            .overlay(PixelBox(corner: 4).stroke(palette.border, lineWidth: 3))
            .overlay(PixelBox(corner: 2, inset: 4).stroke(palette.borderSoft.opacity(0.55), lineWidth: 1))
                .background(PixelBox(corner: 4).fill(palette.shadow).offset(x: 3, y: 3))
        }
    }
}

struct WorkbenchCardHeading<Actions: View>: View {
    let title: String
    let glyph: PixelIconKind
    let palette: PixelPalette
    @ViewBuilder let actions: () -> Actions

    var body: some View {
        HStack(spacing: 7) {
            PixelGlyph(kind: glyph, color: palette.accentDeep, size: 12)
            Text(title)
                .font(PixelFont.font(15))
                .foregroundStyle(palette.ink)
                .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 4)
            actions()
        }
    }
}

struct WorkbenchCardIconButton: View {
    let glyph: PixelIconKind
    let title: String
    let palette: PixelPalette
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            PixelGlyph(kind: glyph, color: palette.inkSoft, size: 9)
                .frame(width: 12, height: 10)
        }
        .workbenchButton(palette: palette)
        .accessibilityLabel(title)
        .help(title)
    }
}

extension View {
    func workbenchCardSurface(_ theme: WorkbenchTheme) -> some View {
        background(WorkbenchPixelSurface(palette: theme.palette, fill: theme.palette.panel))
            .environment(\.workbenchChrome, true)
            .environment(\.workbenchTheme, theme)
            .preferredColorScheme(.light)
    }

    func workbenchCardField(palette: PixelPalette, focused: Bool) -> some View {
        background(PixelBox(corner: 3).fill(palette.panelDeep))
            .overlay {
                PixelBox(corner: 3, inset: 0.5)
                    .stroke(focused ? palette.accentDeep : palette.borderSoft, lineWidth: focused ? 2 : 1)
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
            }
    }
}

struct PixelChecker: View {
    let even: Color
    let odd: Color
    var cell: CGFloat = 12

    var body: some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(even))
            var row = 0
            var y: CGFloat = 0
            while y < size.height {
                var column = 0
                var x: CGFloat = 0
                while x < size.width {
                    if !(row + column).isMultiple(of: 2) {
                        context.fill(
                            Path(CGRect(x: x, y: y, width: cell, height: cell)),
                            with: .color(odd)
                        )
                    }
                    x += cell
                    column += 1
                }
                y += cell
                row += 1
            }
        }
    }
}

// MARK: - Glyphs

enum PixelIconKind {
    case bell, plus, close, check, paw, eye, keyboard, chevron, chevronUp, arrowLeft, arrowRight, pin, cloud, note, clip, microphone, timer
    case workbenchCat, workbenchRecord, workbenchBrush, workbenchApply, workbenchSettings
    case pencil, trash, file, grip, todo, checkbox
}

struct PixelGlyph: View {
    let kind: PixelIconKind
    var color: Color
    var size: CGFloat = 12

    var body: some View {
        let rows = PixelGlyph.pattern(kind)
        let columns = rows.map(\.count).max() ?? 1
        let cell = size / CGFloat(max(columns, rows.count))
        Canvas { context, _ in
            for (y, row) in rows.enumerated() {
                for (x, character) in row.enumerated() where character == "1" {
                    context.fill(
                        Path(CGRect(
                            x: CGFloat(x) * cell,
                            y: CGFloat(y) * cell,
                            width: cell,
                            height: cell
                        )),
                        with: .color(color)
                    )
                }
            }
        }
        .frame(width: cell * CGFloat(columns), height: cell * CGFloat(rows.count))
        .accessibilityHidden(true)
    }

    private static func pattern(_ kind: PixelIconKind) -> [String] {
        switch kind {
        case .checkbox:
            return ["11111111", "1......1", "1......1", "1......1",
                    "1......1", "1......1", "1......1", "11111111"]
        case .todo:
            return [
                "............", "....1.......", "...11.11111.", "1.11........",
                ".11.........", "............", "............", ".111........",
                ".1.1..11111.", ".111........", "............", "............",
            ]
        case .grip:
            return ["11.11", "11.11", ".....", "11.11", "11.11", ".....", "11.11", "11.11"]
        case .file:
            return [
                "11111...", "1...11..", "1...111.", "1.....1.",
                "1.111.1.", "1.....1.", "1.111.1.", "1111111.",
            ]
        case .pencil:
            return [
                ".....11.", "....1111", "...11.11", "..11111.",
                ".11111..", "11111...", "1111....", "11......",
            ]
        case .trash:
            return [
                "...11...", "..1111..", "11111111", ".1....1.",
                ".1.11.1.", ".1.11.1.", ".1....1.", ".111111.",
            ]
        case .workbenchCat:
            return [
                "..1......1..", ".111....111.", ".1111..1111.", ".1.111111.1.",
                ".1111111111.", "111111111111", "111.1111.111", "111.1111.111",
                "111111111111", ".1111..1111.", "..11111111..", "....1111....",
            ]
        case .workbenchRecord:
            return [
                "....1111....", "...111111...", "...11..11...", "...111111...",
                ".1.11..11.1.", ".1.111111.1.", ".1..1111..1.", ".11......11.",
                "..11111111..", ".....11.....", "...111111...", "...111111...",
            ]
        case .workbenchBrush:
            return [
                "........11..", ".......1111.", "......11111.", ".....11111..",
                "....11111...", "...11111....", "..11.11.....", ".11111......",
                ".1111...11..", "1111....11..", "111..11.....", ".....11.....",
            ]
        case .workbenchApply:
            return [
                ".1111111111.", "11........11", "1..........1", "1......11..1",
                "1.....11...1", "1..1.11....1", "1..111.....1", "1...1......1",
                "11........11", ".1111111111.", ".....11.....", "...111111...",
            ]
        case .workbenchSettings:
            return [
                "......11....", "......11....", "111111111111", "......11....",
                "..11........", "..11........", "111111111111", "..11........",
                "........11..", "........11..", "111111111111", "........11..",
            ]
        case .bell:
            return [
                "...11...",
                "..1111..",
                ".111111.",
                ".111111.",
                ".111111.",
                "11111111",
                "........",
                "...11...",
            ]
        case .clip:
            return [
                ".111111.",
                "..1111..",
                ".111111.",
                ".1....1.",
                ".1....1.",
                ".1....1.",
                ".111111.",
                "........",
            ]
        case .microphone:
            return [
                "...11...",
                "..1111..",
                "..1111..",
                "1.1111.1",
                "1.1111.1",
                ".111111.",
                "...11...",
                "..1111..",
            ]
        case .timer:
            return [
                "..1111..",
                ".1....1.",
                "1...1..1",
                "1...1..1",
                "1...11.1",
                ".1....1.",
                "..1111..",
                "........",
            ]
        case .note:
            return [
                "...11..",
                "...11..",
                "...11..",
                "...11..",
                ".1111..",
                "1111...",
                ".11....",
            ]
        case .cloud:
            return [
                "..111...",
                ".11111..",
                "11111111",
                "11111111",
                ".111111.",
                "..1111..",
            ]
        case .pin:
            // A staple seen from the front: crown plus two legs, with the
            // clinched tips bent inwards.
            return [
                "11111111",
                "11....11",
                "11....11",
                "11....11",
                "11....11",
                "..1..1..",
            ]
        case .plus:
            return [
                "...11...",
                "...11...",
                "...11...",
                "11111111",
                "11111111",
                "...11...",
                "...11...",
                "...11...",
            ]
        case .close:
            return [
                "11....11",
                ".11..11.",
                "..1111..",
                "...11...",
                "..1111..",
                ".11..11.",
                "11....11",
                "........",
            ]
        case .check:
            return [
                "......11",
                ".....11.",
                "....11..",
                "11..11..",
                ".1111...",
                "..111...",
                "...1....",
                "........",
            ]
        case .paw:
            return [
                "..1...1..",
                ".111.111.",
                ".111.111.",
                "..1...1..",
                "...111...",
                "..11111..",
                ".1111111.",
                "..11111..",
                "...111...",
            ]
        case .eye:
            return [
                "..1111..",
                ".1....1.",
                "1..11..1",
                "1..11..1",
                ".1....1.",
                "..1111..",
                "........",
                "........",
            ]
        case .keyboard:
            return [
                "11111111",
                "1......1",
                "1.1.1.11",
                "1......1",
                "1.1111.1",
                "1......1",
                "11111111",
                "........",
            ]
        case .chevron, .chevronUp:
            let rows = [
                "........",
                "11....11",
                ".11..11.",
                "..1111..",
                "...11...",
                "........",
                "........",
                "........",
            ]
            return kind == .chevronUp ? Array(rows.reversed()) : rows
        case .arrowLeft:
            return [
                "........",
                "...1....",
                "..11....",
                ".1111111",
                ".1111111",
                "..11....",
                "...1....",
                "........",
            ]
        case .arrowRight:
            return [
                "........",
                "....1...",
                "....11..",
                "1111111.",
                "1111111.",
                "....11..",
                "....1...",
                "........",
            ]
        }
    }
}

// MARK: - Buttons

enum WorkbenchTheme: String, CaseIterable, Identifiable {
    case sand, pearl, sage

    var id: Self { self }

    var title: String {
        switch self {
        case .sand: "浅暖沙"
        case .pearl: "暖珍珠灰"
        case .sage: "浅鼠尾草绿"
        }
    }

    var palette: PixelPalette {
        switch self {
        case .sand:
            Self.lightPalette(background: 0xEEE4D5, panel: 0xFBF3E8, control: 0xF0E3D1,
                              selected: 0xE6D1B4, border: 0xA68865, divider: 0xD2BDA3,
                              accent: 0x724B30, focus: 0x825329)
        case .pearl:
            Self.lightPalette(background: 0xEAE6E0, panel: 0xF7F4F0, control: 0xEDE8E1,
                              selected: 0xDDD4C9, border: 0x9B8878, divider: 0xCDC1B5,
                              accent: 0x665449, focus: 0x785A44)
        case .sage:
            Self.lightPalette(background: 0xE5EBDD, panel: 0xF3F5EC, control: 0xE7EDDF,
                              selected: 0xD6E1CC, border: 0x859577, divider: 0xBFCBB5,
                              accent: 0x506246, focus: 0x5A6A47)
        }
    }

    private static func lightPalette(background: UInt32, panel: UInt32, control: UInt32, selected: UInt32,
                                     border: UInt32, divider: UInt32, accent: UInt32, focus: UInt32) -> PixelPalette {
        PixelPalette(background: Color(pixelHex: background),
                     backgroundAlt: Color(pixelHex: control),
                     panel: Color(pixelHex: panel),
                     panelAlt: Color(pixelHex: control),
                     panelDeep: Color(pixelHex: selected),
                     border: Color(pixelHex: border),
                     borderSoft: Color(pixelHex: divider),
                     ink: Color(pixelHex: 0x382D25),
                     inkSoft: Color(pixelHex: 0x665549),
                     accent: Color(pixelHex: accent),
                     accentDeep: Color(pixelHex: focus),
                     green: Color(pixelHex: 0x426233),
                     red: Color(pixelHex: 0x943D30),
                     shadow: Color(pixelHex: 0x574332))
    }
}

private struct WorkbenchThemeKey: EnvironmentKey {
    static let defaultValue: WorkbenchTheme? = nil
}

private struct WorkbenchChromeKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var workbenchTheme: WorkbenchTheme? {
        get { self[WorkbenchThemeKey.self] }
        set { self[WorkbenchThemeKey.self] = newValue }
    }

    var workbenchChrome: Bool {
        get { self[WorkbenchChromeKey.self] }
        set { self[WorkbenchChromeKey.self] = newValue }
    }
}

enum WorkbenchTypography {
    static let pageTitle = PixelFont.font(22)
    static let sectionTitle = PixelFont.font(18)
    static let bodySize: CGFloat = 14

    static func body(_ weight: Font.Weight = .regular) -> Font {
        .system(size: bodySize, weight: weight)
    }

    static func supporting(_ weight: Font.Weight = .regular) -> Font {
        .system(size: 10, weight: weight)
    }
}

private struct WorkbenchWindowTypographyKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var usesWorkbenchWindowTypography: Bool {
        get { self[WorkbenchWindowTypographyKey.self] }
        set { self[WorkbenchWindowTypographyKey.self] = newValue }
    }
}

struct WorkbenchButtonStyle: ButtonStyle {
    let palette: PixelPalette
    var selected = false
    var prominent = false
    var card = false
    var quiet = false
    var keyboardFocused = false
    var tint: Color?

    func makeBody(configuration: Configuration) -> some View {
        WorkbenchButtonFace(label: configuration.label, palette: palette, selected: selected,
                            prominent: prominent, card: card, quiet: quiet, pressed: configuration.isPressed,
                            keyboardFocused: keyboardFocused, tint: tint)
    }
}

private struct WorkbenchButtonChrome: ViewModifier {
    let palette: PixelPalette
    let selected: Bool
    let prominent: Bool
    let card: Bool
    let quiet: Bool
    let tint: Color?
    @FocusState private var focused: Bool

    private var style: WorkbenchButtonStyle {
        WorkbenchButtonStyle(palette: palette, selected: selected, prominent: prominent, card: card, quiet: quiet,
                            keyboardFocused: focused, tint: tint)
    }

    func body(content: Content) -> some View {
        if #available(macOS 14.0, *) {
            content.buttonStyle(style).focused($focused).focusEffectDisabled(focused)
        } else {
            content.buttonStyle(style).focused($focused)
        }
    }
}

extension View {
    func workbenchButton(palette: PixelPalette, selected: Bool = false, prominent: Bool = false, card: Bool = false,
                         quiet: Bool = false, tint: Color? = nil) -> some View {
        modifier(WorkbenchButtonChrome(palette: palette, selected: selected, prominent: prominent, card: card,
                                       quiet: quiet, tint: tint))
    }
}

private struct WorkbenchButtonFace<Label: View>: View {
    let label: Label
    let palette: PixelPalette
    let selected: Bool
    let prominent: Bool
    let card: Bool
    let quiet: Bool
    let pressed: Bool
    let keyboardFocused: Bool
    let tint: Color?
    @Environment(\.usesWorkbenchWindowTypography) private var useWindowTypography
    @Environment(\.isEnabled) private var enabled
    @Environment(\.isFocused) private var focused
    @Environment(\.workbenchTheme) private var workbenchTheme
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovered = false

    private var feedback: Bool { enabled && (hovered || pressed || focused || keyboardFocused) }
    private var fill: Color {
        if quiet && !selected && !feedback { return .clear }
        if !enabled { return prominent ? palette.panelDeep : palette.panelAlt }
        if let tint, prominent { return pressed ? tint.opacity(0.85) : tint }
        if prominent && workbenchTheme != nil {
            return pressed ? palette.accent.opacity(0.86) : palette.accent
        }
        if prominent && colorScheme == .dark { return pressed ? palette.accent.opacity(0.8) : palette.accent }
        if prominent { return Color(pixelHex: pressed ? 0x352619 : 0x493423) }
        return selected || feedback ? palette.panelDeep : palette.panelAlt
    }
    private var foreground: Color {
        if !enabled { return palette.inkSoft }
        guard prominent else { return palette.ink }
        if workbenchTheme != nil || tint != nil { return Color(pixelHex: 0xFFF9EC) }
        return Color(pixelHex: colorScheme == .dark ? 0x322313 : 0xFFF9EC)
    }
    private var edge: Color {
        guard prominent else { return palette.accentDeep }
        if workbenchTheme != nil { return Color(pixelHex: 0xFFF9EC) }
        return Color(pixelHex: colorScheme == .dark ? 0x4D3019 : 0xF4D39D)
    }

    private var labelFont: Font {
        let weight: Font.Weight = selected || prominent ? .semibold : .medium
        return useWindowTypography ? WorkbenchTypography.body(weight) : .system(size: 12, weight: weight)
    }

    var body: some View {
        label
            .font(labelFont)
            .foregroundStyle(foreground)
            .padding(.horizontal, card ? 0 : 9)
            .padding(.vertical, card ? 0 : 6)
            .background(PixelBox(corner: card ? 5 : 3).fill(fill))
            .overlay {
                if feedback || (enabled && selected) {
                    PixelBox(corner: card ? 5 : 3, inset: 1)
                        .stroke(feedback ? edge : palette.border, lineWidth: focused || keyboardFocused || pressed ? 2 : 1)
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
            .contentShape(Rectangle())
            .onContinuousHover { phase in
                switch phase {
                case .active: hovered = true
                case .ended: hovered = false
                }
            }
            .offset(y: pressed && !reduceMotion ? 1 : 0)
    }
}

struct PixelButtonStyle: ButtonStyle {
    @Environment(\.workbenchChrome) private var workbenchChrome
    let palette: PixelPalette
    var prominent = false

    @ViewBuilder func makeBody(configuration: Configuration) -> some View {
        if workbenchChrome {
            WorkbenchButtonStyle(palette: palette, prominent: prominent).makeBody(configuration: configuration)
        } else {
            pixelBody(configuration: configuration)
        }
    }

    private func pixelBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        return configuration.label
            .font(PixelFont.font(12))
            .foregroundStyle(palette.ink)
            .lineLimit(1)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(PixelBox(corner: 3).fill(prominent ? palette.accent : palette.panelAlt))
            .overlay(PixelBox(corner: 3).stroke(palette.border, lineWidth: 2))
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(prominent ? Color.white.opacity(0.35) : Color.white.opacity(0.28))
                    .frame(height: 1)
                    .padding(.horizontal, 3)
                    .padding(.top, 2)
            }
            .background(PixelBox(corner: 3).fill(palette.shadow).offset(x: 2, y: 2))
            .offset(x: pressed ? 1 : 0, y: pressed ? 1 : 0)
            .contentShape(Rectangle())
    }
}

struct PixelTabStyle: ButtonStyle {
    @Environment(\.workbenchChrome) private var workbenchChrome
    let palette: PixelPalette
    let selected: Bool

    func makeBody(configuration: Configuration) -> some View {
        Group {
            if workbenchChrome {
                WorkbenchButtonStyle(palette: palette, selected: selected).makeBody(configuration: configuration)
            } else {
                pixelBody(configuration: configuration)
            }
        }
    }

    private func pixelBody(configuration: Configuration) -> some View {
        configuration.label
            .font(PixelFont.font(12))
            .foregroundStyle(palette.ink)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 5)
            .padding(.vertical, 5)
            .background(PixelBox(corner: 2).fill(selected ? palette.accent : palette.panelAlt))
            .overlay(PixelBox(corner: 2).stroke(palette.border, lineWidth: 2))
            .overlay(alignment: .bottom) {
                if !selected {
                    Rectangle().fill(palette.shadow.opacity(0.35)).frame(height: 1)
                }
            }
            .offset(y: configuration.isPressed ? 1 : 0)
            .contentShape(Rectangle())
    }
}

// MARK: - Toggle

struct PixelToggleStyle: ToggleStyle {
    @Environment(\.workbenchChrome) private var workbenchChrome
    let palette: PixelPalette

    @ViewBuilder func makeBody(configuration: Configuration) -> some View {
        if workbenchChrome {
            Toggle(isOn: configuration.$isOn) { configuration.label }
                .toggleStyle(.checkbox)
                .font(.system(size: 12))
        } else {
            pixelBody(configuration: configuration)
        }
    }

    private func pixelBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(spacing: 6) {
                ZStack {
                    PixelBox(corner: 2).fill(palette.panelAlt)
                    PixelBox(corner: 2).stroke(palette.border, lineWidth: 2)
                    if configuration.isOn {
                        PixelGlyph(kind: .check, color: palette.green, size: 10)
                    }
                }
                .frame(width: 14, height: 14)

                configuration.label
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Slider

struct PixelSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let palette: PixelPalette

    private var span: Double { max(range.upperBound - range.lowerBound, 0.0001) }

    /// Dragging is continuous: the track maps the pointer straight to the range
    /// and only rounds to whole units, so the thumb follows the mouse instead of
    /// jumping between steps. `step` stays for keyboard and VoiceOver.
    private func apply(_ x: CGFloat, width: CGFloat) {
        let fraction = min(max(x / max(width, 1), 0), 1)
        let raw = range.lowerBound + Double(fraction) * span
        value = min(max(raw.rounded(), range.lowerBound), range.upperBound)
    }

    var body: some View {
        GeometryReader { proxy in
            let width = max(proxy.size.width, 1)
            let progress = (value - range.lowerBound) / span
            let thumbX = min(max(CGFloat(progress) * width, 0), width)
            ZStack(alignment: .leading) {
                PixelBox(corner: 2).fill(palette.panelDeep).frame(height: 6)
                PixelBox(corner: 2).fill(palette.accent).frame(width: thumbX, height: 6)
                PixelBox(corner: 2)
                    .fill(palette.panel)
                    .overlay(PixelBox(corner: 2).stroke(palette.border, lineWidth: 2))
                    .frame(width: 10, height: 14)
                    .offset(x: thumbX - 5)
            }
            .frame(width: width, height: 20)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0).onChanged { gesture in
                    apply(gesture.location.x, width: width)
                }
            )
            .accessibilityValue("\(Int(value))")
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: value = min(value + step, range.upperBound)
                case .decrement: value = max(value - step, range.lowerBound)
                @unknown default: break
                }
            }
        }
        .frame(height: 20)
    }
}

// MARK: - Window drag

/// Draggable strip for the workbench header. The window itself no longer enables
/// `isMovableByWindowBackground`, because that setting takes mouse drags away
/// from SwiftUI gestures and made the custom slider impossible to drag.
struct WindowDragArea: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView { DragView() }
    func updateNSView(_ nsView: NSView, context: Context) {}

    private final class DragView: NSView {
        override var mouseDownCanMoveWindow: Bool { true }

        override func mouseDown(with event: NSEvent) {
            window?.performDrag(with: event)
        }
    }
}

// MARK: - Select

struct PixelSelect: View {
    let options: [(id: String, name: String)]
    @Binding var selection: String
    let palette: PixelPalette
    var placeholder: String?

    private var currentName: String {
        options.first { $0.id == selection }?.name ?? placeholder ?? selection
    }

    var body: some View {
        Menu {
            ForEach(options.indices, id: \.self) { index in
                Button(options[index].name) { selection = options[index].id }
            }
        } label: {
            HStack(spacing: 4) {
                Text(currentName)
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
                    .lineLimit(1)
                Spacer(minLength: 4)
                PixelGlyph(kind: .chevron, color: palette.inkSoft, size: 10)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .contentShape(Rectangle())
        }
        .menuStyle(.button)
        .buttonStyle(PixelButtonStyle(palette: palette))
        .menuIndicator(.hidden)
        .fixedSize(horizontal: false, vertical: true)
    }
}

// MARK: - Field

struct PixelTextField: View {
    @Environment(\.workbenchChrome) private var workbenchChrome
    @Environment(\.usesWorkbenchWindowTypography) private var useWindowTypography
    @Environment(\.isFocused) private var focused
    @Binding var text: String
    let placeholder: String
    let palette: PixelPalette

    var body: some View {
        TextField(placeholder, text: $text)
            .textFieldStyle(.plain)
            .font(useWindowTypography ? WorkbenchTypography.body() : PixelFont.font(12))
            .foregroundStyle(palette.ink)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(PixelBox(corner: 2).fill(palette.panelAlt))
            .overlay {
                let stepped = workbenchChrome
                PixelBox(corner: 2, inset: stepped ? 0.5 : 0)
                    .stroke(stepped && focused ? palette.accentDeep : palette.border,
                            lineWidth: stepped && !focused ? 1 : 2)
                    .allowsHitTesting(false)
            }
    }
}
