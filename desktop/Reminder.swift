import AppKit
import SwiftUI

final class ReminderListModel: ObservableObject {
    @Published var items: [String]
    @Published var isAdding = false
    @Published var draft = ""

    init(items: [String] = []) {
        self.items = items
    }
}

struct ReminderListCard: View {
    @ObservedObject var model: ReminderListModel
    let onAdd: (String) -> Void
    let onClose: (Int) -> Void
    let onBeginAdd: () -> Void
    let onHeightChange: (CGFloat) -> Void

    @Environment(\.colorScheme) private var colorScheme
    @FocusState private var focused: Bool

    private var palette: PixelPalette { .of(colorScheme) }

    private var trimmedDraft: String {
        model.draft.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func submit() {
        let value = trimmedDraft
        guard !value.isEmpty else { return }
        onAdd(value)
        model.draft = ""
        model.isAdding = false
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 5) {
                PixelGlyph(kind: .bell, color: palette.accent, size: 12)
                Text("重要提醒")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                Spacer(minLength: 6)
                if !model.isAdding {
                    Button {
                        onBeginAdd()
                        model.isAdding = true
                    } label: {
                        PixelGlyph(kind: .plus, color: palette.ink, size: 11)
                            .frame(width: 16, height: 16)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help("添加一条提醒")
                }
                Text("\(model.items.count)")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1)
                    .background(PixelBox(corner: 1).fill(palette.panelDeep))
            }

            ForEach(model.items.indices, id: \.self) { index in
                HStack(alignment: .top, spacing: 6) {
                    Rectangle()
                        .fill(palette.accent)
                        .frame(width: 5, height: 5)
                        .padding(.top, 5)
                    Text(model.items[index])
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.ink)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Button {
                        onClose(index)
                    } label: {
                        PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                            .frame(width: 15, height: 15)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help("移除这条提醒")
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 5)
                .background(PixelBox(corner: 1).fill(palette.panelAlt))
            }

            if model.isAdding {
                HStack(spacing: 5) {
                    TextField("添加一条重要提醒…", text: $model.draft)
                        .textFieldStyle(.plain)
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.ink)
                        .focused($focused)
                        .onSubmit(submit)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 4)
                        .background(PixelBox(corner: 1).fill(palette.panelDeep))

                    Button("添加", action: submit)
                        .buttonStyle(PixelButtonStyle(palette: palette))
                        .disabled(trimmedDraft.isEmpty)
                        .opacity(trimmedDraft.isEmpty ? 0.5 : 1)

                    Button {
                        model.isAdding = false
                        model.draft = ""
                    } label: {
                        PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                            .frame(width: 15, height: 15)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help("收起")
                }
            }
        }
        .padding(10)
        .frame(width: 240, alignment: .leading)
        .background(PixelBox(corner: 3).fill(palette.panel))
        .overlay(PixelBox(corner: 3).stroke(palette.border, lineWidth: 3))
        .overlay(PixelBox(corner: 1, inset: 4).stroke(palette.borderSoft.opacity(0.55), lineWidth: 1))
        .background(
            GeometryReader { proxy in
                Color.clear
                    .onAppear { onHeightChange(proxy.size.height) }
                    .onChange(of: proxy.size.height) { onHeightChange($0) }
            }
        )
        .onAppear {
            if model.isAdding {
                DispatchQueue.main.async { focused = true }
            }
        }
        .onChange(of: model.isAdding) { adding in
            if adding {
                DispatchQueue.main.async { focused = true }
            }
        }
        .onChange(of: model.items.count) { _ in
            if model.isAdding {
                DispatchQueue.main.async { focused = true }
            }
        }
    }
}

final class ReminderInputModel: ObservableObject {
    @Published var text = ""
}

struct ReminderInputCard: View {
    @ObservedObject var model: ReminderInputModel
    let onSubmit: () -> Void
    let onCancel: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @FocusState private var focused: Bool

    private var palette: PixelPalette { .of(colorScheme) }

    private var trimmed: String {
        model.text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        HStack(spacing: 6) {
            PixelGlyph(kind: .plus, color: palette.accent, size: 12)

            TextField("添加一条重要提醒…", text: $model.text)
                .textFieldStyle(.plain)
                .font(PixelFont.font(12))
                .foregroundStyle(palette.ink)
                .focused($focused)
                .onSubmit(onSubmit)
                .padding(.horizontal, 6)
                .padding(.vertical, 4)
                .background(PixelBox(corner: 1).fill(palette.panelDeep))

            Button("添加", action: onSubmit)
                .buttonStyle(PixelButtonStyle(palette: palette))
                .disabled(trimmed.isEmpty)
                .opacity(trimmed.isEmpty ? 0.5 : 1)

            Button(action: onCancel) {
                PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                    .frame(width: 15, height: 15)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .help("取消")
        }
        .padding(8)
        .frame(width: 288)
        .background(PixelBox(corner: 3).fill(palette.panel))
        .overlay(PixelBox(corner: 3).stroke(palette.border, lineWidth: 3))
        .overlay(PixelBox(corner: 1, inset: 4).stroke(palette.borderSoft.opacity(0.55), lineWidth: 1))
        .onAppear {
            DispatchQueue.main.async { focused = true }
        }
        .onExitCommand(perform: onCancel)
    }
}

final class ReminderHostingView<Content: View>: NSHostingView<Content> {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
}

final class ReminderPanel: NSPanel {
    override var canBecomeKey: Bool { true }
}
