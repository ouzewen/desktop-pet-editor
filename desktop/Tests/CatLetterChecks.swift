import Foundation

@main
struct CatLetterChecks {
    static func main() throws {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/Los_Angeles")!
        func date(_ day: Int, _ hour: Int, _ minute: Int, _ second: Int = 0) -> Date {
            calendar.date(from: DateComponents(year: 2026, month: 11, day: day,
                hour: hour, minute: minute, second: second))!
        }
        let yesterday = "2026-11-21", today = "2026-11-22"
        func make(_ active: Double, _ late: Double) -> CatLetterDiary {
            CatLetterDiary(state: CatLetterState(days: [
                yesterday: CatLetterDay(activeSeconds: active, lateSeconds: late)
            ]), calendar: calendar)
        }
        func sample(_ diary: CatLetterDiary, _ at: Date, _ up: Double, _ idle: Double, eligible: Bool = true) {
            diary.capture(.init(date: at, uptime: up, eligible: eligible, idle: idle))
        }

        for (active, late, expected): (Double, Double, CatLetterReason?) in [
            (900, 900, .late), (28_800, 0, .long), (28_800, 900, .both), (28_799, 899, nil)
        ] {
            let diary = make(active, late)
            diary.cut(at: 100)
            sample(diary, date(22, 7, 29, 55), 105, 1)
            precondition(diary.due(at: date(22, 7, 29, 55)) == nil)
            sample(diary, date(22, 7, 30), 110, 6)
            precondition(diary.due(at: date(22, 7, 30))?.reason == expected)
        }
        let empty = CatLetterDiary(calendar: calendar)
        empty.cut(at: 100)
        sample(empty, date(22, 7, 30), 105, 1)
        precondition(empty.due(at: date(22, 7, 30)) == nil)

        let working = make(900, 900)
        working.cut(at: 10)
        for seconds in stride(from: 0, through: 1800, by: 15) {
            let delta = Double(seconds)
            sample(working, date(22, 7, 0).addingTimeInterval(delta), 20 + delta, 2)
            let received = working.due(at: date(22, 7, 0).addingTimeInterval(delta))
            precondition((received != nil) == (seconds == 1800))
        }
        let evening = CatLetterDiary(calendar: calendar)
        evening.cut(at: 10)
        for seconds in stride(from: 0, through: 915, by: 15) {
            let delta = Double(seconds)
            sample(evening, date(21, 22, 29, 45).addingTimeInterval(delta), 20 + delta, 0)
        }
        precondition(evening.state.days[yesterday]?.lateSeconds == 900)
        precondition(CatLetterReason(evening.state.days[yesterday]!) == .late)

        let crossing = CatLetterDiary(calendar: calendar)
        crossing.markLaunch(date(21, 23, 59, 45))
        crossing.cut(at: 100)
        sample(crossing, date(21, 23, 59, 50), 105, 0)
        sample(crossing, date(22, 0, 0, 5), 120, 2)
        precondition(crossing.state.days[yesterday]?.firstLaunch == date(21, 23, 59, 45))
        precondition(crossing.state.days[yesterday]?.activeSeconds == 10)
        precondition(crossing.state.days[yesterday]?.lateSeconds == 10)
        precondition(crossing.state.days[today]?.runningSeconds == 5)
        precondition(crossing.state.days[today]?.activeSeconds == 5)
        precondition(crossing.state.days[today]?.lastUse == date(22, 0, 0, 3))
        crossing.captureTyping(for: date(22, 0, 0, 5), seconds: 2, keys: 4)
        precondition(crossing.state.days[today]?.keystrokes == 4)
        precondition(crossing.state.days[yesterday]?.typingSeconds == nil)

        let afterWake = make(28_800, 900)
        afterWake.cut(at: 100)
        sample(afterWake, date(22, 7, 30), 105, .infinity, eligible: false)
        precondition(afterWake.due(at: date(22, 7, 30)) == nil)
        afterWake.cut(at: 1010)
        sample(afterWake, date(22, 9, 0), 1010, 400)
        sample(afterWake, date(22, 9, 0, 15), 1025, 415)
        precondition(afterWake.state.days[today]?.activeSeconds == 0)
        precondition(afterWake.state.days[today]?.lastUse == nil)
        precondition(afterWake.due(at: date(22, 9, 0, 15)) == nil)
        afterWake.cut(at: 1610)
        sample(afterWake, date(22, 9, 10), 1610, 0)
        precondition(!afterWake.isUsingComputer)
        sample(afterWake, date(22, 9, 10, 15), 1625, 5)
        precondition(afterWake.state.days[today]?.firstUse == date(22, 9, 10, 10))
        precondition(afterWake.due(at: date(22, 9, 10, 15), focusing: true) == nil)
        precondition(afterWake.due(at: date(22, 9, 10, 15), recording: true) == nil)
        precondition(afterWake.due(at: date(22, 9, 10, 15), petVisible: false) == nil)
        let offer = afterWake.due(at: date(22, 9, 10, 15))!
        precondition(!afterWake.recordDelivery(offer, save: { _ in false }))
        precondition(afterWake.deliveredToday(at: date(22, 9, 10, 15)) == nil)
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent("CatLetterChecks-\(UUID())")
        defer { try? FileManager.default.removeItem(at: folder) }
        let storage = CatLetterStorage(file: folder.appendingPathComponent("days.json"))
        precondition(afterWake.recordDelivery(offer, save: storage.save))
        let restarted = CatLetterDiary(state: storage.load(), calendar: calendar)
        restarted.cut(at: 10)
        sample(restarted, date(22, 9, 12), 15, 1)
        precondition(restarted.due(at: date(22, 9, 12)) == nil)
        precondition(restarted.deliveredToday(at: date(22, 9, 12)) == offer)
        precondition(restarted.deliveredToday(at: date(23, 9, 12)) == nil)

        let idle = CatLetterDiary(calendar: calendar)
        idle.cut(at: 100)
        let start = date(22, 10, 0)
        for seconds in stride(from: 0, through: 330, by: 15) {
            let delta = Double(seconds)
            sample(idle, start.addingTimeInterval(delta), 105 + delta, delta)
        }
        precondition(!idle.isUsingComputer)
        precondition(idle.state.days[today]?.runningSeconds == 330)
        precondition(idle.state.days[today]?.activeSeconds == 300)
        precondition(idle.state.days[today]?.lastUse == start)
        sample(idle, start.addingTimeInterval(345), 450, .infinity, eligible: false)
        sample(idle, start.addingTimeInterval(360), 465, .infinity, eligible: false)
        precondition(idle.state.days[today]?.runningSeconds == 360)
        precondition(idle.state.days[today]?.activeSeconds == 300)
        precondition(idle.state.days[today]?.lastUse == start)
        sample(idle, start.addingTimeInterval(7200), 480, 1)
        sample(idle, start, 495, 20)
        precondition(idle.state.days[today]?.runningSeconds == 360)
        precondition(idle.state.days[today]?.lastUse == start)
        let presetNames = ["橘猫", "黑猫"]
        let unnamed = CatLetterSender(profileName: "橘猫", explicitlyNamed: nil, presetNames: presetNames)
        precondition(unnamed.title == "小猫来信" && unnamed.signature == "你的小猫")
        let renamed = CatLetterSender(profileName: " 团子 ", explicitlyNamed: nil, presetNames: presetNames)
        precondition(renamed.title == "团子来信" && renamed.signature == "你的团子")
        let deliberateBreedName = CatLetterSender(profileName: "橘猫", explicitlyNamed: true, presetNames: presetNames)
        precondition(deliberateBreedName.name == "橘猫")
        precondition(CatLetterSender(profileName: "  ", explicitlyNamed: true, presetNames: presetNames).name == "小猫")
        precondition(CatLetterSender(profileName: "黑猫", explicitlyNamed: false, presetNames: presetNames).name == "小猫")
        print("PASS cat letter sender uses applied profile names, distinguishes presets, and falls back when unnamed")
        try checkTemplateContexts(calendar: calendar)
        print("PASS letter thresholds, midnight, idle/lock, wake, focus/recording/hidden gates, atomic restart and wall-clock jumps")
    }

    static func checkTemplateContexts(calendar: Calendar) throws {
        func at(_ day: Int, _ hour: Int, _ minute: Int = 0) -> Date {
            calendar.date(from: DateComponents(year: 2026, month: 11, day: day, hour: hour, minute: minute))!
        }
        let previousReceipt = CatLetterReceipt(day: "2026-11-13", reason: .late)
        let baseline = CatLetterDay(runningSeconds: 36_000, activeSeconds: 29_000, lateSeconds: 900,
                                    typingSeconds: 600, keystrokes: 500)
        let history = Dictionary(uniqueKeysWithValues: (17...20).map { ("2026-11-" + String($0), baseline) })
        let yesterday = at(21, 0)
        let earliest = at(22, 7, 30)
        let morning = at(22, 9)
        let night = at(22, 21)
        var covered = Set<CatLetterTemplate>()
        func candidates(_ day: CatLetterDay, _ reason: CatLetterReason, now: Date? = nil,
                        first: Date? = nil, typing: Bool = false) -> Set<CatLetterTemplate> {
            var days = history
            days["2026-11-22"] = CatLetterDay(firstUse: first ?? now ?? night)
            let diary = CatLetterDiary(state: CatLetterState(days: days, receipt: previousReceipt), calendar: calendar)
            let result = Set(diary.matchingTemplates(reason: reason, yesterday: yesterday, day: day,
                                                     now: now ?? night, earliest: earliest, typingEnabled: typing))
            covered.formUnion(result)
            return result
        }

        let late = CatLetterDay(lastUse: at(21, 23, 35), activeSeconds: 3000, lateSeconds: 900)
        precondition(candidates(late, .late) == [.bookmark, .moon, .nightHug])
        precondition(candidates(late, .late, now: morning).contains(.closeDay))
        let earlierEvening = CatLetterDay(lastUse: at(21, 23, 29), activeSeconds: 3000, lateSeconds: 900)
        precondition(!candidates(earlierEvening, .late).contains(.moon))
        let long = CatLetterDay(activeSeconds: 36_000, typingSeconds: 1_200, keystrokes: 1_000)
        precondition(candidates(long, .long) == [.tail, .sun, .deskCompanion])
        precondition(candidates(long, .long, typing: true) == [.tail, .sun, .deskCompanion, .fingers, .rain, .space, .paws])
        let keysOnly = CatLetterDay(activeSeconds: 28_800, typingSeconds: 600, keystrokes: 1_000)
        precondition(candidates(keysOnly, .long, typing: true) == [.tail, .deskCompanion, .rain])
        let timeOnly = CatLetterDay(activeSeconds: 28_800, typingSeconds: 1_200, keystrokes: 500)
        precondition(candidates(timeOnly, .long, typing: true) == [.tail, .deskCompanion, .fingers, .paws])
        precondition(candidates(CatLetterDay(activeSeconds: 28_800, lateSeconds: 900), .both)
            == [.chair, .nightHug, .deskCompanion])

        let quiet = CatLetterDay(runningSeconds: 28_800, lastUse: at(21, 17), lastEligibleSample: at(21, 22, 30),
                                 activeSeconds: 14_400)
        precondition(candidates(quiet, .ordinary) == [.windowSeat, .sunset, .tailChase, .ordinaryDay, .desk, .note])
        let shortObservation = CatLetterDay(runningSeconds: 7_200, lastUse: at(21, 17), activeSeconds: 1_200)
        precondition(candidates(shortObservation, .ordinary) == [.ordinaryDay, .desk, .note])
        precondition(candidates(shortObservation, .ordinary, now: morning).contains(.whiskers))
        precondition(candidates(late, .late, now: earliest, first: at(22, 7, 20)).contains(.early))
        precondition(!candidates(late, .late, now: morning, first: at(22, 7, 20)).contains(.early))
        precondition(candidates(late, .late, now: morning).contains(.morning))
        precondition(candidates(late, .late, now: at(22, 14)).contains(.afternoon))
        precondition(!candidates(late, .late, now: at(22, 14), first: morning).contains(.afternoon))
        precondition(!candidates(late, .late, now: at(22, 18)).contains(.afternoon))

        func seeded(_ yesterday: CatLetterDay, receipt: CatLetterReceipt? = nil, ordinaryDay: String? = nil) -> CatLetterDiary {
            var days = history
            days["2026-11-21"] = yesterday
            let diary = CatLetterDiary(state: CatLetterState(days: days, receipt: receipt, lastOrdinaryDay: ordinaryDay),
                                       calendar: calendar)
            diary.cut(at: 100)
            diary.capture(.init(date: morning, uptime: 110, eligible: true, idle: 1))
            return diary
        }
        let tooLittle = CatLetterDay(runningSeconds: 7_200, activeSeconds: 1_199)
        precondition(seeded(tooLittle).due(at: morning) == nil)
        precondition(seeded(shortObservation, ordinaryDay: "2026-11-16").due(at: morning) == nil)
        precondition(seeded(shortObservation, receipt: previousReceipt, ordinaryDay: "2026-11-15").due(at: morning)?.reason == .ordinary)
        precondition(seeded(late, ordinaryDay: "2026-11-21").due(at: morning)?.reason == .late)
        let first = seeded(shortObservation)
        let greeting = first.due(at: morning)!
        precondition(greeting.template == .firstLetter)
        covered.insert(greeting.template!)
        precondition(first.recordDelivery(greeting, save: { $0.lastOrdinaryDay == greeting.day }))
        precondition(!first.recordDelivery(greeting, save: { _ in true }))

        let held = seeded(late)
        precondition(held.due(at: morning, recording: true) == nil)
        let waited = held.due(at: morning.addingTimeInterval(30))!
        precondition(waited.template == .heldLetter)
        covered.insert(waited.template!)
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent("CatLetterTemplateChecks-\(UUID())")
        defer { try? FileManager.default.removeItem(at: folder) }
        let storage = CatLetterStorage(file: folder.appendingPathComponent("days.json"))
        precondition(held.recordDelivery(waited, save: storage.save))
        precondition(CatLetterDiary(state: storage.load(), calendar: calendar).deliveredToday(at: morning)?.template == .heldLetter)

        let legacyJSON = Data(#"{"days":{},"receipt":{"day":"2026-11-13","reason":"late"}}"#.utf8)
        let legacy = try JSONDecoder().decode(CatLetterState.self, from: legacyJSON)
        precondition(legacy.receipt?.template == nil && legacy.receipt?.message == CatLetterReason.late.legacyMessage)
        precondition(covered == Set(CatLetterTemplate.allCases))
        print("PASS 24 contextual templates, ordinary cadence, exact receipt persistence, and legacy receipt decoding")
    }
}
