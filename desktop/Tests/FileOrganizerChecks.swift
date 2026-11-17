import AppKit
import Foundation

@main
enum FileOrganizerChecks {
    static func main() throws {
        let fm = FileManager.default
        let temp = fm.temporaryDirectory.appendingPathComponent("DesktopPet-Organizer-\(UUID())", isDirectory: true)
        try fm.createDirectory(at: temp, withIntermediateDirectories: false)
        defer { try? fm.removeItem(at: temp) }
        let desktop = temp.appendingPathComponent("Desktop", isDirectory: true)
        let downloads = temp.appendingPathComponent("Downloads", isDirectory: true)
        let journal = temp.appendingPathComponent("History/moves.json")
        try fm.createDirectory(at: desktop, withIntermediateDirectories: false)
        try fm.createDirectory(at: downloads, withIntermediateDirectories: false)
        let zone = TimeZone(identifier: "Asia/Shanghai")!
        let organizer = FileOrganizer(journal: journal, timeZone: zone, isOpen: FileOrganizationAccess.isOpen)
        let names: [(String, String)] = [
            ("截图 2026-11-17.png", "2026-11/截图/图片"),
            ("Screen Shot - Contract.JPG", "2026-11/截图/图片"),
            ("截屏.webp", "2026-11/截图/图片"), ("合同-云雀.pdf", "2026-11/合同/文档"),
            ("发票.csv", "2026-11/发票/文档"), ("我的简历.txt", "2026-11/简历/文档"),
            ("resume.DOCX", "2026-11/简历/文档"), ("报告.docx", "2026-10/文档"),
            ("未知文件.xyz", "2026-11/其他"), ("no extension", "2026-11/其他"),
            ("sample.mov", "2026-11/视频"), ("sample.mp4", "2026-11/视频"),
            ("clip.flac", "2026-11/音频"), ("clip.mp3", "2026-11/音频"),
            ("bundle.tar.gz", "2026-11/压缩包"), ("bundle.7z", "2026-11/压缩包"),
            ("Installer.dmg", "2026-11/应用安装包"), ("Setup.pkg", "2026-11/应用安装包"),
            ("Run.swift", "2026-11/代码"), ("config.json", "2026-11/代码"),
            ("no keyword.md", "2026-11/文档"), ("diagram.svg", "2026-11/图片"),
            ("小组件.tsx", "2026-11/代码"),
        ]
        let plainContents = Data("保持字节完整".utf8)
        let png = Data(base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=")!
        let calendar = ISO8601DateFormatter()
        let creation = calendar.date(from: "2022-01-01T00:00:00Z")!
        let november = calendar.date(from: "2026-11-16T23:30:00Z")!
        let october = calendar.date(from: "2026-10-01T23:30:00Z")!
        for (name, route) in names {
            let url = desktop.appendingPathComponent(name)
            try (name.hasSuffix(".png") ? png : plainContents).write(to: url)
            try fm.setAttributes([.creationDate: creation, .modificationDate: route.hasPrefix("2026-10") ? october : november],
                                 ofItemAtPath: url.path)
        }
        let untouchedDownload = downloads.appendingPathComponent("发票.xls")
        try plainContents.write(to: untouchedDownload)
        try fm.setAttributes([.modificationDate: november], ofItemAtPath: untouchedDownload.path)

        let plan = try organizer.preview(desktop)
        try check(plan.fileCount == 23 && plan.files.count == 23 && plan.skipped.isEmpty, "23-file preview count")
        try check(!fm.fileExists(atPath: journal.path) && !fm.fileExists(atPath: desktop.appendingPathComponent("2026-11").path),
                  "Preview wrote directories or a transaction record")
        for (name, route) in names {
            let file = plan.files.first { $0.name == name }
            try check(file?.folders.joined(separator: "/") == route && fm.fileExists(atPath: desktop.appendingPathComponent(name).path),
                      "Wrong modification date, keyword, extension or preview move for \(name)")
        }
        var animationNames: [String] = []
        var rejectedConcurrentMove = false
        let secondWindow = FileOrganizer(journal: journal, timeZone: zone, isOpen: FileOrganizationAccess.isOpen)
        let result = try organizer.execute(plan) { source, _, index, _, moved in
            if moved { animationNames.append(source.lastPathComponent) }
            if index == 1 {
                do {
                    _ = try secondWindow.execute(plan) { _, _, _, _, _ in }
                } catch OrganizationProblem.operationInProgress {
                    rejectedConcurrentMove = true
                } catch {}
            }
        }
        try check(result.moved == 23 && result.skipped.isEmpty && animationNames.count == 23 && rejectedConcurrentMove,
                  "Move count, progress or concurrent journal protection")
        let reopened = FileOrganizer(journal: journal, timeZone: zone, isOpen: FileOrganizationAccess.isOpen)
        for (name, route) in names {
            let original = desktop.appendingPathComponent(name)
            let target = desktop.appendingPathComponent(route).appendingPathComponent(name)
            try check(!fm.fileExists(atPath: original.path) && Data(contentsOf: target) == (name.hasSuffix(".png") ? png : plainContents),
                      "Moved bytes differ for \(name)")
            if name.hasSuffix(".png") { try check(NSImage(contentsOf: target) != nil, "Moved PNG cannot be opened") }
        }
        let repeated = try reopened.preview(desktop)
        try check(repeated.files.isEmpty && repeated.fileCount == 23, "Previously organized files were scanned as new candidates")
        try check(fm.fileExists(atPath: untouchedDownload.path), "Desktop operation touched Downloads")
        let restored = try reopened.undo(root: plan.root, id: result.batchID!)
        try check(restored.moved == 23 && restored.skipped.isEmpty && restored.batchID == nil, "Restarted undo failed")
        try check(Set(fm.contentsOfDirectory(atPath: desktop.path)) == Set(names.map(\.0)), "Undo left a different directory layout")
        for (name, _) in names {
            try check(Data(contentsOf: desktop.appendingPathComponent(name)) == (name.hasSuffix(".png") ? png : plainContents),
                      "Restore changed bytes for \(name)")
        }

        let nested = downloads.appendingPathComponent("客户资料", isDirectory: true)
        try fm.createDirectory(at: nested, withIntermediateDirectories: false)
        try plainContents.write(to: nested.appendingPathComponent("合同.pdf"))
        try fm.createDirectory(at: downloads.appendingPathComponent("Test.app"), withIntermediateDirectories: false)
        for name in [".DS_Store", "这是重要文件.md", "别动.pdf", "这个不要动.txt", "Icon\r", "open.txt", "late.pdf", "changed.txt", "collision.txt"] {
            let file = downloads.appendingPathComponent(name)
            try plainContents.write(to: file)
            try fm.setAttributes([.modificationDate: november], ofItemAtPath: file.path)
        }
        let open = try FileHandle(forReadingFrom: downloads.appendingPathComponent("open.txt"))
        defer { try? open.close() }
        let outside = temp.appendingPathComponent("Outside", isDirectory: true)
        try fm.createDirectory(at: outside, withIntermediateDirectories: false)
        try fm.createSymbolicLink(at: downloads.appendingPathComponent("shortcut"), withDestinationURL: outside)
        try fm.createSymbolicLink(at: downloads.appendingPathComponent("2026-10"), withDestinationURL: outside)
        let symlinkTarget = downloads.appendingPathComponent("October.txt")
        try plainContents.write(to: symlinkTarget)
        try fm.setAttributes([.modificationDate: october], ofItemAtPath: symlinkTarget.path)
        let downloadPlan = try organizer.preview(downloads)
        let ignored = Set(downloadPlan.skipped.map { $0.url.lastPathComponent })
        try check(Set(["open.txt", "Test.app", ".DS_Store", "这是重要文件.md", "别动.pdf", "这个不要动.txt",
                       "Icon\r", "shortcut", "客户资料", "October.txt"]).isSubset(of: ignored), "Excluded a protected file incorrectly")
        let reopenedFile = try FileHandle(forReadingFrom: downloads.appendingPathComponent("late.pdf"))
        defer { try? reopenedFile.close() }
        try Data("new content".utf8).write(to: downloads.appendingPathComponent("changed.txt"))
        let preexisting = downloads.appendingPathComponent("2026-11/文档", isDirectory: true)
        try fm.createDirectory(at: preexisting, withIntermediateDirectories: true)
        let collision = preexisting.appendingPathComponent("collision.txt")
        let preserving = Data("do not overwrite".utf8)
        try preserving.write(to: collision)
        let downloadResult = try organizer.execute(downloadPlan) { _, _, _, _, _ in }
        try check(downloadResult.moved == 1 && downloadResult.skipped.contains { $0.url.lastPathComponent == "late.pdf" && $0.reason.contains("打开") },
                  "An opened, modified or colliding file was moved")
        try check(Data(contentsOf: collision) == preserving && fm.fileExists(atPath: nested.appendingPathComponent("合同.pdf").path)
                  && fm.contentsOfDirectory(atPath: outside.path).isEmpty
                  && fm.fileExists(atPath: desktop.appendingPathComponent("报告.docx").path),
                  "Action crossed the folder boundary or overwrote a file")
        let blocking = downloads.appendingPathComponent("发票.xls")
        try preserving.write(to: blocking)
        let blocked = try reopened.undo(root: downloadPlan.root, id: downloadResult.batchID!)
        try check(blocked.moved == 0 && blocked.batchID != nil && Data(contentsOf: blocking) == preserving, "Undo overwrote a new file")
        try fm.removeItem(at: blocking)
        let retry = try reopened.undo(root: downloadPlan.root, id: blocked.batchID!)
        try check(retry.moved == 1 && Data(contentsOf: untouchedDownload) == plainContents
                  && fm.fileExists(atPath: collision.path), "Retry failed or removed a pre-existing organization folder")
        print("PASS: 23 previewed routes, same bytes after moves and restart undo, one-folder scope, protection, open-file checks and collision recovery")
    }

    private static func check(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
        guard try condition() else { throw NSError(domain: "FileOrganizerChecks", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
    }
}
