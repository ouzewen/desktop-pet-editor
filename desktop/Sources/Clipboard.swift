import AppKit
import SwiftUI

// MARK: - Store

struct ClipboardItem: Identifiable {
    let id = UUID()
    let text: String
    let at: Date

    var preview: String {
        text
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

/// Keeps the last few things the user copied. Memory only: nothing is written to
/// disk, and a password manager's concealed markers are ignored.
final class ClipboardStore {
    static let limit = 15
    private static let maxLength = 5_000
    private static let concealed = NSPasteboard.PasteboardType("org.nspasteboard.ConcealedType")
    private static let transient = NSPasteboard.PasteboardType("org.nspasteboard.TransientType")

    private(set) var items: [ClipboardItem] = []
    var onChange: (() -> Void)?

    private var timer: Timer?
    private var lastChangeCount: Int

    init() {
        lastChangeCount = NSPasteboard.general.changeCount
    }

    func start() {
        guard timer == nil else { return }
        let next = Timer(timeInterval: 0.8, repeats: true) { [weak self] _ in
            self?.poll()
        }
        RunLoop.main.add(next, forMode: .common)
        timer = next
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    private func poll() {
        poll(NSPasteboard.general)
    }

    /// Visible for `--self-test`, which drives a throwaway pasteboard.
    func poll(_ pasteboard: NSPasteboard) {
        guard pasteboard.changeCount != lastChangeCount else { return }
        lastChangeCount = pasteboard.changeCount
        capture(from: pasteboard)
    }

    func capture(from pasteboard: NSPasteboard) {
        let types = pasteboard.types ?? []
        guard !types.contains(ClipboardStore.concealed),
              !types.contains(ClipboardStore.transient),
              let raw = pasteboard.string(forType: .string) else { return }
        add(raw)
    }

    func add(_ raw: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let text = String(trimmed.prefix(ClipboardStore.maxLength))
        if let index = items.firstIndex(where: { $0.text == text }) {
            let existing = items.remove(at: index)
            items.insert(existing, at: 0)
        } else {
            items.insert(ClipboardItem(text: text, at: Date()), at: 0)
        }
        if items.count > ClipboardStore.limit {
            items.removeLast(items.count - ClipboardStore.limit)
        }
        onChange?()
    }

    func copy(_ item: ClipboardItem) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(item.text, forType: .string)
        lastChangeCount = pasteboard.changeCount
        if let index = items.firstIndex(where: { $0.id == item.id }) {
            let existing = items.remove(at: index)
            items.insert(existing, at: 0)
        }
        onChange?()
    }

    func clear() {
        items.removeAll()
        onChange?()
    }
}

// MARK: - Panel

struct ClipboardCard: View {
    let items: [ClipboardItem]

    var onCopy: (ClipboardItem) -> Void = { _ in }
    var onClear: () -> Void = {}
    var onClose: () -> Void = {}

    @Environment(\.colorScheme) private var colorScheme
    @State private var copiedID: UUID?

    private var palette: PixelPalette { .of(colorScheme) }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 5) {
                PixelGlyph(kind: .clip, color: palette.accent, size: 12)
                Text("剪贴板")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                Spacer(minLength: 6)
                Text("\(items.count)")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1)
                    .background(PixelBox(corner: 1).fill(palette.panelDeep))
                Button(action: onClose) {
                    PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                        .frame(width: 15, height: 15)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help("关闭")
            }

            if items.isEmpty {
                Text("复制过的文字会出现在这里。")
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.inkSoft)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 6)
            } else {
                ScrollView {
                    VStack(spacing: 4) {
                        ForEach(items) { item in
                            HStack(alignment: .top, spacing: 6) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.preview)
                                        .font(PixelFont.font(11))
                                        .foregroundStyle(palette.ink)
                                        .lineLimit(2)
                                        .multilineTextAlignment(.leading)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                    Text(Self.time.string(from: item.at))
                                        .font(PixelFont.font(10))
                                        .foregroundStyle(palette.inkSoft.opacity(0.7))
                                }
                                Button {
                                    copy(item)
                                } label: {
                                    Text(copiedID == item.id ? "已复制" : "复制")
                                        .frame(minWidth: 34)
                                }
                                .buttonStyle(PixelButtonStyle(
                                    palette: palette,
                                    prominent: copiedID == item.id
                                ))
                                .help("复制到剪贴板")
                            }
                            .padding(.horizontal, 6)
                            .padding(.vertical, 5)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(PixelBox(corner: 1).fill(palette.panelAlt))
                        }
                    }
                }
                .frame(height: 300)

                HStack(spacing: 6) {
                    Button("清空", action: onClear)
                        .buttonStyle(PixelButtonStyle(palette: palette))
                    Spacer(minLength: 0)
                    Text("点「复制」再去粘贴")
                        .font(PixelFont.font(10))
                        .foregroundStyle(palette.inkSoft)
                }
            }
        }
        .padding(10)
        .frame(width: 300, alignment: .leading)
        .background(PixelBox(corner: 3).fill(palette.panel))
        .overlay(PixelBox(corner: 3).stroke(palette.border, lineWidth: 3))
        .overlay(PixelBox(corner: 1, inset: 4).stroke(palette.borderSoft.opacity(0.55), lineWidth: 1))
    }

    private func copy(_ item: ClipboardItem) {
        guard copiedID == nil else { return }
        onCopy(item)
        copiedID = item.id
        // Let the "已复制" label register before the panel gets out of the way.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            onClose()
        }
    }

    private static let time: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter
    }()
}
