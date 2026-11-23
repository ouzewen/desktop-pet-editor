import AppKit
import CoreLocation
import Foundation
import SwiftUI

// MARK: - Data

struct WeatherSnapshot {
    let city: String
    let temperature: Double
    let apparent: Double
    let humidity: Int
    let wind: Double
    let rainChance: Int
    let low: Double
    let high: Double
    let code: Int

    /// WMO weather code in plain Chinese.
    var condition: String {
        switch code {
        case 0: return "晴"
        case 1, 2: return "多云"
        case 3: return "阴"
        case 45, 48: return "雾"
        case 51, 53, 55, 56, 57: return "毛毛雨"
        case 61, 63, 65, 66, 67: return "雨"
        case 71, 73, 75, 77: return "雪"
        case 80, 81, 82: return "阵雨"
        case 85, 86: return "阵雪"
        case 95, 96, 99: return "雷阵雨"
        default: return "多云"
        }
    }

    /// The primary city name without its province, so the headline fits one line.
    var displayCity: String {
        city.split(separator: "·").first.map { $0.trimmingCharacters(in: .whitespaces) } ?? city
    }

    var headline: String {
        String(format: "%@ 今天 %.0f~%.0f℃，体感 %.0f℃", displayCity, low, high, apparent)
    }
}

/// Turns one snapshot into the one-line-per-topic advice the card shows. Kept
/// pure so `--self-test` can check the wording rules without any network.
enum WeatherRules {
    static func advice(for snapshot: WeatherSnapshot) -> [String] {
        var lines: [String] = []
        switch snapshot.apparent {
        case ..<0: lines.append("很冷，羽绒服或厚外套。")
        case 0..<10: lines.append("冷，出门加件外套。")
        case 10..<18: lines.append("凉，长袖加件薄外套。")
        case 18..<26: lines.append("舒适，正常穿就好。")
        default: lines.append("热，注意补水和防晒。")
        }
        if snapshot.high - snapshot.low >= 8 {
            lines.append("早晚温差 \(Int((snapshot.high - snapshot.low).rounded()))℃，带件外套。")
        }
        if snapshot.rainChance >= 40 {
            lines.append("降水概率 \(snapshot.rainChance)%，带把伞。")
        }
        if snapshot.humidity < 30 {
            lines.append("空气干燥，多喝热水。")
        }
        if snapshot.humidity > 80 && snapshot.temperature > 26 {
            lines.append("闷热，注意补水。")
        }
        if snapshot.wind >= 25 {
            lines.append("风有点大，注意保暖。")
        }
        return lines
    }
}

// MARK: - Location

final class WeatherLocator: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var completion: ((CLLocationCoordinate2D?) -> Void)?
    private var finished = false
    private var timeoutItem: DispatchWorkItem?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    /// Resolves the Mac's own position, giving up quietly after `timeout` so the
    /// caller can fall back to IP geolocation.
    func resolve(timeout: TimeInterval = 8, completion: @escaping (CLLocationCoordinate2D?) -> Void) {
        guard self.completion == nil else { return }
        self.completion = completion
        finished = false
        let item = DispatchWorkItem { [weak self] in self?.finish(nil) }
        timeoutItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + timeout, execute: item)

        switch manager.authorizationStatus {
        case .authorized, .authorizedAlways:
            manager.requestLocation()
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        default:
            finish(nil)
        }
    }

    private func finish(_ coordinate: CLLocationCoordinate2D?) {
        guard !finished else { return }
        finished = true
        timeoutItem?.cancel()
        timeoutItem = nil
        let block = completion
        completion = nil
        block?(coordinate)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorized, .authorizedAlways:
            manager.requestLocation()
        case .denied, .restricted:
            finish(nil)
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        finish(locations.last?.coordinate)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        finish(nil)
    }
}

// MARK: - Lookups

enum WeatherLookup {
    private static let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 10
        configuration.timeoutIntervalForResource = 15
        return URLSession(configuration: configuration)
    }()

    static func cityName(for coordinate: CLLocationCoordinate2D, completion: @escaping (String?) -> Void) {
        let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        CLGeocoder().reverseGeocodeLocation(location) { placemarks, _ in
            guard let mark = placemarks?.first else { completion(nil); return }
            completion(mark.locality ?? mark.administrativeArea ?? mark.name)
        }
    }

    /// Resolves a typed city through Open-Meteo's free geocoder.
    static func coordinate(
        forCity city: String,
        completion: @escaping (CLLocationCoordinate2D?, String?) -> Void
    ) {
        var components = URLComponents(string: "https://geocoding-api.open-meteo.com/v1/search")
        components?.queryItems = [
            URLQueryItem(name: "name", value: city),
            URLQueryItem(name: "count", value: "1"),
            URLQueryItem(name: "language", value: "zh"),
            URLQueryItem(name: "format", value: "json"),
        ]
        guard let url = components?.url else { completion(nil, nil); return }
        session.dataTask(with: url) { data, _, _ in
            guard let data,
                  let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let results = root["results"] as? [[String: Any]],
                  let first = results.first,
                  let latitude = first["latitude"] as? Double,
                  let longitude = first["longitude"] as? Double else {
                completion(nil, nil)
                return
            }
            let name = first["name"] as? String ?? city
            let province = first["admin1"] as? String
            completion(
                CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
                province.map { $0 == name ? name : "\(name) · \($0)" } ?? name
            )
        }.resume()
    }

    /// City-level fallback when system location is unavailable.
    static func ipCoordinate(completion: @escaping (CLLocationCoordinate2D?, String?) -> Void) {
        guard let url = URL(string: "https://ipinfo.io/json") else { completion(nil, nil); return }
        session.dataTask(with: url) { data, _, _ in
            guard let data,
                  let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let loc = root["loc"] as? String else {
                completion(nil, nil)
                return
            }
            let parts = loc.split(separator: ",").compactMap { Double($0) }
            guard parts.count == 2 else { completion(nil, nil); return }
            let city = root["city"] as? String
            completion(CLLocationCoordinate2D(latitude: parts[0], longitude: parts[1]), city)
        }.resume()
    }

    enum Failure: Error {
        case network
    }

    static func forecast(
        coordinate: CLLocationCoordinate2D,
        city: String,
        completion: @escaping (Result<WeatherSnapshot, Failure>) -> Void
    ) {
        var components = URLComponents(string: "https://api.open-meteo.com/v1/forecast")
        components?.queryItems = [
            URLQueryItem(name: "latitude", value: String(coordinate.latitude)),
            URLQueryItem(name: "longitude", value: String(coordinate.longitude)),
            URLQueryItem(
                name: "current",
                value: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
            ),
            URLQueryItem(
                name: "daily",
                value: "temperature_2m_max,temperature_2m_min,precipitation_probability_max"
            ),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "forecast_days", value: "1"),
        ]
        guard let url = components?.url else { completion(.failure(.network)); return }
        session.dataTask(with: url) { data, _, _ in
            guard let data,
                  let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let current = root["current"] as? [String: Any],
                  let daily = root["daily"] as? [String: Any],
                  let temperature = current["temperature_2m"] as? Double,
                  let apparent = current["apparent_temperature"] as? Double,
                  let high = (daily["temperature_2m_max"] as? [Double])?.first,
                  let low = (daily["temperature_2m_min"] as? [Double])?.first else {
                completion(.failure(.network))
                return
            }
            let humidity = (current["relative_humidity_2m"] as? NSNumber)?.intValue ?? 0
            let code = (current["weather_code"] as? NSNumber)?.intValue ?? 0
            let wind = current["wind_speed_10m"] as? Double ?? 0
            let rain = ((daily["precipitation_probability_max"] as? [NSNumber])?.first?.intValue) ?? 0
            completion(.success(WeatherSnapshot(
                city: city,
                temperature: temperature,
                apparent: apparent,
                humidity: humidity,
                wind: wind,
                rainChance: rain,
                low: low,
                high: high,
                code: code
            )))
        }.resume()
    }
}

// MARK: - Preferences and fetching

final class WeatherModel {
    private enum Key {
        static let enabled = "shibaWeatherEnabled"
        static let city = "shibaWeatherCity"
        static let reminder = "shibaWeatherReminderMinutes"
        static let lastShown = "shibaWeatherLastShownDay"
        static let cacheLatitude = "shibaWeatherLatitude"
        static let cacheLongitude = "shibaWeatherLongitude"
        static let cacheCity = "shibaWeatherResolvedCity"
        static let cacheAt = "shibaWeatherResolvedAt"
    }

    static let reminderPresets = [8 * 60, 8 * 60 + 30, 9 * 60, 12 * 60, 18 * 60]
    private static let cacheLifetime: TimeInterval = 7 * 24 * 60 * 60

    private let defaults = UserDefaults.standard

    var onChange: (() -> Void)?

    private(set) var enabled: Bool
    private(set) var cityOverride: String
    private(set) var reminderMinutes: Int
    private(set) var lastShownDay: String

    private var cachedCoordinate: CLLocationCoordinate2D?
    private var cachedCity: String?
    private var cachedAt: Date?

    private lazy var locator = WeatherLocator()

    init() {
        enabled = defaults.bool(forKey: Key.enabled)
        cityOverride = defaults.string(forKey: Key.city) ?? ""
        let saved = defaults.integer(forKey: Key.reminder)
        reminderMinutes = WeatherModel.reminderPresets.contains(saved) ? saved : 8 * 60 + 30
        lastShownDay = defaults.string(forKey: Key.lastShown) ?? ""
        if defaults.object(forKey: Key.cacheLatitude) != nil {
            let latitude = defaults.double(forKey: Key.cacheLatitude)
            let longitude = defaults.double(forKey: Key.cacheLongitude)
            cachedCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            cachedCity = defaults.string(forKey: Key.cacheCity)
            if let at = defaults.object(forKey: Key.cacheAt) as? Date { cachedAt = at }
        }
    }

    var reminderText: String {
        String(format: "%02d:%02d", reminderMinutes / 60, reminderMinutes % 60)
    }

    var cityText: String {
        cityOverride.isEmpty ? (cachedCity ?? "自动定位") : cityOverride
    }

    func setEnabled(_ value: Bool) {
        enabled = value
        defaults.set(value, forKey: Key.enabled)
        onChange?()
    }

    func setCityOverride(_ value: String) {
        cityOverride = value.trimmingCharacters(in: .whitespacesAndNewlines)
        defaults.set(cityOverride, forKey: Key.city)
        if cityOverride.isEmpty {
            cachedCoordinate = nil
            cachedCity = nil
            defaults.removeObject(forKey: Key.cacheLatitude)
            defaults.removeObject(forKey: Key.cacheLongitude)
            defaults.removeObject(forKey: Key.cacheCity)
            defaults.removeObject(forKey: Key.cacheAt)
        }
        onChange?()
    }

    func setReminderMinutes(_ minutes: Int) {
        guard WeatherModel.reminderPresets.contains(minutes) else { return }
        reminderMinutes = minutes
        defaults.set(minutes, forKey: Key.reminder)
        onChange?()
    }

    /// True when today's reminder is enabled, past its time, and not shown yet.
    func shouldRemind(now: Date = Date()) -> Bool {
        guard enabled else { return false }
        let calendar = Calendar.current
        let minutes = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
        guard minutes >= reminderMinutes else { return false }
        return lastShownDay != WeatherModel.dayKey(for: now)
    }

    func markShown(now: Date = Date()) {
        lastShownDay = WeatherModel.dayKey(for: now)
        defaults.set(lastShownDay, forKey: Key.lastShown)
    }

    private static func dayKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar.current
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    // MARK: Resolving

    private func resolvedCoordinate(
        completion: @escaping (CLLocationCoordinate2D?, String?) -> Void
    ) {
        if !cityOverride.isEmpty {
            WeatherLookup.coordinate(forCity: cityOverride) { coordinate, name in
                completion(coordinate, name ?? self.cityOverride)
            }
            return
        }
        if let coordinate = cachedCoordinate,
           let cachedAt,
           Date().timeIntervalSince(cachedAt) < WeatherModel.cacheLifetime {
            completion(coordinate, cachedCity)
            return
        }
        // System location first (works behind a VPN), then the IP fallback.
        locator.resolve { [weak self] coordinate in
            guard let self else { return }
            guard let coordinate else {
                WeatherLookup.ipCoordinate { ipCoordinate, city in
                    guard let ipCoordinate else {
                        completion(nil, city)
                        return
                    }
                    // The IP service answers in its own language; Apple's reverse
                    // geocoder gives a localised name without needing permission.
                    WeatherLookup.cityName(for: ipCoordinate) { localised in
                        let name = localised ?? city
                        self.remember(ipCoordinate, city: name)
                        completion(ipCoordinate, name)
                    }
                }
                return
            }
            WeatherLookup.cityName(for: coordinate) { name in
                self.remember(coordinate, city: name)
                completion(coordinate, name)
            }
        }
    }

    private func remember(_ coordinate: CLLocationCoordinate2D?, city: String?) {
        guard let coordinate else { return }
        cachedCoordinate = coordinate
        cachedCity = city
        cachedAt = Date()
        defaults.set(coordinate.latitude, forKey: Key.cacheLatitude)
        defaults.set(coordinate.longitude, forKey: Key.cacheLongitude)
        defaults.set(city, forKey: Key.cacheCity)
        defaults.set(Date(), forKey: Key.cacheAt)
    }

    func refresh(completion: @escaping (Result<WeatherSnapshot, WeatherLookup.Failure>) -> Void) {
        resolvedCoordinate { coordinate, city in
            guard let coordinate else {
                completion(.failure(.network))
                return
            }
            let name = self.cityOverride.isEmpty ? (city ?? "当前位置") : self.cityOverride
            WeatherLookup.forecast(coordinate: coordinate, city: name) { result in
                if case .failure = result { self.cachedCoordinate = nil }
                completion(result)
            }
        }
    }
}

// MARK: - Card

struct WeatherCard: View {
    /// A snapshot, or the reason there is none.
    let snapshot: WeatherSnapshot?
    let failure: String?

    var onDismiss: () -> Void = {}
    var onOpenWeather: () -> Void = {}
    var onRetry: () -> Void = {}
    var onHeightChange: (CGFloat) -> Void = { _ in }

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    private var palette: PixelPalette { theme.palette }

    private var advice: [String] {
        guard let snapshot else { return [] }
        return WeatherRules.advice(for: snapshot)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            WorkbenchCardHeading(title: snapshot == nil ? "天气" : "今日天气", glyph: .cloud, palette: palette) {
                WorkbenchCardIconButton(glyph: .close, title: "关闭天气", palette: palette, action: onDismiss)
            }

            if let snapshot {
                Text(snapshot.headline)
                    .font(.system(size: 12))
                    .foregroundStyle(palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                ForEach(advice, id: \.self) { line in
                    HStack(alignment: .top, spacing: 6) {
                        Rectangle().fill(palette.accent).frame(width: 5, height: 5).padding(.top, 5)
                        Text(line)
                            .font(.system(size: 11))
                            .foregroundStyle(palette.inkSoft)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                HStack(spacing: 6) {
                    Button("知道了", action: onDismiss)
                        .workbenchButton(palette: palette, prominent: true)
                    Button("看天气", action: onOpenWeather)
                        .workbenchButton(palette: palette)
                }
            } else {
                Text(failure ?? "暂时获取不到天气。")
                    .font(.system(size: 11))
                    .foregroundStyle(palette.inkSoft)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 6) {
                    Button("重试", action: onRetry)
                        .workbenchButton(palette: palette, prominent: true)
                    Button("关闭", action: onDismiss)
                        .workbenchButton(palette: palette)
                }
            }
        }
        .padding(10)
        .frame(width: 252, alignment: .leading)
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

// MARK: - City input

final class WeatherCityModel: ObservableObject {
    @Published var text = ""
}

struct WeatherCityCard: View {
    @ObservedObject var model: WeatherCityModel
    let current: String

    var onSave: () -> Void = {}
    var onCancel: () -> Void = {}

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @FocusState private var focused: Bool

    private var palette: PixelPalette { theme.palette }

    private var trimmed: String {
        model.text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            WorkbenchCardHeading(title: "天气城市", glyph: .cloud, palette: palette) {
                WorkbenchCardIconButton(glyph: .close, title: "取消", palette: palette, action: onCancel)
            }

            HStack(spacing: 6) {
                TextField("留空则自动定位", text: $model.text)
                    .textFieldStyle(.plain)
                    .font(.system(size: 12))
                    .foregroundStyle(palette.ink)
                    .focused($focused)
                    .onSubmit(save)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .workbenchCardField(palette: palette, focused: focused)
                Button("保存", action: save)
                    .workbenchButton(palette: palette, prominent: true)
            }

            Text("当前：\(current)。留空并保存可恢复自动定位。")
                .font(.system(size: 11))
                .foregroundStyle(palette.inkSoft)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(10)
        .frame(width: 252, alignment: .leading)
        .workbenchCardSurface(theme)
        .onAppear {
            DispatchQueue.main.async { focused = true }
        }
        .onExitCommand(perform: onCancel)
    }

    private func save() {
        onSave()
    }
}
