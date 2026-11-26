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

    func remove(_ item: ClipboardItem) {
        guard items.contains(where: { $0.id == item.id }) else { return }
        items.removeAll { $0.id == item.id }
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
    var onDelete: (ClipboardItem) -> Void = { _ in }
    var onClear: () -> Void = {}
    var onClose: () -> Void = {}

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @State private var copiedID: UUID?

    static let width: CGFloat = 300
    private var palette: PixelPalette { theme.windowPalette }

    var body: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                WorkbenchCardHeading(title: "剪贴板", glyph: .clip, palette: palette) {
                    if !items.isEmpty {
                        Text("\(items.count) 条")
                            .font(.system(size: 11).monospacedDigit())
                            .foregroundStyle(palette.inkSoft)
                    }
                    Button(action: onClose) {
                        PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                            .frame(width: 12, height: 12)
                    }
                    .workbenchButton(palette: palette)
                    .accessibilityLabel("关闭")
                    .help("关闭")
                }

                if items.isEmpty {
                    Text("复制过的文字会出现在这里。")
                        .font(.system(size: 12))
                        .foregroundStyle(palette.inkSoft)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 7)
                } else {
                    if items.count > 4 {
                        ScrollView { rows }
                            .frame(height: 245)
                    } else {
                        rows
                    }

                    Button("清空", action: onClear)
                        .workbenchButton(palette: palette)
                        .accessibilityIdentifier("clipboard-clear")
                }
            }
        }
        .frame(width: Self.width)
        .workbenchCompanionStyle(theme)
    }

    private var rows: some View {
        VStack(spacing: 4) {
            ForEach(items) { item in
                HStack(alignment: .center, spacing: 5) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(verbatim: item.preview)
                            .font(.system(size: 12))
                            .foregroundStyle(palette.ink)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(Self.time.string(from: item.at))
                            .font(.system(size: 10).monospacedDigit())
                            .foregroundStyle(palette.inkSoft)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Button {
                        copy(item)
                    } label: {
                        Text(copiedID == item.id ? "已复制" : "复制")
                            .frame(minWidth: 34)
                    }
                    .workbenchButton(palette: palette, prominent: copiedID == item.id)
                    .help("复制到剪贴板")
                    .accessibilityIdentifier("clipboard-copy")
                    Button {
                        onDelete(item)
                    } label: {
                        PixelGlyph(kind: .close, color: palette.inkSoft, size: 8)
                            .frame(width: 10, height: 10)
                    }
                    .workbenchButton(palette: palette)
                    .accessibilityLabel("删除这一条")
                    .help("从剪贴板删除这一条")
                    .accessibilityIdentifier("clipboard-delete")
                }
                .padding(.horizontal, 7)
                .padding(.vertical, 6)
                .background(RoundedRectangle(cornerRadius: 8).fill(palette.panelAlt))
            }
        }
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
