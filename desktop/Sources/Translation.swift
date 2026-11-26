import AppKit
import SwiftUI
import Translation

// MARK: - Text helpers

enum SelectionText {
    static let maxLength = 500

    /// A rough English test: predominantly Latin letters, no CJK characters.
    static func isEnglish(_ raw: String) -> Bool {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= 2 else { return false }
        let scalars = text.unicodeScalars
        let letters = scalars.filter { CharacterSet.letters.contains($0) }
        guard letters.count >= 2 else { return false }
        let latin = letters.filter { $0.isASCII }.count
        let cjk = scalars.filter { (0x4E00...0x9FFF).contains($0.value) }.count
        return cjk == 0 && Double(latin) / Double(letters.count) >= 0.8
    }

    static func prepare(_ raw: String) -> (text: String, truncated: Bool) {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count > maxLength else { return (text, false) }
        return (String(text.prefix(maxLength)), true)
    }
}

// MARK: - Selection

enum SelectionReader {
    static var isTrusted: Bool { AXIsProcessTrusted() }

    /// Asks macOS to show the Accessibility permission prompt (once).
    @discardableResult
    static func requestTrust() -> Bool {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }

    /// The focused control's selected text, from the system-wide accessibility
    /// tree. Returns nil when nothing is selected or the app is not trusted.
    static func selectedText() -> String? {
        let system = AXUIElementCreateSystemWide()
        var focused: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            system, kAXFocusedUIElementAttribute as CFString, &focused
        ) == .success, let value = focused else { return nil }
        let element = value as! AXUIElement

        if let text = string(element, kAXSelectedTextAttribute), !text.isEmpty {
            return text
        }
        // Some controls only expose the range; slice it out of the value.
        if let full = string(element, kAXValueAttribute),
           let range = range(element),
           let text = substring(full, range), !text.isEmpty {
            return text
        }
        return nil
    }

    private static func string(_ element: AXUIElement, _ attribute: String) -> String? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success else {
            return nil
        }
        return value as? String
    }

    private static func range(_ element: AXUIElement) -> NSRange? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            element, kAXSelectedTextRangeAttribute as CFString, &value
        ) == .success, let raw = value else { return nil }
        var cfRange = CFRange()
        guard AXValueGetValue(raw as! AXValue, .cfRange, &cfRange) else { return nil }
        return NSRange(location: cfRange.location, length: cfRange.length)
    }

    private static func substring(_ text: String, _ range: NSRange) -> String? {
        guard range.length > 0,
              NSMaxRange(range) <= (text as NSString).length else { return nil }
        return (text as NSString).substring(with: range)
    }
}

// MARK: - Engine

/// Availability shim so the rest of the app can call translation on any macOS.
final class TranslationEngine {
    private var service: AnyObject?

    static var isAvailable: Bool {
        if #available(macOS 15.0, *) { return true }
        return false
    }

    func translate(_ text: String, completion: @escaping (String?) -> Void) {
        guard #available(macOS 15.0, *) else {
            completion(nil)
            return
        }
        if service == nil { service = TranslationService() }
        (service as? TranslationService)?.translate(text, completion: completion)
    }

    func cancel() {
        if #available(macOS 15.0, *) { (service as? TranslationService)?.cancel() }
    }
}

@available(macOS 15.0, *)
final class TranslationBridgeModel: ObservableObject {
    @Published var configuration: TranslationSession.Configuration?
    @Published var text = ""
    var request: UUID?
    var onResult: ((UUID, String?) -> Void)?
}

@available(macOS 15.0, *)
struct TranslationBridgeView: View {
    @ObservedObject var model: TranslationBridgeModel

    var body: some View {
        Color.clear
            .frame(width: 1, height: 1)
            .translationTask(model.configuration) { session in
                let text = model.text
                guard let request = model.request, !text.isEmpty else { return }
                do {
                    let response = try await session.translate(text)
                    await MainActor.run { model.onResult?(request, response.targetText) }
                } catch {
                    await MainActor.run { model.onResult?(request, nil) }
                }
            }
    }
}

/// Owns a 1×1 offscreen window whose SwiftUI view drives `translationTask`.
@available(macOS 15.0, *)
final class TranslationService {
    private let model = TranslationBridgeModel()
    private var window: NSWindow?
    private var completion: ((String?) -> Void)?

    init() {
        model.onResult = { [weak self] request, result in
            guard let self, self.model.request == request else { return }
            let block = self.completion
            self.completion = nil
            block?(result)
        }
    }

    func translate(_ text: String, completion: @escaping (String?) -> Void) {
        ensureWindow()
        self.completion = completion
        model.request = UUID()
        model.text = text
        if model.configuration == nil {
            model.configuration = TranslationSession.Configuration(
                source: Locale.Language(identifier: "en"),
                target: Locale.Language(identifier: "zh-Hans")
            )
        } else {
            model.configuration?.invalidate()
        }
    }

    func cancel() {
        guard model.request != nil else { return }
        completion = nil
        model.request = nil
        model.text = ""
        model.configuration = nil
    }

    private func ensureWindow() {
        guard window == nil else { return }
        let host = NSHostingView(rootView: TranslationBridgeView(model: model))
        host.frame = NSRect(x: 0, y: 0, width: 1, height: 1)
        let next = NSWindow(
            contentRect: host.frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        next.contentView = host
        next.isOpaque = false
        next.alphaValue = 0.01
        next.ignoresMouseEvents = true
        next.setFrameOrigin(NSPoint(x: -4000, y: -4000))
        next.orderFrontRegardless()
        window = next
    }
}

// MARK: - Views

struct TranslationButtonCard: View {
    var onTap: () -> Void = {}

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    private var palette: PixelPalette { theme.windowPalette }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 5) {
                PixelGlyph(kind: .clip, color: palette.ink, size: 10)
                Text("翻译")
            }
        }
        .workbenchButton(palette: palette)
        .padding(3)
        .workbenchCardSurface(theme)
        .help("翻译选中的英文")
    }
}

enum TranslationCardState {
    case loading
    case result(original: String, translated: String, truncated: Bool)
    case failure
    case permission
}

struct TranslationCard: View {
    let state: TranslationCardState

    var onCopy: () -> Void = {}
    var onOpenSettings: () -> Void = {}
    var onClose: () -> Void = {}
    var onHeightChange: (CGFloat) -> Void = { _ in }

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @State private var copied = false

    private var palette: PixelPalette { theme.windowPalette }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            WorkbenchCardHeading(title: "翻译", glyph: .clip, palette: palette) {
                WorkbenchCardIconButton(glyph: .close, title: "关闭翻译", palette: palette, action: onClose)
            }

            switch state {
            case .loading:
                Text("翻译中…")
                    .font(.system(size: 11))
                    .foregroundStyle(palette.inkSoft)
                    .padding(.vertical, 4)
            case .failure:
                Text("翻不出来，再试一次。")
                    .font(.system(size: 11))
                    .foregroundStyle(palette.red)
                    .padding(.vertical, 4)
            case .permission:
                Text("需要在「系统设置 › 隐私与安全性 › 辅助功能」里允许桌宠，才能读取你选中的文字。")
                    .font(.system(size: 11))
                    .foregroundStyle(palette.inkSoft)
                    .fixedSize(horizontal: false, vertical: true)
                Button("打开系统设置", action: onOpenSettings)
                    .workbenchButton(palette: palette, prominent: true)
            case let .result(original, translated, truncated):
                Text(original)
                    .font(.system(size: 10))
                    .foregroundStyle(palette.inkSoft)
                    .lineLimit(4)
                    .fixedSize(horizontal: false, vertical: true)
                Rectangle()
                    .fill(palette.borderSoft)
                    .frame(height: 1)
                Text(translated)
                    .font(.system(size: 13))
                    .foregroundStyle(palette.ink)
                    .lineLimit(8)
                    .fixedSize(horizontal: false, vertical: true)
                if truncated {
                    Text("太长了，只翻了前面。")
                        .font(.system(size: 10))
                        .foregroundStyle(palette.inkSoft)
                }
                HStack(spacing: 6) {
                    Button(copied ? "已复制" : "复制中文") {
                        onCopy()
                        copied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { copied = false }
                    }
                    .workbenchButton(palette: palette, prominent: true)
                }
            }
        }
        .padding(10)
        .frame(width: 286, alignment: .leading)
        .workbenchCardSurface(theme)
        .background(
            GeometryReader { proxy in
                Color.clear
                    .onAppear { onHeightChange(proxy.size.height) }
                    .onChange(of: proxy.size.height) { onHeightChange($0) }
            }
        )
    }
}
