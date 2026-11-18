import Foundation

/// Owns the local model backend. Prefers an already running Ollama on the default
/// port (development), otherwise starts the copy bundled inside the app on a
/// private port with a private model directory.
final class LocalRuntime {
    static let shared = LocalRuntime()

    static let embeddedPort = 11500
    static let modelName = "qwen2.5:1.5b-instruct"

    private(set) var baseURL = URL(string: "http://127.0.0.1:11434")!
    private(set) var isEmbedded = false
    /// Set when `prepare` fails, so the chat card can explain why.
    private(set) var failureReason: String?

    private var process: Process?
    private let session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 3
        return URLSession(configuration: config)
    }()

    private var supportDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let folder = base.appendingPathComponent("DesktopPet", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }

    private var runtimeDirectory: URL? {
        if let override = ProcessInfo.processInfo.environment["PET_RUNTIME_DIR"] {
            return URL(fileURLWithPath: override)
        }
        return Bundle.main.resourceURL?.appendingPathComponent("ollama", isDirectory: true)
    }

    private var bundledModel: URL? {
        guard let resources = Bundle.main.resourceURL else { return nil }
        let folder = resources.appendingPathComponent("model", isDirectory: true)
        let files = (try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)) ?? []
        return files.first { $0.pathExtension.lowercased() == "gguf" }
    }

    func prepare(progress: @escaping (String) -> Void, needsChatModel: Bool = true, completion: @escaping (Bool) -> Void) {
        probe(port: 11434) { [weak self] external in
            guard let self else { return }
            if external {
                self.baseURL = URL(string: "http://127.0.0.1:11434")!
                self.isEmbedded = false
                completion(true)
                return
            }
            guard let runtimeDirectory = self.runtimeDirectory,
                  FileManager.default.fileExists(atPath: runtimeDirectory.appendingPathComponent("ollama").path) else {
                self.failureReason = "这个构建没带本地模型运行时，用 --with-model 重新构建。"
                completion(false)
                return
            }
            self.failureReason = nil
            progress("正在启动本地模型…")
            self.startEmbedded(runtimeDirectory) { started in
                guard started else {
                    self.failureReason = "本地模型服务启动失败。"
                    completion(false)
                    return
                }
                self.baseURL = URL(string: "http://127.0.0.1:\(LocalRuntime.embeddedPort)")!
                self.isEmbedded = true
                if needsChatModel { self.ensureModel(progress: progress, completion: completion) }
                else { completion(true) }
            }
        }
    }

    func shutdown() {
        process?.terminate()
        process = nil
    }

    // MARK: Embedded server

    private func startEmbedded(_ directory: URL, completion: @escaping (Bool) -> Void) {
        if let process, process.isRunning {
            completion(true)
            return
        }
        let binary = directory.appendingPathComponent("ollama")
        let log = supportDirectory.appendingPathComponent("embedded-ollama.log")
        FileManager.default.createFile(atPath: log.path, contents: nil)
        guard let handle = try? FileHandle(forWritingTo: log) else {
            completion(false)
            return
        }
        let task = Process()
        task.executableURL = binary
        task.arguments = ["serve"]
        task.environment = runtimeEnvironment()
        task.standardOutput = handle
        task.standardError = handle
        task.currentDirectoryURL = directory
        do {
            try task.run()
            process = task
        } catch {
            completion(false)
            return
        }
        waitForServer(attempts: 30, completion: completion)
    }

    private func runtimeEnvironment() -> [String: String] {
        var environment = ProcessInfo.processInfo.environment
        environment["OLLAMA_HOST"] = "127.0.0.1:\(LocalRuntime.embeddedPort)"
        environment["OLLAMA_MODELS"] = supportDirectory.appendingPathComponent("models", isDirectory: true).path
        return environment
    }

    private func waitForServer(attempts: Int, completion: @escaping (Bool) -> Void) {
        guard attempts > 0 else {
            completion(false)
            return
        }
        probe(port: LocalRuntime.embeddedPort) { alive in
            if alive {
                completion(true)
            } else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    self.waitForServer(attempts: attempts - 1, completion: completion)
                }
            }
        }
    }

    private func probe(port: Int, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/version") else {
            completion(false)
            return
        }
        session.dataTask(with: url) { _, response, _ in
            let ok = (response as? HTTPURLResponse)?.statusCode == 200
            DispatchQueue.main.async { completion(ok) }
        }.resume()
    }

    // MARK: Model

    private func ensureModel(progress: @escaping (String) -> Void, completion: @escaping (Bool) -> Void) {
        fetchModels { [weak self] names in
            guard let self else { return }
            if names.contains(where: { $0 == LocalRuntime.modelName || $0.hasPrefix(LocalRuntime.modelName) }) {
                completion(true)
                return
            }
            self.importBundledModel(progress: progress, completion: completion)
        }
    }

    private func fetchModels(completion: @escaping ([String]) -> Void) {
        guard let url = URL(string: "/api/tags", relativeTo: baseURL) else {
            completion([])
            return
        }
        session.dataTask(with: url) { data, _, _ in
            var names: [String] = []
            if let data,
               let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let models = root["models"] as? [[String: Any]] {
                names = models.compactMap { $0["name"] as? String }
            }
            DispatchQueue.main.async { completion(names) }
        }.resume()
    }

    private func importBundledModel(progress: @escaping (String) -> Void, completion: @escaping (Bool) -> Void) {
        // A build without the bundled model still gets a working runtime; the chat
        // card then downloads the model through Ollama.
        guard let model = bundledModel else {
            completion(true)
            return
        }
        guard let runtimeDirectory else {
            completion(false)
            return
        }
        progress("第一次使用，正在准备本地模型（只需一次）…")
        let modelfile = supportDirectory.appendingPathComponent("Modelfile")
        let content = "FROM \(model.path)\nPARAMETER temperature 0.4\nPARAMETER num_predict 220\n"
        try? content.write(to: modelfile, atomically: true, encoding: .utf8)

        let task = Process()
        task.executableURL = runtimeDirectory.appendingPathComponent("ollama")
        task.arguments = ["create", LocalRuntime.modelName, "-f", modelfile.path]
        task.environment = runtimeEnvironment()
        task.currentDirectoryURL = runtimeDirectory
        task.standardOutput = FileHandle.nullDevice
        task.standardError = FileHandle.nullDevice
        task.terminationHandler = { finished in
            DispatchQueue.main.async {
                completion(finished.terminationStatus == 0)
            }
        }
        do {
            try task.run()
        } catch {
            completion(false)
        }
    }
}
