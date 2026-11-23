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

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @FocusState private var focused: Bool

    private var palette: PixelPalette { theme.palette }

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
            WorkbenchCardHeading(title: "重要提醒", glyph: .bell, palette: palette) {
                Text("\(model.items.count)")
                    .font(.system(size: 11).monospacedDigit())
                    .foregroundStyle(palette.inkSoft)
                if !model.isAdding {
                    WorkbenchCardIconButton(glyph: .plus, title: "添加一条提醒", palette: palette) {
                        onBeginAdd()
                        model.isAdding = true
                    }
                }
            }

            ForEach(model.items.indices, id: \.self) { index in
                HStack(alignment: .top, spacing: 6) {
                    Rectangle()
                        .fill(palette.accent)
                        .frame(width: 5, height: 5)
                        .padding(.top, 5)
                    Text(model.items[index])
                        .font(.system(size: 12))
                        .foregroundStyle(palette.ink)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    WorkbenchCardIconButton(glyph: .close, title: "移除这条提醒", palette: palette) {
                        onClose(index)
                    }
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 5)
                .background(PixelBox(corner: 3).fill(palette.panelAlt))
            }

            if model.isAdding {
                HStack(spacing: 5) {
                    TextField("添加一条重要提醒…", text: $model.draft)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12))
                        .foregroundStyle(palette.ink)
                        .focused($focused)
                        .onSubmit(submit)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 4)
                        .workbenchCardField(palette: palette, focused: focused)

                    Button("添加", action: submit)
                        .workbenchButton(palette: palette, prominent: true)
                        .disabled(trimmedDraft.isEmpty)

                    WorkbenchCardIconButton(glyph: .close, title: "收起", palette: palette) {
                        model.isAdding = false
                        model.draft = ""
                    }
                }
            }
        }
        .padding(10)
        .frame(width: 240, alignment: .leading)
        .workbenchCardSurface(theme)
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

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @FocusState private var focused: Bool

    private var palette: PixelPalette { theme.palette }

    private var trimmed: String {
        model.text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        HStack(spacing: 6) {
            PixelGlyph(kind: .plus, color: palette.accent, size: 12)

            TextField("添加一条重要提醒…", text: $model.text)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundStyle(palette.ink)
                .focused($focused)
                .onSubmit(onSubmit)
                .padding(.horizontal, 6)
                .padding(.vertical, 4)
                .workbenchCardField(palette: palette, focused: focused)

            Button("添加", action: onSubmit)
                .workbenchButton(palette: palette, prominent: true)
                .disabled(trimmed.isEmpty)

            WorkbenchCardIconButton(glyph: .close, title: "取消", palette: palette, action: onCancel)
        }
        .padding(8)
        .frame(width: 288)
        .workbenchCardSurface(theme)
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
