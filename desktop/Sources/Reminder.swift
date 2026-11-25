import AppKit
import SwiftUI

struct TodoEntry: Codable, Equatable, Identifiable {
    var id = UUID()
    var text: String
    var completedAt: Date?
}

final class ReminderListModel: ObservableObject {
    // Completed entries keep their slots so restoring one also restores its order.
    @Published var entries: [TodoEntry] = []
    @Published var isAdding = false
    @Published var isCollapsed = false
    @Published var draft = ""
    @Published var editingID: UUID?
    @Published var editDraft = ""
    @Published var undoID: UUID?
    @Published var currentDay = Date()

    var pending: [TodoEntry] { entries.filter { $0.completedAt == nil } }
    var todayCompleted: [TodoEntry] {
        entries.filter { entry in
            entry.completedAt.map { Calendar.current.isDate($0, inSameDayAs: currentDay) } ?? false
        }
        .sorted { ($0.completedAt ?? .distantPast) > ($1.completedAt ?? .distantPast) }
    }
    var hasContent: Bool { !pending.isEmpty || !todayCompleted.isEmpty }
    var showsCompactCard: Bool { isCollapsed && !isAdding && editingID == nil }

    static func validatedText(_ text: String) -> String {
        String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(120))
    }

    func cancelEditing() {
        editingID = nil
        editDraft = ""
    }

    func movePending(from source: Int, to destination: Int) -> Bool {
        let slots = entries.indices.filter { entries[$0].completedAt == nil }
        guard source != destination, slots.indices.contains(source), slots.indices.contains(destination) else { return false }
        var ordered = slots.map { entries[$0] }
        let moved = ordered.remove(at: source)
        ordered.insert(moved, at: destination)
        var updated = entries
        for (slot, entry) in zip(slots, ordered) { updated[slot] = entry }
        entries = updated
        return true
    }
}

private struct ReminderRowFrames: PreferenceKey {
    static let defaultValue: [Int: CGRect] = [:]

    static func reduce(value: inout [Int: CGRect], nextValue: () -> [Int: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { _, latest in latest })
    }
}

struct ReminderListCard: View {
    private enum CoordinateSpace { case rows }

    private struct ReorderDrag: Equatable {
        let source: Int
        let location: CGPoint
    }

    static let expandedWidth: CGFloat = 240
    private static let compactCloseWidth: CGFloat = 26
    static let compactSize = CGSize(width: 88, height: 28)

    @ObservedObject var model: ReminderListModel
    let onAdd: (String) -> Void
    let onComplete: (UUID) -> Void
    let onRestore: (UUID) -> Void
    let onRemove: (UUID) -> Void
    let onBeginEdit: (TodoEntry) -> Void
    let onSaveEdit: (UUID, String) -> Void
    let onDayChange: () -> Void
    let onMove: (Int, Int) -> Void
    let onBeginAdd: () -> Void
    let onSetCollapsed: (Bool) -> Void
    let onHide: () -> Void
    let onSizeChange: (CGSize) -> Void

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @FocusState private var focused: Bool
    @FocusState private var editFocused: Bool
    @State private var showingCompleted = false
    @State private var rowFrames: [Int: CGRect] = [:]
    @GestureState private var reorderDrag: ReorderDrag?

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
        Group {
            if model.showsCompactCard {
                compactCard
            } else {
                expandedCard
            }
        }
        .workbenchCardSurface(theme)
        .background {
            GeometryReader { proxy in
                Color.clear
                    .onAppear { onSizeChange(proxy.size) }
                    .onChange(of: proxy.size, perform: onSizeChange)
            }
        }
        .onAppear { focusDraft() }
        .onChange(of: model.isAdding) { adding in
            if adding {
                focusDraft()
            } else {
                focused = false
            }
        }
        .onChange(of: model.editingID) { id in
            if let id {
                DispatchQueue.main.async {
                    if model.editingID == id { editFocused = true }
                }
            } else {
                editFocused = false
            }
        }
        .onChange(of: model.todayCompleted.isEmpty) { empty in
            if empty { showingCompleted = false }
        }
        .onReceive(NotificationCenter.default.publisher(for: .NSCalendarDayChanged)) { _ in
            onDayChange()
        }
    }

    private var compactCard: some View {
        HStack(spacing: 0) {
            Button {
                onSetCollapsed(false)
            } label: {
                HStack(spacing: 5) {
                    PixelGlyph(kind: .bell, color: palette.accentDeep, size: 11)
                    Text("\(model.pending.count)")
                        .font(.system(size: 11, weight: .medium).monospacedDigit())
                        .foregroundStyle(palette.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    PixelGlyph(kind: .chevron, color: palette.inkSoft, size: 8)
                }
                .frame(width: Self.compactSize.width - Self.compactCloseWidth, height: Self.compactSize.height)
            }
            .workbenchButton(palette: palette, card: true, quiet: true)
            .accessibilityLabel("展开待办提醒，\(model.pending.count) 条")
            .help("展开待办提醒")

            Button(action: onHide) {
                PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                    .frame(width: Self.compactCloseWidth, height: Self.compactSize.height)
            }
            .workbenchButton(palette: palette, card: true, quiet: true)
            .accessibilityLabel("隐藏待办提醒")
            .help("隐藏待办提醒")
            .overlay(alignment: .leading) {
                Rectangle()
                    .fill(palette.borderSoft)
                    .frame(width: 1, height: 12)
                    .accessibilityHidden(true)
                    .allowsHitTesting(false)
            }
        }
    }

    private var expandedCard: some View {
        VStack(alignment: .leading, spacing: 7) {
            WorkbenchCardHeading(title: "待办提醒", glyph: .bell, palette: palette) {
                Text("\(model.pending.count)")
                    .font(.system(size: 11).monospacedDigit())
                    .foregroundStyle(palette.inkSoft)
                if !model.isAdding {
                    WorkbenchCardIconButton(glyph: .plus, title: "添加待办", palette: palette, action: onBeginAdd)
                }
                WorkbenchCardIconButton(glyph: .chevronUp, title: "收起待办提醒", palette: palette) {
                    onSetCollapsed(true)
                }
                WorkbenchCardIconButton(glyph: .close, title: "隐藏待办提醒", palette: palette, action: onHide)
            }

            if model.pending.isEmpty && !model.isAdding {
                Text("暂无待办")
                    .font(.system(size: 12))
                    .foregroundStyle(palette.inkSoft)
                    .padding(.vertical, 3)
            } else {
                reminderRows
            }

            if let id = model.undoID {
                HStack(spacing: 5) {
                    PixelGlyph(kind: .check, color: palette.green, size: 10)
                    Text("已完成")
                        .font(.system(size: 12))
                        .foregroundStyle(palette.ink)
                    Spacer(minLength: 5)
                    Button("撤销") { onRestore(id) }
                        .workbenchButton(palette: palette, quiet: true)
                        .accessibilityIdentifier("todo-undo")
                }
                .padding(.horizontal, 5)
                .background(PixelBox(corner: 3).fill(palette.panelAlt))
            }

            if model.isAdding {
                HStack(spacing: 5) {
                    TextField("输入待办事项…", text: $model.draft)
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

                    WorkbenchCardIconButton(glyph: .close, title: "取消添加待办", palette: palette) {
                        model.isAdding = false
                        model.draft = ""
                    }
                }
            }
            if !model.todayCompleted.isEmpty { completedSection }
        }
        .padding(10)
        .fixedSize(horizontal: false, vertical: true)
        .frame(width: Self.expandedWidth, alignment: .leading)
    }

    private var reminderRows: some View {
        let target = reorderDrag.flatMap { destination(beforeReleaseAt: $0.location) }
        let pending = model.pending
        return VStack(spacing: 7) {
            ForEach(Array(pending.enumerated()), id: \.element.id) { index, entry in
                reminderRow(entry, index: index, pending: pending)
                    .background {
                        GeometryReader { proxy in
                            Color.clear.preference(
                                key: ReminderRowFrames.self,
                                value: [index: proxy.frame(in: .named(CoordinateSpace.rows))]
                            )
                        }
                    }
                    .overlay(alignment: index < (reorderDrag?.source ?? 0) ? .top : .bottom) {
                        if target == index, reorderDrag?.source != index {
                            Rectangle()
                                .fill(palette.accentDeep)
                                .frame(height: 2)
                                .offset(y: index < (reorderDrag?.source ?? 0) ? -4 : 4)
                                .allowsHitTesting(false)
                        }
                    }
            }
        }
        .coordinateSpace(name: CoordinateSpace.rows)
        .onPreferenceChange(ReminderRowFrames.self) { rowFrames = $0 }
    }

    private func reminderRow(_ entry: TodoEntry, index: Int, pending: [TodoEntry]) -> some View {
        HStack(alignment: .top, spacing: 6) {
            if pending.count > 1 {
                reorderHandle(index, items: pending)
                    .disabled(model.editingID != nil)
                    .allowsHitTesting(model.editingID == nil)
            }
            if model.editingID == entry.id {
                TextField("编辑待办", text: $model.editDraft)
                    .textFieldStyle(.plain)
                    .font(.system(size: 12))
                    .foregroundStyle(palette.ink)
                    .focused($editFocused)
                    .onSubmit {
                        let text = ReminderListModel.validatedText(model.editDraft)
                        if !text.isEmpty { onSaveEdit(entry.id, text) }
                    }
                    .onExitCommand { model.cancelEditing() }
                    .accessibilityIdentifier("todo-inline-editor")
                    .padding(3)
                    .workbenchCardField(palette: palette, focused: editFocused)
            } else {
                Button {
                    onBeginEdit(entry)
                } label: {
                    Text(entry.text)
                        .font(.system(size: 12))
                        .foregroundStyle(palette.ink)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(model.isAdding)
                .accessibilityLabel("编辑待办：\(entry.text)")
            }
            WorkbenchCardIconButton(glyph: .checkbox, title: "完成待办：\(entry.text)", palette: palette) {
                onComplete(entry.id)
            }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 5)
        .background(PixelBox(corner: 3).fill(
            reorderDrag?.source == index ? palette.panelDeep : palette.panelAlt
        ))
        .contextMenu {
            if model.editingID != entry.id {
                Button("删除待办", role: .destructive) { onRemove(entry.id) }
            }
        }
    }

    private var completedSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button {
                showingCompleted.toggle()
            } label: {
                HStack(spacing: 5) {
                    PixelGlyph(kind: showingCompleted ? .chevronUp : .chevron, color: palette.inkSoft, size: 8)
                    Text("今日已完成")
                    Spacer()
                    Text("\(model.todayCompleted.count)").monospacedDigit()
                }
                .font(.system(size: 12))
            }
            .workbenchButton(palette: palette, quiet: true)
            .accessibilityLabel(showingCompleted ? "收起今日已完成" : "展开今日已完成")
            .accessibilityValue("\(model.todayCompleted.count) 条")
            .accessibilityIdentifier("todo-today-completed")
            if showingCompleted {
                if model.todayCompleted.count > 4 {
                    ScrollView { completedRows }
                        .frame(height: 144)
                } else {
                    completedRows
                }
            }
        }
    }

    private var completedRows: some View {
        VStack(spacing: 4) {
            ForEach(model.todayCompleted) { entry in
                HStack(spacing: 5) {
                    Text(entry.text)
                        .font(.system(size: 12))
                        .foregroundStyle(palette.inkSoft)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    WorkbenchCardIconButton(glyph: .arrowLeft, title: "恢复待办：\(entry.text)", palette: palette) {
                        onRestore(entry.id)
                    }
                }
                .padding(.horizontal, 5)
            }
        }
    }

    private func reorderHandle(_ index: Int, items: [TodoEntry]) -> some View {
        PixelGlyph(kind: .grip, color: palette.inkSoft, size: 9)
            .frame(width: 16, height: 18)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 4, coordinateSpace: .named(CoordinateSpace.rows))
                    .updating($reorderDrag) { value, state, _ in
                        state = ReorderDrag(source: index, location: value.location)
                    }
                    .onEnded { value in
                        guard model.pending == items,
                              let target = destination(beforeReleaseAt: value.location),
                              target != index else { return }
                        onMove(index, target)
                    }
            )
            .help("按住拖动排序")
            .accessibilityElement()
            .accessibilityLabel("排序待办：\(items[index].text)")
            .accessibilityActions {
                if index > items.startIndex {
                    Button("上移") { onMove(index, index - 1) }
                }
                if index < items.count - 1 {
                    Button("下移") { onMove(index, index + 1) }
                }
            }
    }

    private func destination(beforeReleaseAt point: CGPoint) -> Int? {
        let bounds = rowFrames.values.reduce(CGRect.null) { $0.union($1) }
        guard bounds.contains(point) else { return nil }
        return model.pending.indices.min { first, second in
            func distance(to index: Int) -> CGFloat {
                guard let frame = rowFrames[index] else { return .infinity }
                return max(frame.minY - point.y, 0, point.y - frame.maxY)
            }
            return distance(to: first) < distance(to: second)
        }
    }

    private func focusDraft() {
        guard model.isAdding else { return }
        DispatchQueue.main.async {
            if model.isAdding { focused = true }
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

            TextField("输入待办事项…", text: $model.text)
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

            WorkbenchCardIconButton(glyph: .close, title: "取消添加待办", palette: palette, action: onCancel)
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
