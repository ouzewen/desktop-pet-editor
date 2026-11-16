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

struct FocusCard: View {
    /// The card's fixed width, also used to keep it clear of the screen edge.
    static let width: CGFloat = 252

    @ObservedObject var model: FocusModel

    var onTogglePause: () -> Void = {}
    var onStop: () -> Void = {}
    var onStartBreak: () -> Void = {}
    var onStartFocus: () -> Void = {}
    var onSkipBreak: () -> Void = {}
    var onDismiss: () -> Void = {}
    var onHideCard: () -> Void = {}
    var onTogglePin: () -> Void = {}
    var onHeightChange: (CGFloat) -> Void = { _ in }

    @Environment(\.colorScheme) private var colorScheme

    private var palette: PixelPalette { .of(colorScheme) }

    private var title: String {
        switch model.result {
        case .focusFinished: return "专注完成"
        case .breakFinished: return "休息结束"
        case nil:
            if model.paused { return "已暂停" }
            return model.phase == .resting ? "休息中" : "专注中"
        }
    }

    private var detail: String {
        switch model.result {
        case .focusFinished:
            return "起来走两步，看看远处，喝口水。"
        case .breakFinished:
            return "准备好了就开始下一段专注。"
        case nil:
            if model.paused { return "倒计时停住了，点「继续」接着走。" }
            return model.phase == .resting
                ? "离开屏幕，活动一下肩颈。"
                : "到点会提醒你休息，不用一直看时间。"
        }
    }

    private var glyph: PixelIconKind {
        switch model.result {
        case .focusFinished: return .check
        case .breakFinished: return .bell
        case nil: return model.phase == .resting ? .eye : .paw
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 6) {
                PixelGlyph(kind: glyph, color: palette.accent, size: 12)
                Text(title)
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
                Spacer(minLength: 6)
                if model.isActive || model.pinned {
                    Button(action: onTogglePin) {
                        PixelGlyph(
                            kind: .pin,
                            color: model.pinned ? palette.accent : palette.inkSoft,
                            size: 12
                        )
                        .frame(width: 17, height: 15)
                        .background {
                            if model.pinned {
                                PixelBox(corner: 1).fill(palette.panelDeep)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help(model.pinned ? "已钉住，点击恢复拖动" : "钉住：猫和卡片固定在当前位置")
                    .accessibilityLabel(model.pinned ? "取消钉住" : "钉住")
                }
                Button(action: model.isActive ? onHideCard : onDismiss) {
                    PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                        .frame(width: 15, height: 15)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help(model.isActive ? "收起卡片，计时继续" : "关闭")
            }

            if model.isActive {
                Text(model.clockText)
                    .font(PixelFont.font(36))
                    .foregroundStyle(palette.ink)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 1)
                    .accessibilityLabel("剩余 \(model.clockText)")
            }

            Text(detail)
                .font(PixelFont.font(11))
                .foregroundStyle(palette.inkSoft)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)

            actions
        }
        .padding(10)
        .frame(width: Self.width, alignment: .leading)
        .background(PixelBox(corner: 3).fill(palette.panel))
        .overlay(PixelBox(corner: 3).stroke(palette.border, lineWidth: 3))
        .overlay(PixelBox(corner: 1, inset: 4).stroke(palette.borderSoft.opacity(0.55), lineWidth: 1))
        .background(
            GeometryReader { proxy in
                Color.clear
                    .onAppear { onHeightChange(proxy.size.height) }
                    .onChange(of: proxy.size.height) { onHeightChange($0) }
            }
        )
    }

    @ViewBuilder
    private var actions: some View {
        HStack(spacing: 6) {
            switch model.result {
            case .focusFinished:
                Button("休息 \(model.breakMinutes) 分钟", action: onStartBreak)
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                Button("再来一段", action: onStartFocus)
                    .buttonStyle(PixelButtonStyle(palette: palette))
            case .breakFinished:
                Button("继续专注", action: onStartFocus)
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
            case nil:
                if model.phase == .resting {
                    Button("结束休息", action: onSkipBreak)
                        .buttonStyle(PixelButtonStyle(palette: palette))
                } else {
                    Button(model.paused ? "继续" : "暂停", action: onTogglePause)
                        .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                    Button("结束", action: onStop)
                        .buttonStyle(PixelButtonStyle(palette: palette))
                }
            }
            Spacer(minLength: 0)
        }
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
}

struct FocusMinutesCard: View {
    @ObservedObject var model: FocusMinutesModel

    var onStart: () -> Void = {}
    var onCancel: () -> Void = {}

    @Environment(\.colorScheme) private var colorScheme
    @FocusState private var focused: Bool

    private var palette: PixelPalette { .of(colorScheme) }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 5) {
                PixelGlyph(kind: .bell, color: palette.accent, size: 12)
                Text("专注时长")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)
                Spacer(minLength: 6)
                Button(action: onCancel) {
                    PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                        .frame(width: 15, height: 15)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help("取消")
            }

            HStack(spacing: 6) {
                TextField("分钟", text: $model.text)
                    .textFieldStyle(.plain)
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.ink)
                    .focused($focused)
                    .onSubmit(onStart)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(PixelBox(corner: 1).fill(palette.panelDeep))

                Text("分钟")
                    .font(PixelFont.font(12))
                    .foregroundStyle(palette.inkSoft)

                Spacer(minLength: 4)

                Button("开始", action: onStart)
                    .buttonStyle(PixelButtonStyle(palette: palette, prominent: true))
                    .disabled(model.value == nil)
                    .opacity(model.value == nil ? 0.5 : 1)
            }

            Text("1–180 分钟。回车开始，Esc 取消。")
                .font(PixelFont.font(11))
                .foregroundStyle(palette.inkSoft)
        }
        .padding(10)
        .frame(width: 252, alignment: .leading)
        .background(PixelBox(corner: 3).fill(palette.panel))
        .overlay(PixelBox(corner: 3).stroke(palette.border, lineWidth: 3))
        .overlay(PixelBox(corner: 1, inset: 4).stroke(palette.borderSoft.opacity(0.55), lineWidth: 1))
        .onAppear {
            DispatchQueue.main.async { focused = true }
        }
        .onExitCommand(perform: onCancel)
    }
}
