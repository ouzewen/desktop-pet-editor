import AppKit
import SwiftUI

// MARK: - Service

enum TrashService {
    struct Outcome {
        let trashed: [URL]
        let failed: [URL]
        var summary: String {
            if trashed.isEmpty, !failed.isEmpty {
                return failed.count == 1
                    ? "删不掉：\(failed[0].lastPathComponent)"
                    : "删不掉 \(failed.count) 个文件"
            }
            if failed.isEmpty {
                if trashed.count == 1 { return "已移到废纸篓：\(trashed[0].lastPathComponent)" }
                return "已把 \(trashed.count) 个文件移到废纸篓"
            }
            return "移走了 \(trashed.count) 个，\(failed.count) 个没删掉"
        }
    }

    /// Moves the items to the macOS Trash — recoverable, unlike an unlink.
    static func trash(_ urls: [URL]) -> Outcome {
        var trashed: [URL] = []
        var failed: [URL] = []
        for url in urls {
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

struct TrashToast: View {
    let text: String
    var tone: Tone = .normal

    enum Tone {
        case normal
        case hint
        case failure
    }

    @Environment(\.colorScheme) private var colorScheme

    private var palette: PixelPalette { .of(colorScheme) }

    private var accent: Color {
        switch tone {
        case .normal: return palette.accent
        case .hint: return palette.inkSoft
        case .failure: return Color(pixelHex: 0xE06060)
        }
    }

    var body: some View {
        HStack(spacing: 5) {
            PixelGlyph(kind: .clip, color: accent, size: 11)
            Text(text)
                .font(PixelFont.font(11))
                .foregroundStyle(palette.ink)
                .lineLimit(2)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(PixelBox(corner: 2).fill(palette.panel.opacity(0.96)))
        .overlay(PixelBox(corner: 2).stroke(palette.borderSoft, lineWidth: 1))
    }
}
