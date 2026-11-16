import AppKit
import SwiftUI

/// The three buttons that appear when the pointer rests on the pet.
struct QuickBar: View {
    var onChat: () -> Void = {}
    var onClipboard: () -> Void = {}
    var onFocus: () -> Void = {}

    @Environment(\.colorScheme) private var colorScheme

    private var palette: PixelPalette { .of(colorScheme) }

    var body: some View {
        HStack(spacing: 6) {
            button(.chat, "问问桌宠", onChat)
            button(.clip, "剪贴板", onClipboard)
            button(.timer, "专注", onFocus)
        }
        .padding(6)
        .background(PixelBox(corner: 2).fill(palette.panel.opacity(0.96)))
        .overlay(PixelBox(corner: 2).stroke(palette.border, lineWidth: 2))
    }

    private func button(_ kind: PixelIconKind, _ help: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            PixelGlyph(kind: kind, color: palette.ink, size: 14)
                .frame(width: 26, height: 26)
                .background(PixelBox(corner: 2).fill(palette.panelAlt))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .help(help)
    }
}
