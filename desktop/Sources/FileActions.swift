import AppKit
import Foundation
import SwiftUI

// MARK: - File kinds

enum FileKind {
    case image
    case document
    case unsupported

    static let imageExtensions: Set<String> = ["png", "jpg", "jpeg", "heic", "heif", "tiff", "tif", "gif", "bmp", "webp"]
    static let documentExtensions: Set<String> = ["txt", "md", "rtf", "html", "htm", "doc", "docx"]

    static func of(_ url: URL) -> FileKind {
        let ext = url.pathExtension.lowercased()
        if imageExtensions.contains(ext) { return .image }
        if documentExtensions.contains(ext) { return .document }
        return .unsupported
    }
}

enum ConvertFormat {
    case png
    case jpg
    case pdf

    var title: String {
        switch self {
        case .png: return "PNG"
        case .jpg: return "JPG"
        case .pdf: return "PDF"
        }
    }

    var pathExtension: String {
        switch self {
        case .png: return "png"
        case .jpg: return "jpg"
        case .pdf: return "pdf"
        }
    }
}

// MARK: - Operations

enum FileTools {
    static func formats(for kind: FileKind) -> [ConvertFormat] {
        switch kind {
        case .image: return [.png, .jpg]
        case .document: return [.pdf]
        case .unsupported: return []
        }
    }

    /// Zips one file or folder into the same folder; returns the archive URL.
    static func zip(_ url: URL) -> URL? {
        let folder = url.deletingLastPathComponent()
        let base = url.deletingPathExtension().lastPathComponent
        let output = availableURL(in: folder, base: base, pathExtension: "zip")
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/ditto")
        task.arguments = ["-c", "-k", "--norsrc", url.path, output.path]
        task.standardOutput = FileHandle.nullDevice
        task.standardError = FileHandle.nullDevice
        do {
            try task.run()
            task.waitUntilExit()
        } catch {
            return nil
        }
        guard task.terminationStatus == 0,
              FileManager.default.fileExists(atPath: output.path) else { return nil }
        return output
    }

    static func convert(_ url: URL, to format: ConvertFormat) -> URL? {
        let folder = url.deletingLastPathComponent()
        let base = url.deletingPathExtension().lastPathComponent
        let output = availableURL(in: folder, base: base, pathExtension: format.pathExtension)
        switch format {
        case .png, .jpg:
            guard let image = image(at: url) else { return nil }
            guard write(image: image, to: output, as: format) else { return nil }
        case .pdf:
            guard let text = attributedString(at: url) else { return nil }
            guard writePDF(text, to: output) else { return nil }
        }
        return FileManager.default.fileExists(atPath: output.path) ? output : nil
    }

    // MARK: Helpers

    private static func availableURL(in folder: URL, base: String, pathExtension: String) -> URL {
        var candidate = folder.appendingPathComponent("\(base).\(pathExtension)")
        var index = 2
        while FileManager.default.fileExists(atPath: candidate.path) {
            candidate = folder.appendingPathComponent("\(base) \(index).\(pathExtension)")
            index += 1
        }
        return candidate
    }

    private static func image(at url: URL) -> CGImage? {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        return CGImageSourceCreateImageAtIndex(source, 0, nil)
    }

    private static func write(image: CGImage, to output: URL, as format: ConvertFormat) -> Bool {
        let data: Data?
        if format == .png {
            data = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])
        } else {
            // JPEG has no alpha; flatten onto white so transparent PNGs stay clean.
            // CGContext keeps this working without an AppKit drawing context.
            let bounds = CGRect(x: 0, y: 0, width: image.width, height: image.height)
            guard let context = CGContext(
                data: nil,
                width: image.width,
                height: image.height,
                bitsPerComponent: 8,
                bytesPerRow: 0,
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
            ) else { return false }
            context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
            context.fill(bounds)
            context.draw(image, in: bounds)
            guard let flat = context.makeImage() else { return false }
            data = NSBitmapImageRep(cgImage: flat).representation(using: .jpeg, properties: [.compressionFactor: 0.9])
        }
        guard let data else { return false }
        do {
            try data.write(to: output)
            return true
        } catch {
            return false
        }
    }

    private static func attributedString(at url: URL) -> NSAttributedString? {
        let ext = url.pathExtension.lowercased()
        switch ext {
        case "rtf":
            return try? NSAttributedString(url: url, options: [:], documentAttributes: nil)
        case "html", "htm":
            return try? NSAttributedString(
                url: url,
                options: [.documentType: NSAttributedString.DocumentType.html],
                documentAttributes: nil
            )
        case "doc", "docx":
            let temp = FileManager.default.temporaryDirectory
                .appendingPathComponent("pet-doc-\(UUID().uuidString).rtf")
            defer { try? FileManager.default.removeItem(at: temp) }
            let task = Process()
            task.executableURL = URL(fileURLWithPath: "/usr/bin/textutil")
            task.arguments = ["-convert", "rtf", "-output", temp.path, url.path]
            task.standardOutput = FileHandle.nullDevice
            task.standardError = FileHandle.nullDevice
            do {
                try task.run()
                task.waitUntilExit()
            } catch {
                return nil
            }
            guard task.terminationStatus == 0 else { return nil }
            return try? NSAttributedString(url: temp, options: [:], documentAttributes: nil)
        default:
            guard let text = try? String(contentsOf: url, encoding: .utf8) else { return nil }
            return NSAttributedString(string: text, attributes: [.font: NSFont.systemFont(ofSize: 12)])
        }
    }

    private static func writePDF(_ text: NSAttributedString, to output: URL) -> Bool {
        let page = NSRect(x: 0, y: 0, width: 595, height: 842)
        let view = NSTextView(frame: page)
        view.textStorage?.setAttributedString(text)
        view.isEditable = false
        let data = NSMutableData()
        let operation = NSPrintOperation.pdfOperation(with: view, inside: page, to: data)
        operation.showsPrintPanel = false
        operation.showsProgressPanel = false
        guard operation.run() else { return false }
        do {
            try (data as Data).write(to: output)
            return true
        } catch {
            return false
        }
    }
}

// MARK: - Action bar

struct DropActionBar: View {
    let selectionTitle: String

    var onTrash: () -> Void = {}
    var onZip: (() -> Void)?
    var onConvert: (() -> Void)?
    var onCancel: (() -> Void)?

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    private var palette: PixelPalette { theme.palette }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            WorkbenchCardHeading(title: "文件操作", glyph: .file, palette: palette) {}
            Text(selectionTitle)
                .font(.system(size: 11))
                .foregroundStyle(palette.inkSoft)
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 6) {
                button("删除", .trash, destructive: true, action: onTrash)
                if let onZip { button("压缩", .chevron, action: onZip) }
                if let onConvert { button("转格式", .arrowRight, action: onConvert) }
                if let onCancel { button("取消", action: onCancel) }
            }
        }
        .padding(10)
        .frame(width: onCancel == nil ? 236 : 190)
        .workbenchCardSurface(theme)
    }

    private func button(_ title: String, _ icon: PixelIconKind? = nil, destructive: Bool = false,
                        action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon {
                    PixelGlyph(kind: icon, color: destructive ? Color(pixelHex: 0xFFF9EC) : palette.ink, size: 10)
                }
                Text(title).fixedSize()
            }
        }
        .workbenchButton(palette: palette, prominent: destructive, tint: destructive ? palette.red : nil)
    }
}

struct DropFormatBar: View {
    let formats: [ConvertFormat]
    let fileName: String

    var onPick: (ConvertFormat) -> Void = { _ in }

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    private var palette: PixelPalette { theme.palette }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            WorkbenchCardHeading(title: "转格式", glyph: .arrowRight, palette: palette) {}
            Text(verbatim: fileName)
                .font(.system(size: 11))
                .foregroundStyle(palette.inkSoft)
                .lineLimit(1)
                .truncationMode(.middle)
            HStack(spacing: 6) {
                ForEach(formats, id: \.title) { format in
                    Button(format.title) { onPick(format) }
                        .workbenchButton(palette: palette)
                }
            }
        }
        .padding(10)
        .frame(width: 220, alignment: .leading)
        .workbenchCardSurface(theme)
    }
}
