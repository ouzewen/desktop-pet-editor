import AppKit
import SwiftUI

/// The three buttons that appear when the pointer rests on the pet.
struct QuickBar: View {
    let onTodo: () -> Void
    let onClipboard: () -> Void
    let onFocus: () -> Void

    @AppStorage("workbenchTheme") private var workbenchTheme = WorkbenchTheme.sand

    private var palette: PixelPalette { workbenchTheme.windowPalette }

    var body: some View {
        PixelPanel(palette: palette, padding: 5) {
            HStack(spacing: 4) {
                button(.todo, "待办", onTodo)
                    .help("打开待办提醒")
                    .accessibilityIdentifier("quick-bar-todo")
                button(.clip, "剪贴板", onClipboard)
                    .help("打开剪贴板记录")
                    .accessibilityIdentifier("quick-bar-clipboard")
                button(.timer, "专注", onFocus)
                    .accessibilityIdentifier("quick-bar-focus")
            }
        }
        .workbenchCompanionStyle(workbenchTheme)
        .fixedSize()
    }

    private func button(_ kind: PixelIconKind, _ title: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                PixelGlyph(kind: kind, color: palette.ink, size: 12)
                    .accessibilityHidden(true)
                Text(title)
                    .foregroundStyle(palette.ink)
            }
        }
        .workbenchButton(palette: palette, quiet: true)
    }
}
