import Darwin
import Foundation

enum OrganizationCategory: String, CaseIterable {
    case image = "图片", document = "文档", video = "视频", audio = "音频"
    case archive = "压缩包", installer = "应用安装包", code = "代码", other = "其他"

    private static let byExtension: [String: Self] = {
        let groups: [(Self, String)] = [
            (.image, "png jpg jpeg webp heic gif bmp svg"),
            (.document, "pdf doc docx xls xlsx ppt pptx txt md csv"),
            (.video, "mp4 mov mkv avi"),
            (.audio, "mp3 wav aac flac"),
            (.archive, "zip rar 7z tar gz"),
            (.installer, "dmg pkg"),
            (.code, "py js ts tsx swift java html css json"),
        ]
        return Dictionary(uniqueKeysWithValues: groups.flatMap { category, extensions in
            extensions.split(separator: " ").map { (String($0), category) }
        })
    }()

    static func classify(_ url: URL) -> Self { byExtension[url.pathExtension.lowercased()] ?? .other }
}

enum OrganizationKeyword: String, CaseIterable {
    case screenshot = "截图", contract = "合同", invoice = "发票", resume = "简历"

    static func match(_ name: String) -> Self? {
        let value = name.lowercased()
        if ["截图", "screen shot", "截屏"].contains(where: value.contains) { return .screenshot }
        if value.contains("合同") { return .contract }
        if value.contains("发票") { return .invoice }
        if ["简历", "resume"].contains(where: value.contains) { return .resume }
        return nil
    }
}

struct OrganizationSkip {
    let url: URL
    let reason: String
    let directory: Bool

    init(_ url: URL, _ reason: String, directory: Bool = false) {
        self.url = url
        self.reason = reason
        self.directory = directory
    }
}

struct OrganizationPlan {
    let root: URL
    fileprivate let rootIdentity: OrganizationIdentity
    let files: [OrganizationMove]
    let skipped: [OrganizationSkip]

    var fileCount: Int { files.count + skipped.count(where: { !$0.directory }) }
}

struct OrganizationMove: Codable {
    let name: String
    let month: String
    let keyword: String?
    let category: String
    fileprivate let stamp: OrganizationStamp

    var folders: [String] { [month] + (keyword.map { [$0] } ?? []) + [category] }
    func source(in root: URL) -> URL { root.appendingPathComponent(name) }
    func destination(in root: URL) -> URL {
        folders.reduce(root) { $0.appendingPathComponent($1, isDirectory: true) }.appendingPathComponent(name)
    }
}

struct OrganizationResult {
    let moved: Int
    let skipped: [OrganizationSkip]
    let batchID: UUID?
}

private struct OrganizationIdentity: Codable, Equatable {
    let device: Int32
    let inode: UInt64
}

private struct OrganizationStamp: Codable, Equatable {
    let identity: OrganizationIdentity
    let seconds: Int
    let nanoseconds: Int
    let size: Int64

    init(_ info: stat) {
        identity = OrganizationIdentity(device: info.st_dev, inode: info.st_ino)
        seconds = info.st_mtimespec.tv_sec
        nanoseconds = info.st_mtimespec.tv_nsec
        size = info.st_size
    }
}

private struct OrganizationDirectory: Codable {
    let components: [String]
    let identity: OrganizationIdentity
}

private struct OrganizationBatch: Codable {
    let id: UUID
    let root: URL
    let identity: OrganizationIdentity
    var files: [OrganizationMove] = []
    var created: [OrganizationDirectory] = []
}

enum OrganizationProblem: LocalizedError {
    case protectedLocation, changedFolder, unsafeDestination, occupied, changedFile, openFile, checkFailed, operationInProgress

    var errorDescription: String? {
        switch self {
        case .protectedLocation: return "系统目录或应用包属于受保护位置"
        case .changedFolder: return "原文件夹已移动、替换或无法访问"
        case .unsafeDestination: return "目标路径包含链接、非文件夹或其他卷"
        case .occupied: return "目标位置已存在同名文件"
        case .changedFile: return "文件在预览后发生变化，或已被移动或替换"
        case .openFile: return "文件正在打开"
        case .checkFailed: return "无法核对文件是否正在打开"
        case .operationInProgress: return "另一窗口正在整理文件，请稍后再试"
        }
    }
}

/// Run instances on a serial worker. Only a confirmed operation and its undo write files.
final class FileOrganizer {
    typealias OpenFileCheck = (URL) throws -> Bool

    private let fm = FileManager.default
    private let journal: URL
    private let calendar: Calendar
    private let isOpen: OpenFileCheck

    static let journalURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        .appendingPathComponent(DesktopPetStorage.directoryName, isDirectory: true)
        .appendingPathComponent("FileOrganization", isDirectory: true)
        .appendingPathComponent("moves.json")

    init(journal: URL = FileOrganizer.journalURL, timeZone: TimeZone = .current, isOpen: @escaping OpenFileCheck) {
        self.journal = journal
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        self.calendar = calendar
        self.isOpen = isOpen
    }

    func preview(_ folder: URL) throws -> OrganizationPlan {
        let root = folder.resolvingSymlinksInPath().standardizedFileURL
        let identity = try rootIdentity(root)
        var files: [OrganizationMove] = []
        var skipped: [OrganizationSkip] = []
        let organizedRoot = isOrganizedRoot(root)
        for url in try contents(root) {
            do {
                guard let info = try metadata(url) else { throw OrganizationProblem.changedFile }
                let directory = kind(info) == S_IFDIR
                if let reason = exclusion(url, info) {
                    skipped.append(OrganizationSkip(url, reason, directory: directory))
                } else if directory {
                    if isMonth(url.lastPathComponent) {
                        skipped.append(OrganizationSkip(url, "已整理的月份文件夹", directory: true))
                        skipped.append(contentsOf: contentsOfOrganizedMonth(url))
                    } else {
                        skipped.append(OrganizationSkip(url, "子文件夹，仅整理所选位置的直属文件", directory: true))
                    }
                } else if organizedRoot {
                    skipped.append(OrganizationSkip(url, "已在整理目录内"))
                } else {
                    guard info.st_dev == identity.device else { throw OrganizationProblem.unsafeDestination }
                    if try isOpen(url) { throw OrganizationProblem.openFile }
                    let stamp = OrganizationStamp(info)
                    let date = Date(timeIntervalSince1970: Double(stamp.seconds))
                    let parts = calendar.dateComponents([.year, .month], from: date)
                    guard let year = parts.year, let month = parts.month, (1...9999).contains(year) else {
                        throw OrganizationProblem.changedFile
                    }
                    let move = OrganizationMove(name: url.lastPathComponent, month: String(format: "%04d-%02d", year, month),
                        keyword: OrganizationKeyword.match(url.lastPathComponent)?.rawValue, category: OrganizationCategory.classify(url).rawValue,
                        stamp: stamp)
                    try checkDestination(move, in: root, onDevice: identity.device)
                    files.append(move)
                }
            } catch {
                skipped.append(OrganizationSkip(url, error.localizedDescription))
            }
        }
        files.sort { lhs, rhs in
            if lhs.month != rhs.month { return lhs.month > rhs.month }
            if lhs.keyword != rhs.keyword { return (lhs.keyword ?? "") < (rhs.keyword ?? "") }
            if lhs.category != rhs.category { return lhs.category < rhs.category }
            return lhs.name.localizedStandardCompare(rhs.name) == .orderedAscending
        }
        return OrganizationPlan(root: root, rootIdentity: identity, files: files, skipped: skipped)
    }

    func latestBatch(in root: URL) throws -> UUID? {
        try loadHistory().last(where: { $0.root.path == root.path && !$0.files.isEmpty })?.id
    }

    func execute(_ plan: OrganizationPlan, progress: (URL, URL, Int, Int, Bool) -> Void) throws -> OrganizationResult {
        try withHistoryLock { try executeLocked(plan, progress: progress) }
    }

    private func executeLocked(_ plan: OrganizationPlan, progress: (URL, URL, Int, Int, Bool) -> Void) throws -> OrganizationResult {
        try assertRoot(plan.root, plan.rootIdentity)
        let history = try loadHistory()
        var batch = OrganizationBatch(id: UUID(), root: plan.root, identity: plan.rootIdentity)
        var skipped = plan.skipped
        var moved = 0
        for (index, file) in plan.files.enumerated() {
            let source = file.source(in: plan.root)
            let destination = file.destination(in: plan.root)
            var succeeded = false
            do {
                try assertRoot(plan.root, plan.rootIdentity)
                guard let info = try metadata(source), OrganizationStamp(info) == file.stamp,
                      exclusion(source, info) == nil else { throw OrganizationProblem.changedFile }
                if try isOpen(source) { throw OrganizationProblem.openFile }
                try checkDestination(file, in: plan.root, onDevice: plan.rootIdentity.device)
                try ensureFolders(file, in: &batch)
                // Write ahead so even an interruption immediately after a move
                // leaves the original path and inode available to Undo.
                batch.files.append(file)
                do {
                    try saveHistory(history + [batch])
                } catch {
                    batch.files.removeLast()
                    throw error
                }
                try assertRoot(plan.root, plan.rootIdentity)
                try checkDestination(file, in: plan.root, onDevice: plan.rootIdentity.device)
                guard let current = try metadata(source), OrganizationStamp(current) == file.stamp,
                      exclusion(source, current) == nil else {
                    throw OrganizationProblem.changedFile
                }
                // A failed call can leave uncertain state. Its recorded
                // intent is resolved by Undo checking the inode on both paths.
                try fm.moveItem(at: source, to: destination)
                moved += 1
                succeeded = true
            } catch {
                skipped.append(OrganizationSkip(source, error.localizedDescription))
            }
            progress(source, destination, index + 1, plan.files.count, succeeded)
        }
        cleanFolders(batch)
        return OrganizationResult(moved: moved, skipped: skipped, batchID: batch.files.isEmpty ? nil : batch.id)
    }

    func undo(root: URL, id: UUID) throws -> OrganizationResult {
        try withHistoryLock { try undoLocked(root: root, id: id) }
    }

    private func undoLocked(root: URL, id: UUID) throws -> OrganizationResult {
        var history = try loadHistory()
        guard let index = history.firstIndex(where: { $0.id == id && $0.root.path == root.path }) else {
            return OrganizationResult(moved: 0, skipped: [], batchID: nil)
        }
        var batch = history[index]
        try assertRoot(root, batch.identity)
        var restored = 0
        var skipped: [OrganizationSkip] = []
        var pending: [OrganizationMove] = []
        for file in batch.files.reversed() {
            let destination = file.destination(in: root)
            do {
                try assertRoot(root, batch.identity)
                try checkFolders(file.folders, in: root, onDevice: batch.identity.device)
                let source = file.source(in: root)
                let original = try metadata(source)
                let current = try metadata(destination)
                if original.map(OrganizationStamp.init)?.identity == file.stamp.identity
                    && current.map(OrganizationStamp.init)?.identity != file.stamp.identity { continue }
                guard let current, OrganizationStamp(current).identity == file.stamp.identity,
                      exclusion(destination, current) == nil else { throw OrganizationProblem.changedFile }
                guard original == nil else { throw OrganizationProblem.occupied }
                if try isOpen(destination) { throw OrganizationProblem.openFile }
                try assertRoot(root, batch.identity)
                try checkFolders(file.folders, in: root, onDevice: batch.identity.device)
                guard try metadata(destination).map(OrganizationStamp.init)?.identity == file.stamp.identity else {
                    throw OrganizationProblem.changedFile
                }
                try fm.moveItem(at: destination, to: source)
                restored += 1
            } catch {
                pending.append(file)
                skipped.append(OrganizationSkip(destination, error.localizedDescription))
            }
        }
        batch.files = pending.reversed()
        cleanFolders(batch)
        if batch.files.isEmpty { history.remove(at: index) } else { history[index] = batch }
        try saveHistory(history)
        return OrganizationResult(moved: restored, skipped: skipped, batchID: batch.files.isEmpty ? nil : id)
    }

    private func exclusion(_ url: URL, _ info: stat) -> String? {
        let name = url.lastPathComponent
        if url.pathExtension.lowercased() == "app" { return "应用程序" }
        if name.hasPrefix(".") || info.st_flags & UInt32(UF_HIDDEN) != 0
            || (try? url.resourceValues(forKeys: [.isHiddenKey]).isHidden) == true { return "隐藏文件" }
        if info.st_uid == 0 || info.st_flags & UInt32(UF_IMMUTABLE | SF_IMMUTABLE | UF_APPEND | SF_APPEND | SF_RESTRICTED) != 0
            || name == "Icon\r" { return "系统或受保护文件" }
        if ["重要", "别动", "不要动"].contains(where: name.contains) { return "文件名含保留关键词" }
        if kind(info) == S_IFLNK || (try? url.resourceValues(forKeys: [.isAliasFileKey]).isAliasFile) == true { return "链接或替身" }
        if kind(info) != S_IFREG && kind(info) != S_IFDIR { return "特殊文件" }
        return nil
    }

    private func metadata(_ url: URL) throws -> stat? {
        var info = stat()
        if lstat(url.path, &info) == 0 { return info }
        if errno == ENOENT { return nil }
        throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
    }

    private func kind(_ info: stat) -> mode_t { info.st_mode & S_IFMT }

    private func rootIdentity(_ root: URL) throws -> OrganizationIdentity {
        let dataVolume = "/System/Volumes/Data"
        let path = root.path.hasPrefix(dataVolume + "/") ? String(root.path.dropFirst(dataVolume.count)) : root.path
        func isInside(_ folder: String) -> Bool { path == folder || path.hasPrefix(folder + "/") }
        let systemFolders = ["/System", "/Library", "/bin", "/sbin", "/usr", "/private/etc", "/private/var/db"]
        let library = fm.homeDirectoryForCurrentUser.appendingPathComponent("Library").path
        let appData = isInside(library) && !isInside(library + "/CloudStorage") && !isInside(library + "/Mobile Documents")
        if path == "/" || root.pathComponents.contains(where: { $0.lowercased().hasSuffix(".app") })
            || systemFolders.contains(where: isInside) || appData {
            throw OrganizationProblem.protectedLocation
        }
        guard let info = try metadata(root), kind(info) == S_IFDIR else { throw OrganizationProblem.changedFolder }
        return OrganizationStamp(info).identity
    }

    private func assertRoot(_ root: URL, _ identity: OrganizationIdentity) throws {
        guard root.resolvingSymlinksInPath().standardizedFileURL.path == root.path,
              try rootIdentity(root) == identity else { throw OrganizationProblem.changedFolder }
    }

    private func checkFolders(_ components: [String], in root: URL, onDevice device: Int32) throws {
        var parent = root
        for part in components {
            parent = parent.appendingPathComponent(part, isDirectory: true)
            guard let info = try metadata(parent) else { return }
            guard kind(info) == S_IFDIR, info.st_dev == device else { throw OrganizationProblem.unsafeDestination }
        }
    }

    private func checkDestination(_ move: OrganizationMove, in root: URL, onDevice device: Int32) throws {
        try checkFolders(move.folders, in: root, onDevice: device)
        if try metadata(move.destination(in: root)) != nil { throw OrganizationProblem.occupied }
    }

    private func ensureFolders(_ move: OrganizationMove, in batch: inout OrganizationBatch) throws {
        var parent = batch.root
        for (index, part) in move.folders.enumerated() {
            parent = parent.appendingPathComponent(part, isDirectory: true)
            if try metadata(parent) == nil {
                try fm.createDirectory(at: parent, withIntermediateDirectories: false)
                guard let info = try metadata(parent), kind(info) == S_IFDIR,
                      info.st_dev == batch.identity.device else { throw OrganizationProblem.unsafeDestination }
                batch.created.append(OrganizationDirectory(components: Array(move.folders.prefix(index + 1)),
                    identity: OrganizationStamp(info).identity))
            }
            try checkFolders(Array(move.folders.prefix(index + 1)), in: batch.root, onDevice: batch.identity.device)
        }
    }

    private func cleanFolders(_ batch: OrganizationBatch) {
        for folder in batch.created.sorted(by: { $0.components.count > $1.components.count }) {
            let url = folder.components.reduce(batch.root) { $0.appendingPathComponent($1, isDirectory: true) }
            do {
                try assertRoot(batch.root, batch.identity)
                try checkFolders(folder.components, in: batch.root, onDevice: batch.identity.device)
                guard let info = try metadata(url), OrganizationStamp(info).identity == folder.identity else { continue }
                _ = rmdir(url.path) // Only remove an empty directory created by this batch.
            } catch { continue }
        }
    }

    private func contents(_ url: URL) throws -> [URL] {
        try fm.contentsOfDirectory(at: url, includingPropertiesForKeys: nil)
            .sorted { $0.lastPathComponent.localizedStandardCompare($1.lastPathComponent) == .orderedAscending }
    }

    private func isMonth(_ name: String) -> Bool {
        name.range(of: #"^[0-9]{4}-(0[1-9]|1[0-2])$"#, options: .regularExpression) != nil
    }

    private func isOrganizedRoot(_ url: URL) -> Bool {
        var parts = url.pathComponents
        if let last = parts.last, OrganizationCategory(rawValue: last) != nil { parts.removeLast() }
        if let last = parts.last, OrganizationKeyword(rawValue: last) != nil { parts.removeLast() }
        return parts.last.map(isMonth) ?? false
    }

    private func contentsOfOrganizedMonth(_ month: URL) -> [OrganizationSkip] {
        func children(_ url: URL) -> [URL] { (try? contents(url)) ?? [] }
        func directory(_ url: URL) -> Bool {
            guard let info = try? metadata(url) else { return false }
            return kind(info) == S_IFDIR
        }
        func organizedFiles(_ url: URL) -> [OrganizationSkip] {
            guard directory(url), OrganizationCategory(rawValue: url.lastPathComponent) != nil else { return [] }
            return children(url).filter { !directory($0) }.map { OrganizationSkip($0, "已在整理目录内") }
        }
        return children(month).flatMap { url -> [OrganizationSkip] in
            if directory(url), OrganizationKeyword(rawValue: url.lastPathComponent) != nil {
                return children(url).flatMap(organizedFiles)
            }
            return organizedFiles(url)
        }
    }

    private func loadHistory() throws -> [OrganizationBatch] {
        guard let info = try metadata(journal) else { return [] }
        guard kind(info) == S_IFREG else { throw CocoaError(.fileReadCorruptFile) }
        let history = try JSONDecoder().decode([OrganizationBatch].self, from: Data(contentsOf: journal))
        func validFolders(_ parts: [String]) -> Bool {
            guard !parts.isEmpty, parts.count <= 3, isMonth(parts[0]) else { return false }
            if parts.count == 1 { return true }
            if parts.count == 2 { return OrganizationCategory(rawValue: parts[1]) != nil || OrganizationKeyword(rawValue: parts[1]) != nil }
            return OrganizationKeyword(rawValue: parts[1]) != nil && OrganizationCategory(rawValue: parts[2]) != nil
        }
        guard history.allSatisfy({ batch in
            batch.root.isFileURL && batch.created.allSatisfy { validFolders($0.components) }
                && batch.files.allSatisfy { file in
                    !file.name.isEmpty && !file.name.hasPrefix(".") && !file.name.contains("/") && !file.name.contains("\0")
                        && OrganizationCategory(rawValue: file.category) != nil && validFolders(file.folders)
                }
        }) else { throw CocoaError(.fileReadCorruptFile) }
        return history
    }

    private func withHistoryLock<T>(_ operation: () throws -> T) throws -> T {
        let folder = journal.deletingLastPathComponent()
        try fm.createDirectory(at: folder, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
        let lock = folder.appendingPathComponent("transaction.lock")
        let descriptor = open(lock.path, O_CREAT | O_RDWR | O_CLOEXEC | O_NOFOLLOW, 0o600)
        guard descriptor >= 0 else { throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO) }
        defer { close(descriptor) }
        guard flock(descriptor, LOCK_EX | LOCK_NB) == 0 else {
            if errno == EWOULDBLOCK { throw OrganizationProblem.operationInProgress }
            throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
        }
        return try operation()
    }

    private func saveHistory(_ history: [OrganizationBatch]) throws {
        try JSONEncoder().encode(history).write(to: journal, options: .atomic)
    }
}
