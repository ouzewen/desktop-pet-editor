import AVFoundation
import Speech

struct MeetingRecord: Codable, Identifiable, Hashable {
    let id: UUID
    let startedAt: Date
    let language: String
    var tracks: [MeetingTrack]
    var captureNotice: String?

    static let directory = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Application Support", isDirectory: true)
        .appendingPathComponent(DesktopPetStorage.directoryName, isDirectory: true)
        .appendingPathComponent("Meetings", isDirectory: true)

    var folder: URL { Self.directory.appendingPathComponent(id.uuidString, isDirectory: true) }
    var transcriptURL: URL { folder.appendingPathComponent("逐字稿.txt") }
    var summaryURL: URL { folder.appendingPathComponent("会议总结.md") }

    func save() throws {
        try JSONEncoder().encode(self).write(to: folder.appendingPathComponent("recording.json"), options: .atomic)
    }

    static func history() -> [Self] {
        let folders = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil,
                                                                     options: .skipsHiddenFiles)) ?? []
        return folders.compactMap { folder in
            guard let data = try? Data(contentsOf: folder.appendingPathComponent("recording.json")),
                  let item = try? JSONDecoder().decode(Self.self, from: data),
                  item.folder.lastPathComponent == folder.lastPathComponent else { return nil }
            return item
        }.sorted { $0.startedAt > $1.startedAt }
    }

    static func == (lhs: Self, rhs: Self) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

struct MeetingLine {
    var time: TimeInterval
    let source: MeetingSource
    let text: String

    var timestamp: String {
        let seconds = Int(max(0, time))
        return String(format: "%02d:%02d:%02d", seconds / 3600, (seconds / 60) % 60, seconds % 60)
    }

    var formatted: String { "[\(timestamp) · \(source.title)] \(text)" }
}

@available(macOS 26, *)
enum MeetingNotes {
    nonisolated static func transcribe(track: MeetingTrack, in record: MeetingRecord) async throws -> [MeetingLine] {
        let file = try AVAudioFile(forReading: record.folder.appendingPathComponent(track.filename))
        guard file.length > 0 else { throw MeetingError.noAudio }
        guard SpeechTranscriber.isAvailable,
              let locale = await SpeechTranscriber.supportedLocale(equivalentTo: Locale(identifier: record.language))
        else { throw MeetingError.speechUnavailable }

        let transcriber = SpeechTranscriber(locale: locale, preset: .timeIndexedTranscriptionWithAlternatives)
        if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
            try await request.downloadAndInstall()
        }
        let analyzer = SpeechAnalyzer(modules: [transcriber])
        async let collected: [MeetingLine] = collect(transcriber: transcriber, track: track)
        do {
            if let end = try await analyzer.analyzeSequence(from: file) {
                try await analyzer.finalizeAndFinish(through: end)
            } else {
                await analyzer.cancelAndFinishNow()
            }
        } catch {
            await analyzer.cancelAndFinishNow()
            throw error
        }
        return try await collected
    }

    private static func collect(transcriber: SpeechTranscriber, track: MeetingTrack) async throws -> [MeetingLine] {
        var lines: [MeetingLine] = []
        for try await result in transcriber.results where result.isFinal {
            let text = String(result.text.characters).trimmingCharacters(in: .whitespacesAndNewlines)
            let time = result.range.start.seconds
            if !text.isEmpty, time.isFinite {
                lines.append(MeetingLine(time: track.offset + time, source: track.source, text: text))
            }
        }
        return lines
    }

    static func summarize(_ lines: [MeetingLine]) -> String {
        let (highlights, actions) = excerpts(from: lines)
        return ([
            "# 摘要", "根据逐字稿摘录，按会议时间排列。",
        ] + highlights.map { "- \($0.formatted)" } + [
            "", "# 总结", actions.isEmpty ? "未提取到明确的决定或待办，请查看逐字稿。" : "逐字稿中可能涉及决定或待办的内容",
        ] + actions.map { "- \($0.formatted)" }).joined(separator: "\n")
    }

    private static func excerpts(from lines: [MeetingLine]) -> (highlights: [MeetingLine], actions: [MeetingLine]) {
        guard !lines.isEmpty else { return ([], []) }
        let decisionTerms = ["决定", "确认", "结论", "达成", "定下来", "agreed", "decided", "decision"]
        let actionTerms = ["负责", "跟进", "待办", "下一步", "截止", "提交", "完成", "follow up", "action item", "deadline", "by tomorrow"]
        func score(_ line: MeetingLine, terms: [String]) -> Int {
            let text = line.text.lowercased()
            return terms.filter { text.contains($0) }.count
        }
        // Give each part of the recording a chance to contribute to the summary.
        let windowCount = min(lines.count, 6)
        let highlights = (0..<windowCount).compactMap { index in
            let start = index * lines.count / windowCount
            let end = (index + 1) * lines.count / windowCount
            return lines[start..<end].max {
                let terms = decisionTerms + actionTerms
                let lhs = score($0, terms: terms) * 50 + min($0.text.count, 100)
                let rhs = score($1, terms: terms) * 50 + min($1.text.count, 100)
                return lhs < rhs
            }
        }
        let actions = lines.filter { score($0, terms: decisionTerms + actionTerms) > 0 }
        return (highlights, Array(actions.suffix(6)))
    }
}
