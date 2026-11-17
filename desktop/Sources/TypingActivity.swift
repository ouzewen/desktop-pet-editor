import Combine
import Foundation

struct TypingDayTotals: Equatable {
    var activeSeconds: TimeInterval = 0
    var keyCount = 0
}

final class TypingActivity: ObservableObject {
    @Published private(set) var today = TypingDayTotals()

    private static let maxActiveGap: TimeInterval = 5
    private let defaults: UserDefaults
    private let calendar: Calendar
    private var lastKeyAt: Date?
    private var days: [String: TypingDayTotals] = [:]
    private var dirtyDays: Set<String> = []
    private var pendingFlush: DispatchWorkItem?

    init(defaults: UserDefaults = .standard, calendar: Calendar? = nil, now: Date = Date()) {
        var localCalendar = Calendar(identifier: .gregorian)
        localCalendar.timeZone = .autoupdatingCurrent
        self.defaults = defaults
        self.calendar = calendar ?? localCalendar
        refreshToday(at: now)
    }

    func recordKey(at time: Date = Date()) {
        let day = dayKey(for: time)
        var current = totals(for: day)
        current.keyCount += 1

        if let previous = lastKeyAt {
            let gap = time.timeIntervalSince(previous)
            if gap > 0, gap <= Self.maxActiveGap {
                let midnight = calendar.startOfDay(for: time)
                let start = max(previous, midnight)
                current.activeSeconds += time.timeIntervalSince(start)
                if previous < midnight {
                    let previousDay = dayKey(for: previous)
                    var prior = totals(for: previousDay)
                    prior.activeSeconds += midnight.timeIntervalSince(previous)
                    days[previousDay] = prior
                    dirtyDays.insert(previousDay)
                }
            }
        }

        lastKeyAt = time
        days[day] = current
        dirtyDays.insert(day)
        today = current
        // Batch writes while the user types, with a bounded delay even during a long burst.
        if pendingFlush == nil {
            let task = DispatchWorkItem { [weak self] in self?.flush() }
            pendingFlush = task
            DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: task)
        }
    }

    func refreshToday(at time: Date = Date()) {
        let current = totals(for: dayKey(for: time))
        if today != current { today = current }
    }

    func flush() {
        pendingFlush?.cancel()
        pendingFlush = nil
        for day in dirtyDays {
            guard let totals = days[day] else { continue }
            defaults.set([
                "activeSeconds": totals.activeSeconds,
                "keyCount": totals.keyCount,
            ], forKey: "typingActivity.\(day)")
        }
        dirtyDays.removeAll()
    }

    private func dayKey(for time: Date) -> String {
        let date = calendar.dateComponents([.year, .month, .day], from: time)
        return String(format: "%04d-%02d-%02d", date.year ?? 0, date.month ?? 0, date.day ?? 0)
    }

    private func totals(for day: String) -> TypingDayTotals {
        if let totals = days[day] { return totals }
        let saved = defaults.dictionary(forKey: "typingActivity.\(day)")
        let totals = TypingDayTotals(
            activeSeconds: saved?["activeSeconds"] as? Double ?? 0,
            keyCount: saved?["keyCount"] as? Int ?? 0
        )
        days[day] = totals
        return totals
    }
}
