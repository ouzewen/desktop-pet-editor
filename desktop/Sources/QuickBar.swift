import AppKit
import SwiftUI

/// The three buttons that appear when the pointer rests on the pet.
struct QuickBar: View {
    let isRecording: Bool
    let recordingUnavailableReason: String?
    let onRecording: () -> Void
    let onClipboard: () -> Void
    let onFocus: () -> Void

    @AppStorage("workbenchTheme") private var workbenchTheme = WorkbenchTheme.sand

    private var palette: PixelPalette { workbenchTheme.palette }
    private var recordingAction: String { isRecording ? "结束录音" : "开始录音" }

    var body: some View {
        PixelPanel(palette: palette, padding: 5) {
            HStack(spacing: 4) {
                button(.microphone, isRecording ? "停止" : "录音", color: isRecording ? palette.red : palette.ink, onRecording)
                    .disabled(recordingUnavailableReason != nil)
                    .opacity(recordingUnavailableReason == nil ? 1 : 0.6)
                    .help(recordingUnavailableReason ?? recordingAction)
                    .accessibilityLabel(recordingAction)
                    .accessibilityIdentifier("quick-bar-recording")
                button(.clip, "剪贴板", onClipboard)
                    .help("打开剪贴板记录")
                    .accessibilityIdentifier("quick-bar-clipboard")
                button(.timer, "专注", onFocus)
                    .accessibilityIdentifier("quick-bar-focus")
            }
        }
        .environment(\.workbenchChrome, true)
        .fixedSize()
    }

    private func button(_ kind: PixelIconKind, _ title: String, color: Color? = nil, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                PixelGlyph(kind: kind, color: color ?? palette.ink, size: 12)
                    .accessibilityHidden(true)
                Text(title)
                    .foregroundStyle(color ?? palette.ink)
            }
        }
        .workbenchButton(palette: palette)
    }
}
