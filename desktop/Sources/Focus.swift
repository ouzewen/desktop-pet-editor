import AppKit
import SwiftUI

// MARK: - Session

enum FocusPhase {
    case idle, focusing, resting
}

enum FocusResult {
    case focusFinished, breakFinished
}

/// One focus/break cycle. The model owns the countdown so the card, the pet
/// menu and the self-test all read the same state.
final class FocusModel: ObservableObject {
    static let presets = [25, 45, 60]
    static let minuteRange = 1...180

    @Published private(set) var phase: FocusPhase = .idle
    @Published private(set) var remaining: Int = 0
    @Published private(set) var paused = false
    @Published private(set) var result: FocusResult?
    @Published private(set) var focusMinutes: Int = 45
    @Published private(set) var cardHidden = false
    @Published private(set) var pinned = false
    let breakMinutes = 5

    /// Called when the session changes shape (phase, result, pause). Countdown
    /// ticks publish `remaining` instead.
    var onChange: (() -> Void)?

    private(set) var sessionID = UUID()
    private var timer: Timer?
    private var lastTickAt: Date?
    /// False under `--self-test`, where the test drives the countdown itself.
    private let automaticTimer: Bool

    init(automaticTimer: Bool = true) {
        self.automaticTimer = automaticTimer
        let saved = UserDefaults.standard.integer(forKey: "shibaFocusMinutes")
        focusMinutes = FocusModel.minuteRange.contains(saved) ? saved : 45
    }

    var isActive: Bool { phase != .idle }

    var showsCard: Bool { (phase != .idle || result != nil) && !cardHidden }

    var clockText: String {
        String(format: "%02d:%02d", remaining / 60, remaining % 60)
    }

    /// Any length the user asks for; the model only guards the sane bounds the
    /// menu and the input card both validate against.
    func setFocusMinutes(_ minutes: Int) {
        let clamped = min(max(minutes, FocusModel.minuteRange.lowerBound), FocusModel.minuteRange.upperBound)
        focusMinutes = clamped
        UserDefaults.standard.set(clamped, forKey: "shibaFocusMinutes")
    }

    func startFocus(minutes: Int? = nil) {
        if let minutes { setFocusMinutes(minutes) }
        stopTimer()
        sessionID = UUID()
        phase = .focusing
        paused = false
        result = nil
        pinned = false
        cardHidden = false
        remaining = focusMinutes * 60
        startTimer()
        onChange?()
    }

    /// Pins the pet and its card in place: dragging no longer moves either.
    func togglePin() {
        guard phase != .idle || result != nil else { return }
        pinned.toggle()
        onChange?()
    }

    func togglePause() {
        guard phase != .idle else { return }
        paused.toggle()
        onChange?()
    }

    func extend(minutes: Int = 5) {
        guard phase == .focusing else { return }
        remaining += minutes * 60
    }

    func editRemaining(seconds: Int, initial: Int, session: UUID) {
        guard phase == .focusing, sessionID == session,
              (1...max(Self.minuteRange.upperBound * 60, initial)).contains(seconds),
              seconds != initial else { return }
        remaining = seconds
    }

    func stop() {
        guard phase != .idle else { return }
        stopTimer()
        pinned = false
        phase = .idle
        paused = false
        result = nil
        cardHidden = false
        remaining = 0
        onChange?()
    }

    /// Starts the break that follows a finished focus session.
    func startBreak() {
        stopTimer()
        phase = .resting
        paused = false
        result = nil
        cardHidden = false
        remaining = breakMinutes * 60
        startTimer()
        onChange?()
    }

    func skipBreak() {
        guard phase == .resting else { return }
        stopTimer()
        pinned = false
        phase = .idle
        paused = false
        remaining = 0
        result = nil
        cardHidden = false
        onChange?()
    }

    func unpin() {
        guard pinned else { return }
        pinned = false
        onChange?()
    }

    /// Hides the card without touching the running session; the countdown keeps
    /// going and the card comes back when the phase changes.
    func hideCard() {
        guard isActive, !cardHidden else { return }
        pinned = false
        cardHidden = true
        onChange?()
    }

    /// Brings a hidden countdown card back.
    func revealCard() {
        guard cardHidden else { return }
        cardHidden = false
        onChange?()
    }

    /// Acknowledges a finished phase so its card closes.
    func dismiss() {
        guard result != nil else { return }
        pinned = false
        result = nil
        onChange?()
    }

    /// Advances the countdown. Exposed with a step so `--self-test` can run a
    /// whole session without waiting.
    func tick(seconds: Int = 1) {
        guard phase != .idle, !paused else { return }
        remaining = max(0, remaining - max(1, seconds))
        guard remaining == 0 else { return }
        stopTimer()
        paused = false
        cardHidden = false
        if phase == .focusing {
            phase = .idle
            result = .focusFinished
        } else {
            phase = .idle
            result = .breakFinished
        }
        onChange?()
    }

    private func startTimer() {
        guard automaticTimer, timer == nil else { return }
        lastTickAt = Date()
        // Common mode keeps counting while a menu is open. The tick measures the
        // wall time since the previous fire, so a delayed tick (sleep, load) still
        // removes the seconds that really passed instead of one per callback.
        let next = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            self?.timerFired()
        }
        RunLoop.main.add(next, forMode: .common)
        timer = next
    }

    private func timerFired() {
        let now = Date()
        let elapsed = max(1, Int(now.timeIntervalSince(lastTickAt ?? now).rounded()))
        lastTickAt = now
        tick(seconds: elapsed)
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
        lastTickAt = nil
    }
}

// MARK: - Card

enum PetUserAddress {
    static let defaultsKey = "petUserAddress"

    static func normalized(_ address: String) -> String {
        address.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func focusFinishedMessage(address: String) -> String {
        let message = "起来走两步，看看远处，喝口水。"
        return address.isEmpty ? message : "\(address)，\(message)"
    }
}

struct FocusCard: View {
    static let timerSize = CGSize(width: 120, height: 40)
    static let resultWidth: CGFloat = 252

    @ObservedObject var model: FocusModel
    @AppStorage(PetUserAddress.defaultsKey) private var userAddress = ""
    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand

    var onEditRemaining: () -> Void = {}
    var onTogglePause: () -> Void = {}
    var onStop: () -> Void = {}
    var onStartBreak: () -> Void = {}
    var onStartFocus: () -> Void = {}
    var onSkipBreak: () -> Void = {}
    var onDismiss: () -> Void = {}
    var onHideCard: () -> Void = {}
    var onTogglePin: () -> Void = {}
    var onSizeChange: (CGSize) -> Void = { _ in }

    private enum TimerControl: Hashable { case edit, time, stop }
    @State private var timerHovered = false
    @FocusState private var timerFocus: TimerControl?
    private var showsTimerControls: Bool { timerHovered || timerFocus != nil }

    private var palette: PixelPalette { theme.windowPalette }
    private var focusFinished: Bool { model.result == .focusFinished }
    private var timerStatus: String {
        if model.paused { return "已暂停" }
        return model.phase == .resting ? "休息中" : "专注中"
    }

    var body: some View {
        Group {
            if model.isActive { timer }
            else { resultCard }
        }
        .fixedSize()
        .workbenchCompanionStyle(theme)
        .background {
            GeometryReader { proxy in
                Color.clear
                    .onAppear { onSizeChange(proxy.size) }
                    .onChange(of: proxy.size) { onSizeChange($0) }
            }
        }
    }

    private var timer: some View {
        ZStack {
            timerMenu

            // Draw outside AppKit's menu label to keep the theme color and
            // the same centered layout with or without the side controls.
            Text(verbatim: model.clockText)
                .font(WorkbenchTypography.pageTitle.monospacedDigit())
                .foregroundStyle(palette.inkSoft)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
                .frame(maxWidth: Self.timerSize.width - 46)
                .allowsHitTesting(false)
                .accessibilityHidden(true)

            if model.phase == .focusing {
                HStack(spacing: 0) {
                    timerTool(.edit, glyph: .pencil, label: "编辑剩余时间", action: onEditRemaining)
                    Spacer(minLength: 0)
                    timerTool(.stop, glyph: .trash, label: "结束本轮专注", action: onStop)
                }
                .padding(.horizontal, 1)
                .opacity(showsTimerControls ? 1 : 0)
                .allowsHitTesting(showsTimerControls)
                .accessibilityHidden(!showsTimerControls)
            }
        }
        .frame(width: Self.timerSize.width, height: Self.timerSize.height)
        .background(WorkbenchPixelSurface(palette: palette, fill: palette.panel, corner: 4))
        .onHover { timerHovered = $0 }
    }

    private var timerMenu: some View {
        Menu {
            if model.phase == .focusing {
                Button("编辑剩余时间", action: onEditRemaining)
                Button(model.paused ? "继续专注" : "暂停专注", action: onTogglePause)
                Button("结束专注", action: onStop)
            } else {
                Button("结束休息", action: onSkipBreak)
            }
            Divider()
            Button(model.pinned ? "取消钉住" : "钉住", action: onTogglePin)
            Button("收起计时", action: onHideCard)
        } label: {
            Color.clear
                .frame(width: Self.timerSize.width, height: Self.timerSize.height)
                .contentShape(Rectangle())
        }
        .menuStyle(.borderlessButton)
        .menuIndicator(.hidden)
        .buttonStyle(.plain)
        .focused($timerFocus, equals: .time)
        .accessibilityLabel("\(timerStatus)，剩余 \(model.clockText)")
        .accessibilityHint("打开计时操作")
        .accessibilityIdentifier("focus-timer")
    }

    private func timerTool(_ control: TimerControl, glyph: PixelIconKind, label: String,
                           action: @escaping () -> Void) -> some View {
        Button(action: action) {
            PixelGlyph(kind: glyph, color: palette.inkSoft, size: 12)
                .frame(width: 22, height: 32)
        }
        .buttonStyle(WorkbenchButtonStyle(palette: palette, card: true, keyboardFocused: timerFocus == control))
        .focused($timerFocus, equals: control)
        .help(label)
        .accessibilityLabel(label)
        .accessibilityIdentifier(control == .edit ? "focus-edit-remaining" : "focus-end-current")
    }

    private var resultCard: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                WorkbenchCardHeading(title: focusFinished ? "专注完成" : "休息结束",
                                     glyph: focusFinished ? .check : .bell, palette: palette) {
                    if model.pinned {
                        Button(action: onTogglePin) {
                            PixelGlyph(kind: .pin, color: palette.accentDeep, size: 12)
                        }
                        .workbenchButton(palette: palette, selected: true)
                        .help("已钉住，点击恢复拖动")
                        .accessibilityLabel("取消钉住")
                    }
                    Button(action: onDismiss) {
                        PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                            .frame(width: 12, height: 12)
                    }
                    .workbenchButton(palette: palette)
                    .accessibilityLabel("关闭")
                }

                Text(verbatim: focusFinished ? PetUserAddress.focusFinishedMessage(address: userAddress)
                     : "准备好了就开始下一段专注。")
                    .font(.system(size: 12))
                    .foregroundStyle(palette.inkSoft)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: 6) {
                    if focusFinished {
                        Button("休息 \(model.breakMinutes) 分钟", action: onStartBreak)
                            .workbenchButton(palette: palette, prominent: true)
                        Button("再来一段", action: onStartFocus)
                            .workbenchButton(palette: palette)
                    } else {
                        Button("继续专注", action: onStartFocus)
                            .workbenchButton(palette: palette, prominent: true)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(width: Self.resultWidth)
    }
}

// MARK: - Custom duration

final class FocusMinutesModel: ObservableObject {
    @Published var text = "45"

    /// Nil while the field does not hold a whole number inside the allowed range.
    var value: Int? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let minutes = Int(trimmed), FocusModel.minuteRange.contains(minutes) else { return nil }
        return minutes
    }

    func remainingSeconds(upTo maximum: Int) -> Int? {
        let parts = text.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: ":", omittingEmptySubsequences: false)
        guard parts.count == 2, let minutes = Int(parts[0]), let seconds = Int(parts[1]),
              (0...maximum / 60).contains(minutes), (0...59).contains(seconds) else { return nil }
        let total = minutes * 60 + seconds
        return (1...maximum).contains(total) ? total : nil
    }
}

struct FocusMinutesCard: View {
    @ObservedObject var model: FocusMinutesModel
    var maximumRemaining: Int?

    var onStart: () -> Void = {}
    var onCancel: () -> Void = {}

    @AppStorage("workbenchTheme") private var theme = WorkbenchTheme.sand
    @FocusState private var focused: Bool

    private var palette: PixelPalette { theme.windowPalette }
    private var editing: Bool { maximumRemaining != nil }
    private var valid: Bool {
        if let maximumRemaining { return model.remainingSeconds(upTo: maximumRemaining) != nil }
        return model.value != nil
    }

    var body: some View {
        PixelPanel(palette: palette, padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                WorkbenchCardHeading(title: editing ? "编辑剩余时间" : "专注时长", glyph: .timer, palette: palette) {
                    Button(action: onCancel) {
                        PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                            .frame(width: 12, height: 12)
                    }
                    .workbenchButton(palette: palette)
                    .accessibilityLabel("取消")
                    .help("取消")
                }

                HStack(spacing: 8) {
                    PixelTextField(text: $model.text, placeholder: editing ? "分:秒" : "分钟", palette: palette)
                        .focused($focused)
                        .onSubmit(onStart)
                        .accessibilityLabel(editing ? "本轮剩余时间" : "专注分钟数")
                        .accessibilityIdentifier("focus-minutes-field")
                    Text(editing ? "分:秒" : "分钟")
                        .font(.system(size: 12))
                        .foregroundStyle(palette.inkSoft)
                    Spacer(minLength: 8)
                    Button(editing ? "保存" : "开始", action: onStart)
                        .workbenchButton(palette: palette, prominent: true)
                        .disabled(!valid)
                }

                Text(editing ? "只修改本轮。回车保存，Esc 取消。" : "1–180 分钟。回车开始，Esc 取消。")
                    .font(.system(size: 11))
                    .foregroundStyle(palette.inkSoft)
            }
        }
        .frame(width: FocusCard.resultWidth)
        .workbenchCompanionStyle(theme)
        .onAppear {
            DispatchQueue.main.async { focused = true }
        }
        .onExitCommand(perform: onCancel)
    }
}
