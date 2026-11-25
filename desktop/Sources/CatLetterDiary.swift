import Foundation

struct CatLetterSender {
    let name: String

    init(profileName: String?, explicitlyNamed: Bool?, presetNames: [String]) {
        let profileName = (profileName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let isNamed = explicitlyNamed ?? !presetNames.contains(profileName)
        name = isNamed && !profileName.isEmpty ? profileName : "小猫"
    }

    var title: String { "\(name)来信" }
    var signature: String { "你的\(name)" }
}

struct CatLetterDay: Codable, Equatable {
    var firstLaunch: Date?
    var runningSeconds: TimeInterval = 0
    var firstUse: Date?
    var lastUse: Date?
    var lastEligibleSample: Date?
    var activeSeconds: TimeInterval = 0
    var lateSeconds: TimeInterval = 0
    var typingSeconds: TimeInterval?
    var keystrokes: Int?
}

enum CatLetterReason: String, Codable, Equatable {
    case late, long, both, ordinary

    init?(_ day: CatLetterDay) {
        let late = day.lateSeconds >= 15 * 60
        let long = day.activeSeconds >= 8 * 3600
        switch (late, long) {
        case (true, true): self = .both
        case (true, false): self = .late
        case (false, true): self = .long
        case (false, false): return nil
        }
    }

    var legacyMessage: String {
        switch self {
        case .late: return "昨晚你用电脑到挺晚的。今天有空就合上屏幕歇一会儿，恢复一点精神再继续。"
        case .long: return "昨天你在电脑前待了不少时间。忙里记得给眼睛和肩膀留个小休息。"
        case .both: return "昨天你在电脑前忙了挺久，夜里也还在用电脑。今天给自己留个停下来喝水、看看远处的空档吧。"
        case .ordinary: return CatLetterTemplate.note.message
        }
    }
}

enum CatLetterTemplate: String, Codable, CaseIterable {
    case closeDay, moon, bookmark, nightHug
    case tail, chair, sun, deskCompanion
    case early, morning, afternoon, heldLetter
    case fingers, rain, space, paws
    case windowSeat, sunset, tailChase, ordinaryDay
    case desk, firstLetter, whiskers, note

    var message: String {
        switch self {
        case .closeDay: return "昨晚很晚了，我们还在桌边。今天见到你，想先把脑袋凑过来，让你摸两下。早啊，我在呢。"
        case .moon: return "昨晚都快到零点了，你还在桌边。我把脑袋搁在爪子上眯了一会儿。醒来听见你还在，心里就暖了一下。"
        case .bookmark: return "昨晚的灯亮了很久。我在桌角团成一小团，尾巴尖朝着你。今晚要是我们又碰面，我还趴在你伸手就够得到的地方。"
        case .nightHug: return "这几天有两个晚上，我们都在桌边待到了很晚。今天见到你，我想趴近一点，留一只暖乎乎的爪子在你手边。"
        case .tail: return "昨天我们在桌边坐了很久。今天你坐下的时候，我可以把尾巴搭在你手边。就这么挨着，过一小会儿也很好。"
        case .chair: return "昨天我们从白天坐到了夜里。天暗下来的时候，我悄悄往你那边挪了一点。今天也让我坐近一点吧，我会把尾巴收好。"
        case .sun: return "昨天你在电脑前待了好久。今天要是窗边有一小块太阳，我想跟你分着晒。等你坐过来，我就往旁边挪一挪。"
        case .deskCompanion: return "这两天，我们都在桌边陪了彼此很久。今天要是你伸手过来，我就把下巴搁上去，借你的手歇一小会儿。"
        case .early: return "早呀。你坐下的时候，我的信封还在肚子底下焐着。现在推给你，边角还有一点我的体温。"
        case .morning: return "早呀，见到你啦。我刚给自己洗过脸，顺便把桌边最好趴的那一小块地方留给你。咱们挨着坐一会儿。"
        case .afternoon: return "下午好呀。我在桌边换了好几次趴姿，这会儿终于见到你了。信在我肚子底下焐过，递给你时还是暖的。"
        case .heldLetter: return "刚才我把信压在爪子底下，陪你安静地待了一会儿。现在轻轻推给你。你想什么时候拆都好，我就在旁边。"
        case .fingers: return "昨天你的手指在键盘上跑了好久。我今天把脑袋往你手边凑一点，正好够你轻轻摸一下。摸多久都由你。"
        case .rain: return "昨天桌边响了好一阵哒哒声，像一阵很细的小雨。我听着听着就蜷起来了。今天我还想在你旁边打个盹。"
        case .space: return "昨天键盘哒哒地响了好久。我也想给你回一句，就用爪子轻轻按了一下空格。这个小空格里，装着我陪你坐的一会儿。"
        case .paws: return "昨天我们在桌边待了很久，你的手指也一直在忙。今天我把两只爪子摊开，一只给自己，一只借你握一会儿。"
        case .windowSeat: return "昨天桌边比前几天安静些，我就把窝挪到了窗边。要是你今天路过，我想把窗台暖和的那头分给你。"
        case .sunset: return "昨晚桌边安静得早，我趴在窗边看天一点点暗下来。想起你今天还会来，就把靠窗的位置给你留着。"
        case .tailChase: return "昨天桌边安安静静，我自己追了几圈尾巴。今天你来了，就想挨着你趴一会儿。我的尾巴也累了，正好一起歇歇。"
        case .ordinaryDay: return "昨天我在桌角换了好几种趴姿。最喜欢的还是那种一抬头就能看见你的。今天也想这么趴。"
        case .desk: return "今天我挑了一个离你近的地方趴着。你偶尔看过来，我就朝你慢慢眨一下眼。那是我说「有你在真好」的办法。"
        case .firstLetter: return "你好呀，这是我第一次给你写信。我把最轻的一声喵折进信封里。你看信的时候，我就趴在你手边。"
        case .whiskers: return "我刚洗完脸，左边的胡子还翘着。我想就这样过来见你吧。早呀，今天的第一声呼噜留给你。"
        case .note: return "我本来想写一封很长的信。趴在纸边想了一会儿，还是想直接告诉你。今天又见到你，我很高兴。"
        }
    }
}

struct CatLetterReceipt: Codable, Equatable {
    let day: String
    let reason: CatLetterReason
    var template: CatLetterTemplate? = nil

    var message: String { template?.message ?? reason.legacyMessage }
}

struct CatLetterState: Codable, Equatable {
    var days: [String: CatLetterDay] = [:]
    var receipt: CatLetterReceipt?
    var lastOrdinaryDay: String?
}

final class CatLetterDiary {
    static let idleLimit: TimeInterval = 300
    static let samplingInterval: TimeInterval = 15

    struct Sample {
        let date: Date
        let uptime: TimeInterval
        let eligible: Bool
        let idle: TimeInterval
    }

    private(set) var state: CatLetterState
    var calendar: Calendar
    private var previous: Sample?
    private var previousZone: String?
    private var inputAfter: TimeInterval = 0
    private var lastInput: TimeInterval?
    private var deferredDay: String?
    private(set) var isUsingComputer = false

    init(state: CatLetterState = CatLetterState(), calendar: Calendar? = nil) {
        self.state = state
        var local = Calendar(identifier: .gregorian)
        local.timeZone = .autoupdatingCurrent
        self.calendar = calendar ?? local
    }

    func dayKey(_ date: Date) -> String {
        let fields = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", fields.year ?? 0, fields.month ?? 0, fields.day ?? 0)
    }

    func markLaunch(_ date: Date) {
        let key = dayKey(date)
        let recorded = state.days[key]?.firstLaunch ?? date
        state.days[key, default: CatLetterDay()].firstLaunch = min(recorded, date)
    }

    // A restart, unlock, session switch or disabled observer starts a fresh span.
    func cut(at uptime: TimeInterval) {
        previous = nil
        resetUse(at: uptime)
    }

    func resetUse(at uptime: TimeInterval) {
        inputAfter = uptime
        lastInput = nil
        isUsingComputer = false
    }

    func capture(_ sample: Sample) {
        let zone = calendar.timeZone.identifier
        var span: DateInterval?
        var canCountActivity = false
        if let previous {
            let wall = sample.date.timeIntervalSince(previous.date)
            let elapsed = sample.uptime - previous.uptime
            if elapsed < 0 || elapsed > Self.samplingInterval * 3 || abs(wall - elapsed) > 2 || zone != previousZone {
                cut(at: sample.uptime)
            } else if wall > 0 {
                span = DateInterval(start: previous.date, end: sample.date)
                canCountActivity = previous.eligible && sample.eligible
            }
        }
        previous = sample
        previousZone = zone
        if let span {
            split(span) { key, slice in
                state.days[key, default: CatLetterDay()].runningSeconds += slice.duration
            }
        }
        if state.days.count > 8 {
            for key in state.days.keys.sorted().dropLast(8) { state.days.removeValue(forKey: key) }
        }
        guard sample.eligible else {
            inputAfter = sample.uptime
            lastInput = nil
            isUsingComputer = false
            return
        }

        let today = dayKey(sample.date)
        state.days[today, default: CatLetterDay()].lastEligibleSample = sample.date
        var activeWindows: [DateInterval] = []
        if let lastInput { activeWindows.append(activeWindow(input: lastInput, sample: sample)) }
        let observed = sample.uptime - sample.idle
        if sample.idle.isFinite && sample.idle >= 0 && observed > inputAfter,
           lastInput.map({ observed - $0 > 0.2 }) ?? true {
            lastInput = observed
            let date = sample.date.addingTimeInterval(-sample.idle)
            let key = dayKey(date)
            var day = state.days[key, default: CatLetterDay()]
            day.firstUse = min(day.firstUse ?? date, date)
            day.lastUse = max(day.lastUse ?? date, date)
            state.days[key] = day
            activeWindows.append(activeWindow(input: observed, sample: sample))
        }
        isUsingComputer = lastInput.map { sample.uptime - $0 < Self.idleLimit } ?? false

        if let span, canCountActivity {
            var countedThrough = span.start
            for window in activeWindows {
                let start = max(countedThrough, span.start, window.start)
                let end = min(span.end, window.end)
                guard start < end else { continue }
                split(DateInterval(start: start, end: end)) { key, slice in
                    state.days[key, default: CatLetterDay()].activeSeconds += slice.duration
                    if let late = dueTime(on: slice.start, hour: 22, minute: 30) {
                        state.days[key, default: CatLetterDay()].lateSeconds += max(0, slice.end.timeIntervalSince(max(late, slice.start)))
                    }
                }
                countedThrough = end
            }
        }
    }

    func captureTyping(for date: Date, seconds: TimeInterval, keys: Int) {
        let key = dayKey(date)
        guard var day = state.days[key] else { return }
        day.typingSeconds = seconds
        day.keystrokes = keys
        state.days[key] = day
    }

    func due(at date: Date, focusing: Bool = false, recording: Bool = false, petVisible: Bool = true,
             typingEnabled: Bool = false) -> CatLetterReceipt? {
        let today = dayKey(date)
        guard petVisible, isUsingComputer,
              let earliest = dueTime(on: date, hour: 7, minute: 30), date >= earliest,
              state.receipt.map({ $0.day < today }) ?? true,
              let yesterday = calendar.date(byAdding: .day, value: -1, to: date),
              let day = state.days[dayKey(yesterday)] else { return nil }
        let reason: CatLetterReason
        if let alert = CatLetterReason(day) {
            reason = alert
        } else {
            // Ordinary notes require both actual use and meaningful observation on the previous day.
            guard day.activeSeconds >= 20 * 60, day.runningSeconds >= 2 * 3600,
                  let cooldown = calendar.date(byAdding: .day, value: -7, to: date),
                  state.lastOrdinaryDay.map({ $0 <= dayKey(cooldown) }) ?? true else { return nil }
            reason = .ordinary
        }
        if focusing || recording {
            deferredDay = today
            return nil
        }
        let matches = matchingTemplates(reason: reason, yesterday: yesterday, day: day, now: date,
                                        earliest: earliest, typingEnabled: typingEnabled)
        let alternatives = matches.filter { $0 != state.receipt?.template }
        let pool = alternatives.isEmpty ? matches : alternatives
        let index = (calendar.ordinality(of: .day, in: .era, for: date) ?? 0) % pool.count
        return CatLetterReceipt(day: today, reason: reason, template: pool[index])
    }

    func matchingTemplates(reason: CatLetterReason, yesterday: Date, day: CatLetterDay, now: Date,
                           earliest: Date, typingEnabled: Bool) -> [CatLetterTemplate] {
        // The deferred wording is reserved for a letter actually held during an active session.
        if deferredDay == dayKey(now) { return [.heldLetter] }
        if reason == .ordinary, state.receipt == nil { return [.firstLetter] }

        let hour = calendar.component(.hour, from: now)
        var matches: [CatLetterTemplate]
        switch reason {
        case .late: matches = hour < 12 ? [.closeDay, .bookmark] : [.bookmark]
        case .long: matches = [.tail]
        case .both: matches = [.chair]
        case .ordinary: matches = [.ordinaryDay, .desk, .note]
        }
        let earlier = (1...6).compactMap { offset -> CatLetterDay? in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: yesterday) else { return nil }
            return state.days[dayKey(date)]
        }
        let priorDay = calendar.date(byAdding: .day, value: -1, to: yesterday).flatMap { state.days[dayKey($0)] }

        if reason == .late || reason == .both {
            if let last = day.lastUse, let threshold = dueTime(on: yesterday, hour: 23, minute: 30),
               dayKey(last) == dayKey(yesterday), last >= threshold { matches.append(.moon) }
            let recent = (1...2).compactMap { calendar.date(byAdding: .day, value: -$0, to: yesterday) }
                .compactMap { state.days[dayKey($0)] }
            if recent.contains(where: { $0.lateSeconds >= 15 * 60 }) { matches.append(.nightHug) }
        }
        if reason == .long || reason == .both {
            if day.activeSeconds >= 10 * 3600 { matches.append(.sun) }
            if let priorDay, priorDay.activeSeconds >= 8 * 3600 { matches.append(.deskCompanion) }
        }
        if reason == .ordinary, day.runningSeconds >= 8 * 3600 {
            if day.activeSeconds <= 4 * 3600,
               earlier.contains(where: { $0.activeSeconds >= 8 * 3600 }) { matches.append(.windowSeat) }
            if let last = day.lastUse, let observed = day.lastEligibleSample,
               let earlyStop = dueTime(on: yesterday, hour: 18, minute: 0),
               let evening = dueTime(on: yesterday, hour: 22, minute: 30),
               last <= earlyStop, observed >= evening { matches.append(.sunset) }
            let comparable = earlier.filter { $0.runningSeconds >= 8 * 3600 && $0.activeSeconds > 0 }.map(\.activeSeconds)
            if let median = medianOfRecordedDays(comparable), median >= day.activeSeconds * 2 {
                matches.append(.tailChase)
            }
        }
        if typingEnabled {
            let seconds = day.typingSeconds ?? 0
            let keys = day.keystrokes ?? 0
            let typicalTime = medianOfRecordedDays(earlier.compactMap(\.typingSeconds))
            let typicalKeys = medianOfRecordedDays(earlier.compactMap(\.keystrokes).map(Double.init))
            let moreTime = seconds >= 20 * 60 && typicalTime.map { seconds >= 1.6 * $0 } == true
            let moreKeys = keys >= 1000 && typicalKeys.map { Double(keys) >= 1.6 * $0 } == true
            if moreTime { matches.append(.fingers) }
            if moreKeys { matches.append(.rain) }
            if moreTime && moreKeys { matches.append(.space) }
            if moreTime && day.activeSeconds >= 8 * 3600 { matches.append(.paws) }
        }

        if let first = state.days[dayKey(now)]?.firstUse {
            if first < earliest, now < earliest.addingTimeInterval(60) {
                matches.append(.early)
            } else if first >= earliest, hour < 10 {
                matches.append(.morning)
            }
            if (12..<18).contains(hour) && (12..<18).contains(calendar.component(.hour, from: first)) {
                matches.append(.afternoon)
            }
        }
        if reason == .ordinary, hour < 12 { matches.append(.whiskers) }
        return matches
    }

    private func medianOfRecordedDays(_ earlier: [Double]) -> Double? {
        let values = earlier.filter { $0 > 0 }.sorted()
        guard values.count >= 3 else { return nil }
        return (values[(values.count - 1) / 2] + values[values.count / 2]) / 2
    }

    func deliveredToday(at date: Date) -> CatLetterReceipt? {
        guard let receipt = state.receipt, receipt.day == dayKey(date) else { return nil }
        return receipt
    }

    func recordDelivery(_ receipt: CatLetterReceipt, save: (CatLetterState) -> Bool) -> Bool {
        guard state.receipt.map({ $0.day < receipt.day }) ?? true else { return false }
        var updated = state
        updated.receipt = receipt
        if receipt.reason == .ordinary { updated.lastOrdinaryDay = receipt.day }
        guard save(updated) else { return false }
        state = updated
        return true
    }

    private func activeWindow(input: TimeInterval, sample: Sample) -> DateInterval {
        let start = sample.date.addingTimeInterval(input - sample.uptime)
        return DateInterval(start: start, duration: Self.idleLimit)
    }

    private func dueTime(on date: Date, hour: Int, minute: Int) -> Date? {
        calendar.date(bySettingHour: hour, minute: minute, second: 0, of: calendar.startOfDay(for: date))
    }

    private func split(_ interval: DateInterval, visit: (String, DateInterval) -> Void) {
        var start = interval.start
        while start < interval.end, let day = calendar.dateInterval(of: .day, for: start), day.end > start {
            let end = min(day.end, interval.end)
            visit(dayKey(start), DateInterval(start: start, end: end))
            start = end
        }
    }
}

struct CatLetterStorage {
    let file: URL

    func load() -> CatLetterState {
        guard let bytes = try? Data(contentsOf: file),
              let state = try? JSONDecoder().decode(CatLetterState.self, from: bytes) else { return CatLetterState() }
        return state
    }

    func save(_ state: CatLetterState) -> Bool {
        do {
            let bytes = try JSONEncoder().encode(state)
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try bytes.write(to: file, options: .atomic)
            return true
        } catch {
            return false
        }
    }
}
