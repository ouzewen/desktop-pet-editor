import Foundation
import SwiftUI

private enum FeedbackType: String, CaseIterable {
    case problem, improvement, featureRequest = "feature_request"

    var title: String {
        switch self {
        case .problem: "遇到问题"
        case .improvement: "使用体验改进"
        case .featureRequest: "想要新功能"
        }
    }

    var prompt: String {
        switch self {
        case .problem: "你当时在做什么？发生了什么？可以补充复现步骤。"
        case .improvement: "哪里不顺手？你希望它怎么操作？"
        case .featureRequest: "你想完成什么？希望桌宠在什么时候帮你？"
        }
    }
}

struct FeedbackDetails: Equatable {
    let feedbackType: String
    let featureArea: String
    let message: String
}

struct FeedbackDraft {
    var id = UUID()
    var feedbackType = ""
    var featureArea = ""
    var message = ""
    var submittedDetails: FeedbackDetails?

    var trimmedMessage: String { message.trimmingCharacters(in: .whitespacesAndNewlines) }
}

private final class FeedbackSession: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}

enum FeedbackClient {
    static let messageLimit = 2000
    static let endpoint: URL? = {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "PetFeedbackURL") as? String,
              let url = URL(string: value), let host = url.host, !host.isEmpty,
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              url.scheme == "https" || (url.scheme == "http" && ["127.0.0.1", "localhost"].contains(host))
        else { return nil }
        return url
    }()

    private struct Submission: Encodable {
        let id: UUID
        let feedbackType: String
        let featureArea: String
        let message: String
        let appVersion: String?
    }

    private struct Receipt: Decodable {
        let id: UUID
    }

    private static let session = URLSession(configuration: .ephemeral, delegate: FeedbackSession(), delegateQueue: nil)

    struct Failure: LocalizedError {
        let errorDescription: String?

        init(_ message: String) { errorDescription = message }
    }

    static func send(_ details: FeedbackDetails, id: UUID, to endpoint: URL) async throws {
        let info = Bundle.main
        let version = info.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        let build = info.object(forInfoDictionaryKey: "CFBundleVersion") as? String
        let appVersion = version.map { version in build.map { "\(version) (\($0))" } ?? version }
        var request = URLRequest(url: endpoint, timeoutInterval: 15)
        let csrf = UUID().uuidString
        request.httpShouldHandleCookies = false
        request.httpMethod = "POST"
        request.setValue("suda-csrf-token=\(csrf)", forHTTPHeaderField: "Cookie")
        request.setValue(csrf, forHTTPHeaderField: "X-Suda-Csrf-Token")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(Submission(
            id: id, feedbackType: details.feedbackType, featureArea: details.featureArea,
            message: details.message, appVersion: appVersion
        ))

        let (data, response) = try await session.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw Failure("提交失败，请稍后重试。") }
        if response.statusCode == 429 { throw Failure("提交过于频繁，请稍后重试。") }
        guard [200, 201].contains(response.statusCode),
              let receipt = try? JSONDecoder().decode(Receipt.self, from: data), receipt.id == id else {
            throw Failure("提交失败，请稍后重试。")
        }
    }
}

struct FeedbackSheet: View {
    @Binding var draft: FeedbackDraft
    let palette: PixelPalette
    @Environment(\.dismiss) private var dismiss
    @State private var sending = false
    @State private var sent = false
    @State private var error: String?

    private let featureAreas = [
        ("appearance", "外观与像素编辑"), ("motion_typing", "动作与打字"),
        ("desktop_interaction", "桌面交互"), ("productivity", "提醒与效率工具"),
        ("install_updates", "安装与更新"), ("other", "其他／不确定"),
    ]

    private var length: Int { draft.trimmedMessage.unicodeScalars.count }
    private var editable: Bool { !sending && !sent }
    private var canSubmit: Bool {
        editable && FeedbackType(rawValue: draft.feedbackType) != nil
            && !draft.featureArea.isEmpty && (1...FeedbackClient.messageLimit).contains(length)
            && FeedbackClient.endpoint != nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("意见反馈")
                .font(PixelFont.font(20))
                .foregroundStyle(palette.ink)

            if sent {
                Text("已收到，谢谢你的反馈。")
                    .accessibilityIdentifier("feedback-sent")
            } else {
                HStack(alignment: .top, spacing: 12) {
                    feedbackPicker("反馈类型", options: FeedbackType.allCases.map { ($0.rawValue, $0.title) },
                                   selection: $draft.feedbackType, id: "feedback-type")
                    feedbackPicker("涉及功能", options: featureAreas,
                                   selection: $draft.featureArea, id: "feedback-feature-area")
                }
                .disabled(!editable)

                Text(FeedbackType(rawValue: draft.feedbackType)?.prompt ?? "选择反馈类型后，描述你想反馈的内容。")
                    .foregroundStyle(palette.inkSoft)
                TextEditor(text: $draft.message)
                    .font(.system(size: 14))
                    .scrollContentBackground(.hidden)
                    .padding(5)
                    .frame(height: 150)
                    .background(PixelBox(corner: 2).fill(palette.panelDeep))
                    .overlay(PixelBox(corner: 2).stroke(palette.borderSoft, lineWidth: 1))
                    .accessibilityLabel("修改意见")
                    .accessibilityIdentifier("feedback-message")
                    .disabled(!editable)
                HStack {
                    Text("提交时会附上应用版本。")
                    Spacer()
                    Text("\(length) / \(FeedbackClient.messageLimit)")
                        .foregroundStyle(length > FeedbackClient.messageLimit ? Color.red : palette.inkSoft)
                }
                .font(PixelFont.font(12))
                .foregroundStyle(palette.inkSoft)

                if let status = error ?? (FeedbackClient.endpoint == nil ? "反馈服务尚未配置。" : nil) {
                    Text(status)
                        .foregroundStyle(palette.ink)
                        .accessibilityIdentifier("feedback-status")
                }
            }

            HStack(spacing: 8) {
                Spacer()
                Button(sent ? "完成" : "关闭") { dismiss() }
                    .buttonStyle(PixelButtonStyle(palette: palette))
                    .disabled(sending)
                if !sent {
                    Button(sending ? "提交中…" : "提交") { submit() }
                        .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                        .accessibilityIdentifier("feedback-submit")
                        .disabled(!canSubmit)
                }
            }
        }
        .font(PixelFont.font(13))
        .foregroundStyle(palette.ink)
        .padding(20)
        .frame(width: 460)
        .background(PixelBackdrop(palette: palette))
        .interactiveDismissDisabled(sending)
    }

    private func feedbackPicker(_ title: String, options: [(String, String)],
                                selection: Binding<String>, id: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).foregroundStyle(palette.inkSoft)
            PixelSelect(options: [("", "请选择")] + options, selection: selection, palette: palette)
                .accessibilityLabel(title)
                .accessibilityIdentifier(id)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func submit() {
        guard canSubmit, let endpoint = FeedbackClient.endpoint else { return }
        let details = FeedbackDetails(feedbackType: draft.feedbackType, featureArea: draft.featureArea,
                                      message: draft.trimmedMessage)
        if draft.submittedDetails != details { draft.id = UUID() }
        draft.submittedDetails = details
        let id = draft.id
        sending = true
        error = nil
        Task { @MainActor in
            defer { sending = false }
            do {
                try await FeedbackClient.send(details, id: id, to: endpoint)
                draft = FeedbackDraft()
                sent = true
            } catch let failure as FeedbackClient.Failure {
                error = failure.localizedDescription
            } catch {
                self.error = "暂时无法连接反馈服务，请检查网络后重试。"
            }
        }
    }
}
