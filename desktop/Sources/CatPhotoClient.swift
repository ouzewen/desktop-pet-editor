import AppKit
import Foundation
import ImageIO

struct CatPhotoInput {
    let image: NSImage
    let jpeg: Data

    init?(url: URL) {
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let thumbnail = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 640,
              ] as CFDictionary) else { return nil }
        let bitmap = NSBitmapImageRep(cgImage: thumbnail)
        guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else { return nil }
        image = NSImage(cgImage: thumbnail, size: NSSize(width: thumbnail.width, height: thumbnail.height))
        jpeg = data
    }
}

private final class CatPhotoSession: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}

final class CatPhotoClient {
    typealias Analysis = (observations: [String: Any], views: [[String: Any]], individual: [[String: Any]],
                          coatPattern: String?, usage: [[String: Any]], model: String?)
    static let recognizesLocally = Bundle.main.object(forInfoDictionaryKey: "PetPhotoLocal") as? Bool == true

    private struct Failure: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    private let endpoint: URL?
    private let session: URLSession = {
        let settings = URLSessionConfiguration.ephemeral
        settings.timeoutIntervalForResource = 245
        return URLSession(configuration: settings, delegate: CatPhotoSession(), delegateQueue: nil)
    }()

    init(baseURL: String? = Bundle.main.object(forInfoDictionaryKey: "PetPhotoBackendURL") as? String) {
        if let baseURL, let base = URL(string: baseURL), let host = base.host, !host.isEmpty,
           base.user == nil, base.password == nil, base.query == nil, base.fragment == nil,
           base.scheme == "https" || (base.scheme == "http" && ["127.0.0.1", "localhost"].contains(host)),
           !Self.recognizesLocally || ["127.0.0.1", "localhost"].contains(host) {
            endpoint = base.appendingPathComponent("v1").appendingPathComponent("cat-photo")
        } else {
            endpoint = nil
        }
    }

    func analyze(
        photos: [Data], progress: @escaping (String) -> Void,
        completion: @escaping (Result<Analysis, Error>) -> Void
    ) {
        guard (1...3).contains(photos.count) else {
            completion(.failure(Failure(message: "请选择一张首图，最多再加两张同一只猫的补图。")))
            return
        }
        guard let endpoint else {
            completion(.failure(Failure(message: "尚未配置照片识别服务。")))
            return
        }
        progress("正在准备照片并识别花色…")
        DispatchQueue.global(qos: .userInitiated).async {
            let evidence = photos.map { CatPhotoFurEvidence.measure(jpeg: $0) ?? [:] }
            let dark = evidence.first?["dark"] as? Double ?? 0
            let orange = evidence.first?["orange"] as? Double ?? 1
            let body: [String: Any] = ["photos": photos.map { $0.base64EncodedString() },
                                       "checkDarkCoat": dark >= 0.52 && orange <= 0.055]
            var request = URLRequest(url: endpoint, timeoutInterval: photos.count > 1 ? 240 : 125)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do { request.httpBody = try JSONSerialization.data(withJSONObject: body) }
            catch {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            DispatchQueue.main.async {
                progress(Self.recognizesLocally ? "正在本机识别照片并匹配花色…" : "正在云端识别照片并匹配花色…")
            }
            self.session.dataTask(with: request) { data, response, error in
                let result = Result<Analysis, Error> {
                    guard error == nil, let status = (response as? HTTPURLResponse)?.statusCode, let data,
                          let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                        throw Failure(message: Self.recognizesLocally
                            ? "无法连接本地照片识别服务。请检查本机服务是否已经启动。"
                            : "无法连接照片识别服务。请检查网络后重试。")
                    }
                    if status == 429 || status == 503 { throw Failure(message: "照片识别服务繁忙，请稍后重试。") }
                    guard status == 200, let observations = object["observations"] as? [String: Any] else {
                        throw Failure(message: "照片识别失败。请重试或换一张更清晰的猫照。")
                    }
                    return (observations, evidence, object["individual"] as? [[String: Any]] ?? [],
                            object["coatPattern"] as? String, object["calls"] as? [[String: Any]] ?? [],
                            object["model"] as? String)
                }
                DispatchQueue.main.async { completion(result) }
            }.resume()
        }
    }
}
