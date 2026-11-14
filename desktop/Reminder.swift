import AppKit
import SwiftUI

private let reminderAccent = Color(red: 0.90, green: 0.55, blue: 0.24)

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

    @FocusState private var focused: Bool

    private var trimmedDraft: String {
        model.draft.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func submit() {
        let value = trimmedDraft
        guard !value.isEmpty else { return }
        onAdd(value)
        model.draft = ""
        // One reminder per click: collapse the inline field again.
        model.isAdding = false
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "bell.fill")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(reminderAccent)
                Text("重要提醒")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer(minLength: 6)
                if !model.isAdding {
                    Button {
                        onBeginAdd()
                        model.isAdding = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(reminderAccent)
                    }
                    .buttonStyle(.plain)
                    .help("添加一条提醒")
                }
                Text("\(model.items.count)")
                    .font(.system(size: 9, weight: .semibold).monospacedDigit())
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 1)
                    .background(Capsule().fill(Color.primary.opacity(0.08)))
            }

            ForEach(model.items.indices, id: \.self) { index in
                HStack(alignment: .top, spacing: 8) {
                    Circle()
                        .fill(reminderAccent)
                        .frame(width: 5, height: 5)
                        .padding(.top, 5)
                    Text(model.items[index])
                        .font(.system(size: 12))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Button {
                        onClose(index)
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(Color.primary.opacity(0.34))
                            .frame(width: 16, height: 16)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help("移除这条提醒")
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(
                    Color.primary.opacity(0.05),
                    in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                )
            }

            if model.isAdding {
                HStack(spacing: 6) {
                    TextField("添加一条重要提醒…", text: $model.draft)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12))
                        .focused($focused)
                        .onSubmit(submit)
                    Button("添加", action: submit)
                        .buttonStyle(.borderedProminent)
                        .tint(reminderAccent)
                        .controlSize(.mini)
                        .disabled(trimmedDraft.isEmpty)
                    Button {
                        model.isAdding = false
                        model.draft = ""
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(Color.primary.opacity(0.34))
                            .frame(width: 16, height: 16)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help("收起")
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(
                    reminderAccent.opacity(0.08),
                    in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                )
            }
        }
        .padding(12)
        .frame(width: 240, alignment: .leading)
        .background(
            GeometryReader { proxy in
                Color.clear
                    .onAppear { onHeightChange(proxy.size.height) }
                    .onChange(of: proxy.size.height) { onHeightChange($0) }
            }
        )
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.10))
        )
        .shadow(color: .black.opacity(0.18), radius: 10, x: 0, y: 3)
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

    @FocusState private var focused: Bool

    private var trimmed: String {
        model.text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "plus.circle.fill")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(reminderAccent)

            TextField("添加一条重要提醒…", text: $model.text)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .focused($focused)
                .onSubmit(onSubmit)

            Button("添加", action: onSubmit)
                .buttonStyle(.borderedProminent)
                .tint(reminderAccent)
                .controlSize(.small)
                .disabled(trimmed.isEmpty)

            Button(action: onCancel) {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(Color.primary.opacity(0.34))
                    .frame(width: 16, height: 16)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .help("取消")
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(width: 288)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.10))
        )
        .shadow(color: .black.opacity(0.18), radius: 10, x: 0, y: 3)
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
