import AppKit
import AVFoundation
import SwiftUI

@available(macOS 26, *)
@MainActor
final class MeetingRecorder: ObservableObject {
    enum Phase: Equatable {
        case idle, starting, recording(Date), saving, transcribing, summarizing

        var isRecording: Bool {
            if case .recording = self { return true }
            return false
        }

        var isCapturing: Bool { self == .starting || isRecording || self == .saving }
    }

    @Published var systemAudio = UserDefaults.standard.object(forKey: "meetingSystemAudio") as? Bool ?? true {
        didSet { preferencesChanged("meetingSystemAudio", value: systemAudio) }
    }
    @Published var microphone = UserDefaults.standard.object(forKey: "meetingMicrophone") as? Bool ?? true {
        didSet { preferencesChanged("meetingMicrophone", value: microphone) }
    }
    @Published var language = UserDefaults.standard.string(forKey: "meetingLanguage") ?? "zh-CN" {
        didSet { UserDefaults.standard.set(language, forKey: "meetingLanguage") }
    }
    @Published private(set) var phase: Phase = .idle {
        didSet { onStateChange(phase.isRecording) }
    }
    var canStart: Bool { phase == .idle && (systemAudio || microphone) }
    @Published private(set) var history: [MeetingRecord] = []
    @Published private(set) var selected: MeetingRecord?
    @Published private(set) var activeRecord: MeetingRecord?
    @Published private(set) var transcript = ""
    @Published private(set) var summary = ""
    @Published private(set) var notice = ""
    @Published private(set) var captureFailure: String?

    private let onStateChange: (Bool) -> Void
    private var capture: MeetingCapture?
    private var startupInterruption: Error?
    private var documentNotices: [UUID: String] = [:]

    init(onStateChange: @escaping (Bool) -> Void) {
        self.onStateChange = onStateChange
        history = MeetingRecord.history()
        select(history.first)
    }

    private func preferencesChanged(_ key: String, value: Bool) {
        UserDefaults.standard.set(value, forKey: key)
        onStateChange(phase.isRecording)
    }

    func select(_ record: MeetingRecord?) {
        selected = record
        transcript = record.flatMap { try? String(contentsOf: $0.transcriptURL, encoding: .utf8) } ?? ""
        summary = record.flatMap { try? String(contentsOf: $0.summaryURL, encoding: .utf8) } ?? ""
        notice = record.flatMap { documentNotices[$0.id] ?? $0.captureNotice } ?? ""
    }

    func start() {
        guard canStart else { return }
        var tracks: [MeetingTrack] = []
        if systemAudio { tracks.append(MeetingTrack(source: .system, filename: "系统声音.caf")) }
        if microphone {
            tracks.append(MeetingTrack(source: .microphone, filename: systemAudio ? "麦克风.caf" : "麦克风.m4a"))
        }
        let record = MeetingRecord(id: UUID(), startedAt: Date(), language: language, tracks: tracks)
        captureFailure = nil
        startupInterruption = nil
        activeRecord = record
        phase = .starting
        Task {
            do {
                try FileManager.default.createDirectory(at: record.folder, withIntermediateDirectories: true,
                                                        attributes: [.posixPermissions: 0o700])
                try record.save()
                let session = MeetingCapture(folder: record.folder, tracks: tracks) { [weak self] error in
                    Task { @MainActor in self?.interrupted(error, id: record.id) }
                }
                capture = session
                history.insert(record, at: 0)
                select(record)
                try await session.start()
                if let startupInterruption { throw startupInterruption }
                phase = .recording(Date())
            } catch {
                await finishCapture(record, interruption: error, transcribe: false)
            }
        }
    }

    private func interrupted(_ error: Error, id: UUID) {
        guard let record = activeRecord, record.id == id else { return }
        if phase == .starting {
            startupInterruption = error
        } else if phase.isRecording {
            phase = .saving
            Task { await finishCapture(record, interruption: error, transcribe: true) }
        }
    }

    func stop() {
        guard phase.isRecording, let record = activeRecord else { return }
        phase = .saving
        Task { await finishCapture(record, interruption: nil, transcribe: true) }
    }

    private func finishCapture(_ record: MeetingRecord, interruption: Error?, transcribe: Bool) async {
        let result = await capture?.stop()
        capture = nil
        var record = record
        record.tracks = result?.tracks ?? record.tracks
        if let error = interruption ?? result?.error {
            record.captureNotice = "录音提示：\(error.localizedDescription)"
        }
        let hasAudio = record.tracks.contains { track in
            let file = try? AVAudioFile(forReading: record.folder.appendingPathComponent(track.filename))
            return (file?.length ?? 0) > 0
        }
        guard hasAudio else {
            // Only remove the metadata created by this attempt. Leave any raw files for inspection.
            try? FileManager.default.removeItem(at: record.folder.appendingPathComponent("recording.json"))
            history.removeAll { $0.id == record.id }
            if selected?.id == record.id { select(history.first) }
            captureFailure = record.captureNotice ?? "没有收到音频。请确认音源后重试。"
            finishActivity()
            return
        }
        do {
            try record.save()
        } catch {
            record.captureNotice = "原始音频已保存，无法更新录音信息：\(error.localizedDescription)"
        }
        history.removeAll { $0.id == record.id }
        history.insert(record, at: 0)
        activeRecord = record
        if selected?.id == record.id { select(record) }
        if transcribe {
            phase = .transcribing
            await createNotes(for: record)
        } else {
            finishActivity()
        }
    }

    func retry() {
        guard phase == .idle, let record = selected else { return }
        setDocumentNotice(record.captureNotice ?? "", for: record)
        activeRecord = record
        phase = .transcribing
        Task { await createNotes(for: record) }
    }

    private func setDocumentNotice(_ message: String, for record: MeetingRecord) {
        documentNotices[record.id] = message
        if selected?.id == record.id { notice = message }
    }

    private func finishActivity() {
        activeRecord = nil
        phase = .idle
    }

    private func createNotes(for record: MeetingRecord) async {
        var lines: [MeetingLine] = []
        var trackNotices: [String] = []
        for track in record.tracks {
            do {
                let recognized = try await MeetingNotes.transcribe(track: track, in: record)
                lines += recognized
                if recognized.isEmpty { trackNotices.append("\(track.source.title)未识别到语音。") }
            } catch {
                trackNotices.append("\(track.source.title)转写失败：\(error.localizedDescription)")
            }
        }
        let messages = [record.captureNotice].compactMap { $0 } + trackNotices
        setDocumentNotice(messages.joined(separator: "\n"), for: record)
        defer { finishActivity() }
        guard !lines.isEmpty else { return }
        lines.sort { $0.time < $1.time }
        do {
            let text = (messages + lines.map(\.formatted)).joined(separator: "\n")
            try text.write(to: record.transcriptURL, atomically: true, encoding: .utf8)
            if selected?.id == record.id { transcript = text }

            phase = .summarizing
            let notes = MeetingNotes.summarize(lines)
            let result = messages.isEmpty ? notes : messages.joined(separator: "\n") + "\n\n" + notes
            try result.write(to: record.summaryURL, atomically: true, encoding: .utf8)
            if selected?.id == record.id { summary = result }
        } catch {
            setDocumentNotice("文稿保存失败：\(error.localizedDescription)", for: record)
        }
    }
}

enum MeetingHistorySearch {
    static let locale = Locale(identifier: "zh-CN")

    static func title(for record: MeetingRecord) -> String {
        let time = record.startedAt.formatted(.dateTime.hour().minute().second().locale(locale))
        return "会议录音 · \(time)"
    }

    static func dateLabel(for date: Date) -> String {
        date.formatted(.dateTime.year().month().day().locale(locale))
    }

    static func filter(_ history: [MeetingRecord], query: String) -> [MeetingRecord] {
        guard !query.isEmpty else { return history }
        return history.filter { record in
            title(for: record).localizedStandardContains(query) ||
                dateLabel(for: record.startedAt).contains(query)
        }
    }
}

@available(macOS 26, *)
struct MeetingWorkbenchView: View {
    private enum Document: String, CaseIterable {
        case minutes = "会议纪要"
        case transcript = "逐字稿"

        var copyTitle: String { self == .minutes ? "复制纪要" : "复制逐字稿" }
    }

    @ObservedObject var model: MeetingRecorder
    let palette: PixelPalette
    @State private var document = Document.minutes
    @State private var copyFeedback: UUID?
    @State private var historySearch = ""

    private let languages = [
        "zh-CN": "普通话", "yue-CN": "粤语", "en-US": "英语",
    ]
    private var searchQuery: String { historySearch.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var documentContents: String { document == .minutes ? model.summary : model.transcript }

    var body: some View {
        let query = searchQuery
        let shownHistory = MeetingHistorySearch.filter(model.history, query: query)
        let shownSelection = model.selected.flatMap { record in
            shownHistory.contains(record) ? record : nil
        }

        VStack(alignment: .leading, spacing: 12) {
            recordingControls

            if let failure = model.captureFailure {
                Label(failure, systemImage: "exclamationmark.circle")
                    .font(.callout)
                    .foregroundStyle(palette.ink)
                    .textSelection(.enabled)
                    .accessibilityIdentifier("meeting-capture-error")
            }

            HStack(spacing: 0) {
                historyPane(records: shownHistory, searching: !query.isEmpty, selection: shownSelection?.id)
                    .frame(width: 216)
                Rectangle()
                    .fill(palette.borderSoft)
                    .frame(width: 1)
                    .accessibilityHidden(true)
                if let record = shownSelection {
                    details(for: record)
                } else if !query.isEmpty {
                    emptyState(
                        shownHistory.isEmpty ? "没有匹配的录音" : "选择一条录音",
                        detail: shownHistory.isEmpty ? "试试其他标题或日期。" : "从左侧搜索结果打开录音详情。",
                        icon: "magnifyingglass"
                    )
                    .padding(20)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    emptyState("还没有会议录音", detail: "开始录音后，可以在这里查看和复制纪要、逐字稿。", icon: "waveform")
                        .padding(20)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .frame(maxHeight: .infinity)
            .background(palette.panel)
            .clipShape(PixelBox(corner: 3))
            .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1).allowsHitTesting(false))
        }
        .padding(16)
        .onChange(of: model.selected?.id, initial: true) {
            document = model.summary.isEmpty && !model.transcript.isEmpty ? .transcript : .minutes
            copyFeedback = nil
        }
        .onChange(of: document) { copyFeedback = nil }
        .task(id: copyFeedback) {
            guard copyFeedback != nil else { return }
            try? await Task.sleep(for: .seconds(2))
            if !Task.isCancelled { copyFeedback = nil }
        }
    }

    private var recordingControls: some View {
        let recording = model.phase.isRecording
        let enabled = recording || model.canStart
        return HStack(spacing: 14) {
            PixelGlyph(kind: .microphone, color: recording ? palette.red : palette.ink, size: 22)
                .frame(width: 46, height: 46)
                .background(PixelBox(corner: 3).fill(palette.panelDeep))

            VStack(alignment: .leading, spacing: 7) {
                phaseStatus
                HStack(spacing: 14) {
                    Toggle("系统声音", isOn: $model.systemAudio)
                        .help("录制电脑播放的声音")
                        .accessibilityIdentifier("meeting-source-system")
                    Toggle("麦克风", isOn: $model.microphone)
                        .help("录制你和周围的声音")
                        .accessibilityIdentifier("meeting-source-microphone")
                    Picker("转写语言", selection: $model.language) {
                        Text("普通话").tag("zh-CN")
                        Text("粤语").tag("yue-CN")
                        Text("英语").tag("en-US")
                    }
                    .fixedSize()
                    .accessibilityIdentifier("meeting-language")
                }
                .font(.callout)
                .foregroundStyle(palette.ink)
                .disabled(model.phase != .idle)
            }

            Spacer(minLength: 12)
            Button {
                if recording { model.stop() } else { model.start() }
            } label: {
                Label(recording ? "结束录音" : "开始录音", systemImage: recording ? "stop.fill" : "record.circle")
                    .frame(minWidth: 94)
                    .padding(.vertical, 3)
            }
            .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
            .disabled(!enabled)
            .opacity(enabled ? 1 : 0.55)
            .accessibilityIdentifier("meeting-record-toggle")
        }
        .padding(12)
        .background(PixelBox(corner: 3).fill(palette.panelAlt))
        .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1).allowsHitTesting(false))
    }

    @ViewBuilder
    private var phaseStatus: some View {
        HStack(spacing: 8) {
            switch model.phase {
            case .idle:
                Text("录音设置")
                if !model.canStart {
                    Text("请选择至少一个音源")
                        .font(.callout)
                        .foregroundStyle(palette.inkSoft)
                }
            case let .recording(started):
                Circle()
                    .fill(palette.red)
                    .frame(width: 8, height: 8)
                    .accessibilityHidden(true)
                Text("录音中")
                Text(started, style: .timer)
                    .monospacedDigit()
                    .fixedSize()
                    .accessibilityIdentifier("meeting-record-timer")
            default:
                ProgressView().controlSize(.small)
                Text(activityTitle)
                if model.phase == .transcribing {
                    Text("首次使用可能下载语言模型")
                        .font(.callout)
                        .foregroundStyle(palette.inkSoft)
                }
            }
        }
        .font(.headline)
        .foregroundStyle(palette.ink)
        .accessibilityIdentifier("meeting-record-status")
    }

    private var activityTitle: String {
        switch model.phase {
        case .idle: return ""
        case .starting: return "正在启动录音"
        case .recording: return "录音中"
        case .saving: return "正在保存音频"
        case .transcribing: return "正在转写"
        case .summarizing: return "正在整理纪要"
        }
    }

    private func historyPane(records: [MeetingRecord], searching: Bool, selection: UUID?) -> some View {
        let calendar = Calendar.current
        let days = Dictionary(grouping: records) { calendar.startOfDay(for: $0.startedAt) }
        return VStack(alignment: .leading, spacing: 0) {
            Text("录音记录")
                .font(PixelFont.font(14))
                .foregroundStyle(palette.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .accessibilityAddTraits(.isHeader)

            historySearchField

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 5) {
                        if days.isEmpty {
                            Text(searching ? "无搜索结果" : "暂无记录")
                                .font(.callout)
                                .foregroundStyle(palette.inkSoft)
                                .padding(.horizontal, 4)
                        }
                        ForEach(days.keys.sorted(by: >), id: \.self) { day in
                            Text(MeetingHistorySearch.dateLabel(for: day))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(palette.inkSoft)
                                .padding(.leading, 4)
                                .padding(.top, 4)
                                .accessibilityAddTraits(.isHeader)
                            ForEach(days[day] ?? []) { record in
                                historyRow(record)
                                    .id(record.id)
                            }
                        }
                    }
                    .padding(.horizontal, 9)
                    .padding(.bottom, 10)
                }
                .accessibilityIdentifier("meeting-history")
                .onChange(of: selection, initial: true) {
                    if let selection { proxy.scrollTo(selection) }
                }
            }

            Label("录音和文稿保存在本机", systemImage: "internaldrive")
                .font(.caption)
                .foregroundStyle(palette.inkSoft)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.panelDeep)
    }

    private var historySearchField: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(palette.inkSoft)
                    .accessibilityHidden(true)
                TextField("搜索标题或日期", text: $historySearch)
                    .textFieldStyle(.plain)
                    .foregroundStyle(palette.ink)
                    .accessibilityIdentifier("meeting-history-search")
                if !historySearch.isEmpty {
                    Button {
                        historySearch = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(palette.inkSoft)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("清空搜索")
                    .accessibilityIdentifier("meeting-history-clear-search")
                }
            }
            .font(.callout)
            .padding(7)
            .background(PixelBox(corner: 3).fill(palette.panel))
            .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1).allowsHitTesting(false))

            Text("例如 2026年11月21日")
                .font(.caption)
                .foregroundStyle(palette.inkSoft)
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 10)
    }

    private func historyRow(_ record: MeetingRecord) -> some View {
        let selected = record.id == model.selected?.id
        let activity = record.id == model.activeRecord?.id ? activityTitle : ""
        return Button { model.select(record) } label: {
            HStack(spacing: 6) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(MeetingHistorySearch.title(for: record))
                        .font(.system(size: 14, weight: .semibold).monospacedDigit())
                        .foregroundStyle(palette.ink)
                    Text(activity.isEmpty ? sourceNames(record) : activity)
                        .font(.caption)
                        .foregroundStyle(palette.inkSoft)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                if selected { PixelGlyph(kind: .arrowRight, color: palette.inkSoft, size: 13) }
            }
            .padding(.horizontal, 9)
            .padding(.vertical, 8)
            .background {
                if selected {
                    PixelBox(corner: 3).fill(palette.panel)
                        .overlay(PixelBox(corner: 3).stroke(palette.accentDeep, lineWidth: 1))
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("meeting-history-row-\(record.id)")
    }

    private func sourceNames(_ record: MeetingRecord) -> String {
        record.tracks.map(\.source.title).joined(separator: "、")
    }

    private func details(for record: MeetingRecord) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(record.startedAt.formatted(.dateTime.year().month().day().hour().minute().locale(MeetingHistorySearch.locale)))
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(palette.ink)
                        .accessibilityAddTraits(.isHeader)
                    Text([sourceNames(record), languages[record.language] ?? record.language]
                        .filter { !$0.isEmpty }.joined(separator: " · "))
                        .font(.callout)
                        .foregroundStyle(palette.inkSoft)
                }
                Spacer(minLength: 10)
                recordActions(record)
            }

            HStack(spacing: 10) {
                Picker("文稿", selection: $document) {
                    ForEach(Document.allCases, id: \.self) { item in
                        Text(item.rawValue).tag(item)
                    }
                }
                .labelsHidden()
                .pickerStyle(.segmented)
                .frame(width: 174)
                .accessibilityIdentifier("meeting-document-tabs")
                Spacer(minLength: 6)
                copyButton
            }
            documentPane(for: record)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func recordActions(_ record: MeetingRecord) -> some View {
        Menu {
            Button("在 Finder 中查看") {
                NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: record.folder.path)
            }
            .disabled(model.activeRecord?.id == record.id && model.phase.isCapturing)
            if !model.summary.isEmpty || !model.transcript.isEmpty {
                Button("重新转写", action: model.retry)
                    .disabled(model.phase != .idle)
            }
        } label: {
            Label("更多", systemImage: "ellipsis.circle")
                .foregroundStyle(palette.ink)
        }
        .menuStyle(.borderlessButton)
        .menuIndicator(.hidden)
        .fixedSize()
        .accessibilityIdentifier("meeting-record-actions")
    }

    private var copyButton: some View {
        Button {
            let contents = documentContents
            guard !contents.isEmpty else { return }
            let pasteboard = NSPasteboard.general
            pasteboard.clearContents()
            if pasteboard.setString(contents, forType: .string) { copyFeedback = UUID() }
        } label: {
            Label(copyFeedback == nil ? document.copyTitle : "已复制",
                  systemImage: copyFeedback == nil ? "doc.on.doc" : "checkmark")
                .frame(minWidth: 76)
        }
        .buttonStyle(PixelButtonStyle(palette: palette))
        .disabled(documentContents.isEmpty)
        .opacity(documentContents.isEmpty ? 0.55 : 1)
        .accessibilityIdentifier("meeting-copy-document")
    }

    private func documentPane(for record: MeetingRecord) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if !model.notice.isEmpty && !documentContents.hasPrefix(model.notice + "\n") {
                    Label(model.notice, systemImage: "info.circle")
                        .font(.callout)
                        .foregroundStyle(palette.inkSoft)
                        .textSelection(.enabled)
                }

                if documentContents.isEmpty {
                    emptyDocument(for: record)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                } else {
                    Text(formattedDocument(documentContents))
                        .font(.system(size: 14))
                        .foregroundStyle(palette.ink)
                        .lineSpacing(5)
                        .textSelection(.enabled)
                        .accessibilityIdentifier("meeting-document-text")
                }
            }
            .frame(maxWidth: 740, alignment: .leading)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .id(document)
        .id(record.id)
        .frame(maxHeight: .infinity)
        .background(PixelBox(corner: 3).fill(palette.panelAlt))
        .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1).allowsHitTesting(false))
    }

    @ViewBuilder
    private func emptyDocument(for record: MeetingRecord) -> some View {
        if model.activeRecord?.id == record.id {
            let detail = model.phase == .starting || model.phase.isRecording
                ? "结束录音后会自动转写并整理纪要。"
                : "处理期间仍可查看其他录音记录。"
            emptyState(activityTitle, detail: detail, icon: "waveform")
        } else {
            VStack(spacing: 12) {
                if document == .minutes && !model.transcript.isEmpty {
                    emptyState("暂无会议纪要", detail: "可先查看逐字稿。", icon: "text.alignleft")
                    Button("查看逐字稿") { document = .transcript }
                        .buttonStyle(PixelButtonStyle(palette: palette))
                } else {
                    emptyState("暂无\(document.rawValue)", detail: "录音文件可从上方的「更多」打开。", icon: "text.alignleft")
                    if model.phase == .idle && model.summary.isEmpty && model.transcript.isEmpty {
                        Button("重新转写", action: model.retry)
                            .buttonStyle(PixelButtonStyle(palette: palette))
                    }
                }
            }
        }
    }

    private func emptyState(_ title: String, detail: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundStyle(palette.inkSoft)
                .accessibilityHidden(true)
            Text(title)
                .font(.headline)
                .foregroundStyle(palette.ink)
            Text(detail)
                .font(.callout)
                .foregroundStyle(palette.inkSoft)
                .multilineTextAlignment(.center)
        }
    }

    private func formattedDocument(_ source: String) -> AttributedString {
        var result = AttributedString()
        for (index, line) in source.components(separatedBy: "\n").enumerated() {
            if index > 0 { result.append(AttributedString("\n")) }
            if document == .minutes {
                let hashes = line.prefix { $0 == "#" }
                if !hashes.isEmpty, line.dropFirst(hashes.count).hasPrefix(" ") {
                    var heading = AttributedString(String(line.dropFirst(hashes.count + 1)))
                    heading.font = .system(size: 16, weight: .semibold)
                    result.append(heading)
                } else if line.hasPrefix("- ") || line.hasPrefix("* ") {
                    result.append(AttributedString("• " + line.dropFirst(2)))
                } else {
                    result.append(AttributedString(line))
                }
            } else if line.hasPrefix("["), let separator = line.range(of: "] ") {
                var timestamp = AttributedString(String(line[..<separator.upperBound]))
                timestamp.font = .system(size: 12, weight: .medium).monospacedDigit()
                timestamp.foregroundColor = palette.inkSoft
                result.append(timestamp)
                result.append(AttributedString(String(line[separator.upperBound...])))
            } else {
                result.append(AttributedString(line))
            }
        }
        return result
    }
}
