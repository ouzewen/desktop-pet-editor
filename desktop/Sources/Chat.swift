import AppKit
import Foundation
import SQLite3
import SwiftUI

// MARK: - Memory

/// Three facts only: name, preferences, routine. Stored in a local SQLite file.
final class PetMemory {
    enum Slot: String, CaseIterable {
        case name = "名字"
        case likes = "喜好"
        case routine = "作息"
    }

    private var database: OpaquePointer?
    /// SQLite must copy bound strings itself; a nil destructor would leave it
    /// holding a freed Swift buffer, which reads back as an empty value.
    private static let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

    init(path: String? = nil) {
        let file: String
        if let path {
            file = path
        } else {
            let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
                ?? URL(fileURLWithPath: NSTemporaryDirectory())
            let folder = base.appendingPathComponent(DesktopPetStorage.directoryName, isDirectory: true)
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            file = folder.appendingPathComponent("pet-memory.sqlite").path
        }
        guard sqlite3_open(file, &database) == SQLITE_OK else { return }
        sqlite3_exec(database, "CREATE TABLE IF NOT EXISTS facts (slot TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)", nil, nil, nil)
    }

    deinit {
        sqlite3_close(database)
    }

    func value(for slot: Slot) -> String? {
        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }
        guard sqlite3_prepare_v2(database, "SELECT value FROM facts WHERE slot = ?", -1, &statement, nil) == SQLITE_OK else { return nil }
        sqlite3_bind_text(statement, 1, slot.rawValue, -1, PetMemory.transient)
        guard sqlite3_step(statement) == SQLITE_ROW, let text = sqlite3_column_text(statement, 0) else { return nil }
        return String(cString: text)
    }

    /// Synchronous: the rows are tiny, and callers read the summary right after
    /// a message, so a background queue would race the next prompt.
    func set(_ slot: Slot, _ value: String) {
        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }
        let sql = "INSERT INTO facts (slot, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(slot) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
        guard sqlite3_prepare_v2(database, sql, -1, &statement, nil) == SQLITE_OK else { return }
        sqlite3_bind_text(statement, 1, slot.rawValue, -1, PetMemory.transient)
        sqlite3_bind_text(statement, 2, value, -1, PetMemory.transient)
        sqlite3_bind_int64(statement, 3, Int64(Date().timeIntervalSince1970))
        sqlite3_step(statement)
    }

    func summary() -> String {
        Slot.allCases.compactMap { slot in
            value(for: slot).map { "\(slot.rawValue)：\($0)" }
        }.joined(separator: "；")
    }

    /// Grabs the three facts from a sentence, if present.
    @discardableResult
    func remember(from text: String) -> Bool {
        var learned = false
        if let name = PetMemory.match(text, patterns: ["我叫([^，。！？,.!?\\s]{1,12})", "我的名字是([^，。！？,.!?\\s]{1,12})", "叫我([^，。！？,.!?\\s]{1,12})"]) {
            set(.name, name)
            learned = true
        }
        if let likes = PetMemory.match(text, patterns: ["我(?:很|最|特别)?喜欢([^。！？!?]{1,20})", "我(?:爱|讨厌|不喜欢)([^。！？!?]{1,20})"]) {
            set(.likes, likes)
            learned = true
        }
        if text.contains("起床") || text.contains("睡觉") || text.contains("作息") || text.contains("上班") || text.contains("下班") {
            set(.routine, text.trimmingCharacters(in: .whitespacesAndNewlines))
            learned = true
        }
        return learned
    }

    private static func match(_ text: String, patterns: [String]) -> String? {
        for pattern in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
            let range = NSRange(text.startIndex..., in: text)
            if let result = regex.firstMatch(in: text, range: range),
               result.numberOfRanges > 1,
               let captured = Range(result.range(at: 1), in: text) {
                let value = String(text[captured]).trimmingCharacters(in: .whitespacesAndNewlines)
                if !value.isEmpty { return value }
            }
        }
        return nil
    }
}

// MARK: - Ollama

final class OllamaClient {
    enum Status {
        case ready
        case pulling(Double)
        case missing(String)
    }

    static let shared = OllamaClient()
    static var host: URL { LocalRuntime.shared.baseURL }
    /// The ModelScope reference first; callers fall back to the short registry name.
    static let modelNames = [
        "modelscope.cn/Qwen/Qwen2.5-1.5B-Instruct-GGUF",
        "qwen2.5:1.5b-instruct",
    ]

    private let session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 120
        config.timeoutIntervalForResource = 900
        return URLSession(configuration: config)
    }()

    private(set) var model: String?

    func check(completion: @escaping (Bool, String?) -> Void) {
        guard let url = URL(string: "/api/tags", relativeTo: OllamaClient.host) else {
            completion(false, nil)
            return
        }
        session.dataTask(with: url) { [weak self] data, _, error in
            guard error == nil, let data,
                  let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let models = root["models"] as? [[String: Any]] else {
                completion(false, nil)
                return
            }
            let names = models.compactMap { $0["name"] as? String }
            let hit = OllamaClient.modelNames.first { candidate in
                names.contains { $0 == candidate || $0.hasPrefix(candidate) }
            }
            self?.model = hit
            completion(true, hit)
        }.resume()
    }

    func pull(_ name: String, progress: @escaping (Double) -> Void, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "/api/pull", relativeTo: OllamaClient.host) else {
            completion(false)
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["name": name, "stream": true])

        let delegate = PullDelegate(progress: progress, completion: completion)
        let pullSession = URLSession(configuration: .ephemeral, delegate: delegate, delegateQueue: nil)
        pullSession.dataTask(with: request).resume()
        // Keep the session alive until the task finishes.
        delegates.append((pullSession, delegate))
    }

    private var delegates: [(URLSession, PullDelegate)] = []

    func chat(
        messages: [[String: String]],
        temperature: Double = 0.4,
        completion: @escaping (String?) -> Void
    ) {
        guard let model else {
            completion(nil)
            return
        }
        guard let url = URL(string: "/api/chat", relativeTo: OllamaClient.host) else {
            completion(nil)
            return
        }
        let body: [String: Any] = [
            "model": model,
            "messages": messages,
            "stream": false,
            "options": ["temperature": temperature, "num_predict": 220],
        ]
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        session.dataTask(with: request) { data, _, _ in
            guard let data,
                  let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let message = root["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                completion(nil)
                return
            }
            completion(content.trimmingCharacters(in: .whitespacesAndNewlines))
        }.resume()
    }
}

final class PullDelegate: NSObject, URLSessionDataDelegate {
    private let progress: (Double) -> Void
    private let completion: (Bool) -> Void
    private var buffer = Data()

    init(progress: @escaping (Double) -> Void, completion: @escaping (Bool) -> Void) {
        self.progress = progress
        self.completion = completion
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        buffer.append(data)
        while let newline = buffer.firstIndex(of: 0x0A) {
            let line = buffer[buffer.startIndex..<newline]
            buffer.removeSubrange(buffer.startIndex...newline)
            guard let object = try? JSONSerialization.jsonObject(with: Data(line)) as? [String: Any] else { continue }
            if let total = object["total"] as? Double, let completed = object["completed"] as? Double, total > 0 {
                progress(min(completed / total, 1))
            } else if let status = object["status"] as? String, status == "success" {
                progress(1)
            }
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        completion(error == nil)
        session.finishTasksAndInvalidate()
    }
}

// MARK: - Search

enum SearchClient {
    struct Hit {
        let title: String
        let snippet: String
    }

    static func search(_ query: String, completion: @escaping ([Hit]) -> Void) {
        // Bing first: it is reachable from mainland networks where DDG is blocked.
        bing(query) { hits in
            if !hits.isEmpty {
                completion(hits)
                return
            }
            duckduckgo(query, completion: completion)
        }
    }

    private static func request(_ url: URL, completion: @escaping (Data?) -> Void) {
        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 10
        URLSession(configuration: .ephemeral).dataTask(with: request) { data, _, _ in
            completion(data)
        }.resume()
    }

    private static func duckduckgo(_ query: String, completion: @escaping ([Hit]) -> Void) {
        var components = URLComponents(string: "https://html.duckduckgo.com/html/")
        components?.queryItems = [URLQueryItem(name: "q", value: query)]
        guard let url = components?.url else {
            completion([])
            return
        }
        request(url) { data in
            guard let data, let html = String(data: data, encoding: .utf8) else {
                completion([])
                return
            }
            let titles = matches(html, pattern: "class=\"result__a\"[^>]*>(.*?)</a>")
            let snippets = matches(html, pattern: "class=\"result__snippet\"[^>]*>(.*?)</a>")
            let hits = zip(titles, snippets).prefix(5).map { Hit(title: $0, snippet: $1) }
            completion(hits)
        }
    }

    private static func bing(_ query: String, completion: @escaping ([Hit]) -> Void) {
        var components = URLComponents(string: "https://cn.bing.com/search")
        components?.queryItems = [URLQueryItem(name: "q", value: query)]
        guard let url = components?.url else {
            completion([])
            return
        }
        request(url) { data in
            guard let data, let html = String(data: data, encoding: .utf8) else {
                completion([])
                return
            }
            let titles = matches(html, pattern: "<h2><a[^>]*>(.*?)</a></h2>")
            let snippets = matches(html, pattern: "<p[^>]*>(.*?)</p>")
            let hits = zip(titles, snippets).prefix(5).map { Hit(title: $0, snippet: $1) }
            completion(hits)
        }
    }

    private static func matches(_ html: String, pattern: String) -> [String] {
        guard let regex = try? NSRegularExpression(
            pattern: pattern,
            options: [.dotMatchesLineSeparators, .caseInsensitive]
        ) else { return [] }
        let range = NSRange(html.startIndex..., in: html)
        return regex.matches(in: html, range: range).compactMap { result in
            guard result.numberOfRanges > 1, let captured = Range(result.range(at: 1), in: html) else { return nil }
            let text = strip(String(html[captured]))
            return text.isEmpty ? nil : text
        }
    }

    private static func strip(_ html: String) -> String {
        var text = html.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        let entities = ["&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&nbsp;": " "]
        for (key, value) in entities { text = text.replacingOccurrences(of: key, with: value) }
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Brain

final class ChatBrain {
    enum Decision {
        case search
        case direct
    }

    static let searchKeywords = ["天气", "新闻", "股票", "股价", "今天", "最新", "热搜", "行情", "最近发生", "现在几点"]

    let memory: PetMemory
    private let ollama = OllamaClient.shared

    init(memory: PetMemory) {
        self.memory = memory
    }

    /// Pulls the city out of "今天北京天气怎么样" style questions.
    static func city(in question: String) -> String? {
        guard let range = question.range(of: "天气") else { return nil }
        let prefix = String(question[..<range.lowerBound])
        let chinese = String(prefix.reversed().prefix { character in
            character.unicodeScalars.allSatisfy { (0x4E00...0x9FFF).contains($0.value) }
        }.reversed())
        var name = chinese
        for token in ["今天", "明天", "现在", "这几天", "最近"] {
            if name.hasPrefix(token) { name.removeFirst(token.count) }
            if name.hasSuffix(token) { name.removeLast(token.count) }
        }
        return name.count >= 2 ? name : nil
    }

    static func keywordDecision(_ question: String) -> Decision? {
        for keyword in searchKeywords where question.contains(keyword) {
            _ = keyword
            return .search
        }
        return nil
    }

    func respond(to question: String,
                 progress: @escaping (String) -> Void,
                 completion: @escaping (String) -> Void) {
        memory.remember(from: question)
        if let decision = ChatBrain.keywordDecision(question), decision == .search {
            searchAndAnswer(question, progress: progress, completion: completion)
            return
        }
        askDecision(question) { [weak self] wantsSearch in
            guard let self else { return }
            if wantsSearch {
                self.searchAndAnswer(question, progress: progress, completion: completion)
            } else {
                self.answerDirectly(question, completion: completion)
            }
        }
    }

    private func askDecision(_ question: String, completion: @escaping (Bool) -> Void) {
        let system = """
        你是分类器，只输出一个字：搜 或 不。
        只有需要实时信息（天气、新闻、股价、今天发生的事、最新消息）才输出「搜」；问名字、喜好、作息、常识、怎么做事，一律输出「不」。
        例子：
        今天北京天气怎么样 -> 搜
        今天有什么新闻 -> 搜
        你叫什么 -> 不
        我喜欢喝什么 -> 不
        怎么学英语 -> 不
        """
        ollama.chat(
            messages: [
                ["role": "system", "content": system],
                ["role": "user", "content": question],
            ],
            temperature: 0
        ) { answer in
            let decision = (answer ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            completion(decision.hasPrefix("搜"))
        }
    }

    private func answerDirectly(_ question: String, completion: @escaping (String) -> Void) {
        let facts = memory.summary()
        let system = """
        你叫小橘，是一只住在 Mac 桌面上的猫。说话简短、口语化，最多两句话。\
        别人问你是谁、叫什么名字，就回答「我是小橘，一只住在你 Mac 上的猫」。\
        \(facts.isEmpty ? "" : "关于主人：\(facts)。")
        """
        ollama.chat(messages: [
            ["role": "system", "content": system],
            ["role": "user", "content": question],
        ]) { answer in
            completion(answer ?? "我没想好怎么回答。")
        }
    }

    private func searchAndAnswer(_ question: String,
                                 progress: @escaping (String) -> Void,
                                 completion: @escaping (String) -> Void) {
        progress("搜索中…")
        SearchClient.search(question) { [weak self] hits in
            guard let self else { return }
            self.liveWeather(for: question) { weather in
                guard !hits.isEmpty || weather != nil else {
                    completion("没搜到。")
                    return
                }
                var sections: [String] = []
                if let weather { sections.append(weather) }
                if !hits.isEmpty {
                    sections.append(hits.map { "标题：\($0.title)\n摘要：\($0.snippet)" }.joined(separator: "\n\n"))
                }
                let context = sections.joined(separator: "\n\n")
                let system = "你是一只桌面猫。下面是联网查到的资料。用一句话口语化中文回答，必须说出具体的温度和天气状况；数字只能来自资料，不要编造，不要罗列结果。"
                let prompt = "资料：\n\(context)\n\n用户问题：\(question)"
                self.ollama.chat(messages: [
                    ["role": "system", "content": system],
                    ["role": "user", "content": prompt],
                ]) { answer in
                    completion(answer ?? "没搜到。")
                }
            }
        }
    }

    /// For weather questions, add the app's own Open-Meteo reading so the small
    /// model has real numbers instead of generic snippets.
    private func liveWeather(for question: String, completion: @escaping (String?) -> Void) {
        guard question.contains("天气"), let city = ChatBrain.city(in: question) else {
            completion(nil)
            return
        }
        WeatherLookup.coordinate(forCity: city) { coordinate, name in
            guard let coordinate else {
                completion(nil)
                return
            }
            WeatherLookup.forecast(coordinate: coordinate, city: name ?? city) { result in
                switch result {
                case .success(let snapshot):
                    completion(String(
                        format: "实时天气：%@ 今天 %.0f~%.0f℃，%@，降水概率 %d%%。",
                        snapshot.displayCity, snapshot.low, snapshot.high,
                        snapshot.condition, snapshot.rainChance
                    ))
                case .failure:
                    completion(nil)
                }
            }
        }
    }
}

// MARK: - Chat UI model

final class ChatModel: ObservableObject {
    struct Message: Identifiable {
        let id = UUID()
        let isUser: Bool
        let text: String
    }

    @Published var messages: [Message] = []
    @Published var input = ""
    @Published var status: String? = "准备模型…"
    @Published var busy = false

    let brain: ChatBrain
    private var prepared = false

    init(brain: ChatBrain) {
        self.brain = brain
    }

    var ready: Bool { status == nil }

    func prepare() {
        guard !prepared else { return }
        prepared = true
        LocalRuntime.shared.prepare(progress: { note in
            DispatchQueue.main.async { self.status = note }
        }, completion: { ok in
            DispatchQueue.main.async {
                guard ok else {
                    self.status = LocalRuntime.shared.failureReason ?? "这台电脑没有可用的本地模型。"
                    return
                }
                OllamaClient.shared.check { running, model in
                    DispatchQueue.main.async {
                        guard running else {
                            self.status = "本地模型服务没起来，稍后再试。"
                            return
                        }
                        if model != nil {
                            self.status = nil
                        } else {
                            self.pullModel()
                        }
                    }
                }
            }
        })
    }

    func retryPrepare() {
        prepared = false
        status = "准备模型…"
        prepare()
    }

    private func pullModel() {
        status = "第一次使用，正在下载模型（约 1GB）…"
        pullNext(index: 0)
    }

    private func pullNext(index: Int) {
        let names = OllamaClient.modelNames
        guard index < names.count else {
            status = "模型下载失败，稍后再试。"
            return
        }
        OllamaClient.shared.pull(names[index], progress: { fraction in
            DispatchQueue.main.async {
                self.status = "第一次使用，正在下载模型（约 1GB）… \(Int(fraction * 100))%"
            }
        }, completion: { success in
            DispatchQueue.main.async {
                if success {
                    OllamaClient.shared.check { _, model in
                        DispatchQueue.main.async {
                            self.status = model == nil ? "模型下载失败，稍后再试。" : nil
                        }
                    }
                } else {
                    self.pullNext(index: index + 1)
                }
            }
        })
    }

    func send() {
        let question = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty, !busy else { return }
        input = ""
        messages.append(Message(isUser: true, text: question))
        busy = true
        status = "想想…"
        brain.respond(to: question, progress: { note in
            DispatchQueue.main.async { self.status = note }
        }, completion: { answer in
            DispatchQueue.main.async {
                self.messages.append(Message(isUser: false, text: answer))
                self.status = nil
                self.busy = false
            }
        })
    }
}

struct ChatCard: View {
    @ObservedObject var model: ChatModel

    var onClose: () -> Void = {}
    var onHeightChange: (CGFloat) -> Void = { _ in }

    @Environment(\.colorScheme) private var colorScheme
    @FocusState private var focused: Bool

    private var palette: PixelPalette { .of(colorScheme) }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 5) {
                PixelGlyph(kind: .paw, color: palette.accent, size: 12)
                Text("问问桌宠")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                Spacer(minLength: 6)
                Button(action: onClose) {
                    PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                        .frame(width: 15, height: 15)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help("关闭")
            }

            if model.messages.isEmpty {
                Text("问我点什么吧，比如「你叫什么」「今天北京天气怎么样」。")
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.inkSoft)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 5) {
                            ForEach(model.messages) { message in
                                HStack(alignment: .top, spacing: 5) {
                                    Text(message.isUser ? "我" : "猫")
                                        .font(PixelFont.font(10))
                                        .foregroundStyle(palette.inkSoft)
                                        .padding(.top, 2)
                                    Text(message.text)
                                        .font(PixelFont.font(11))
                                        .foregroundStyle(palette.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .padding(.horizontal, 6)
                                .padding(.vertical, 4)
                                .background(PixelBox(corner: 1).fill(message.isUser ? palette.panelDeep : palette.panelAlt))
                                .id(message.id)
                            }
                        }
                        .padding(.bottom, 2)
                    }
                    .frame(height: 170)
                    .onAppear {
                        // Layout may not be ready on the first pass; retry once.
                        DispatchQueue.main.async { scrollToBottom(proxy, animated: false) }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            scrollToBottom(proxy, animated: false)
                        }
                    }
                    .onChange(of: model.messages.count) { _ in
                        scrollToBottom(proxy, animated: true)
                    }
                }
            }

            HStack(spacing: 6) {
                TextField("说点什么…", text: $model.input)
                    .textFieldStyle(.plain)
                    .font(PixelFont.font(11))
                    .foregroundStyle(palette.ink)
                    .focused($focused)
                    .onSubmit(send)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(PixelBox(corner: 1).fill(palette.panelDeep))
                    .disabled(!model.ready || model.busy)
                Button("发送", action: send)
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                    .disabled(!model.ready || model.busy)
                    .opacity((!model.ready || model.busy) ? 0.5 : 1)
            }

            if let status = model.status {
                Text(status)
                    .font(PixelFont.font(10))
                    .foregroundStyle(palette.inkSoft)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(10)
        .frame(width: 306, alignment: .leading)
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
            DispatchQueue.main.async { focused = true }
        }
        .onExitCommand(perform: onClose)
    }

    private func send() {
        model.send()
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy, animated: Bool) {
        guard let last = model.messages.last else { return }
        let scroll = { proxy.scrollTo(last.id, anchor: .bottom) }
        if animated {
            withAnimation(.easeOut(duration: 0.18)) { scroll() }
        } else {
            scroll()
        }
    }
}
