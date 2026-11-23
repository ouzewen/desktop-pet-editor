import AppKit
import SwiftUI

// MARK: - Service

enum TrashService {
    struct Outcome {
        let trashed: [URL]
        let failed: [URL]
        var summary: String {
            "已移到废纸篓 \(trashed.count) 项 · 失败 \(failed.count) 项"
        }
    }

    /// Keeps one entry per path and lets a selected folder carry any of its selected descendants.
    static func selectedItems(_ urls: [URL]) -> [URL] {
        var paths = Set<String>()
        let unique = urls.filter { $0.isFileURL && paths.insert($0.standardizedFileURL.path).inserted }
        let folders = Set(unique.compactMap { url -> String? in
            guard isDirectory(url) else { return nil }
            return url.standardizedFileURL.path
        })
        return unique.filter { url in
            var parent = url.standardizedFileURL.deletingLastPathComponent()
            while parent.path != "/" && !parent.path.isEmpty {
                if folders.contains(parent.path) { return false }
                parent.deleteLastPathComponent()
            }
            return true
        }
    }

    static func isDirectory(_ url: URL) -> Bool {
        let values = try? url.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
        return values?.isDirectory == true && values?.isSymbolicLink != true
    }

    /// Moves the items to the macOS Trash — recoverable, unlike an unlink.
    static func trash(_ urls: [URL]) -> Outcome {
        var trashed: [URL] = []
        var failed: [URL] = []
        for url in selectedItems(urls) {
            var resulting: NSURL?
            do {
                try FileManager.default.trashItem(at: url, resultingItemURL: &resulting)
                trashed.append(url)
            } catch {
                failed.append(url)
            }
        }
        return Outcome(trashed: trashed, failed: failed)
    }

    /// File URLs carried by a drag, ignoring non-file payloads.
    static func fileURLs(from info: NSDraggingInfo) -> [URL] {
        let options: [NSPasteboard.ReadingOptionKey: Any] = [.urlReadingFileURLsOnly: true]
        let objects = info.draggingPasteboard.readObjects(forClasses: [NSURL.self], options: options)
        return (objects as? [URL]) ?? []
    }
}

// MARK: - Diagnostics

enum DropLog {
    static func write(_ message: String) {
        guard let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return }
        let folder = base.appendingPathComponent(DesktopPetStorage.directoryName, isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let file = folder.appendingPathComponent("drop.log")
        let line = "\(Date()) \(message)\n"
        if let handle = try? FileHandle(forWritingTo: file) {
            handle.seekToEndOfFile()
            handle.write(Data(line.utf8))
            try? handle.close()
        } else {
            try? line.write(to: file, atomically: true, encoding: .utf8)
        }
    }
}

// MARK: - Toast

struct PetStatusToast: View {
    let text: String
    var tone: Tone = .normal

    enum Tone {
        case normal
        case hint
        case failure
    }

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    private var palette: PixelPalette { theme.palette }

    private var badge: (glyph: PixelIconKind, color: Color) {
        switch tone {
        case .normal: return (.check, palette.accent)
        case .hint: return (.clip, palette.inkSoft)
        case .failure: return (.close, palette.red)
        }
    }

    var body: some View {
        HStack(spacing: 5) {
            PixelGlyph(kind: badge.glyph, color: badge.color, size: 10)
            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(tone == .failure ? palette.red : palette.ink)
                .lineLimit(2)
                .frame(maxWidth: 264, alignment: .leading)
        }
        .fixedSize(horizontal: true, vertical: false)
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .workbenchCardSurface(theme)
    }
}
