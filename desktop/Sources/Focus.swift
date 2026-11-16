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
    static let durations = [25, 45, 60]

    @Published private(set) var phase: FocusPhase = .idle
    @Published private(set) var remaining: Int = 0
    @Published private(set) var paused = false
    @Published private(set) var result: FocusResult?
    @Published private(set) var focusMinutes: Int = 45
    @Published private(set) var cardHidden = false
    let breakMinutes = 5

    /// Called when the session changes shape (phase, result, pause). Countdown
    /// ticks publish `remaining` instead.
    var onChange: (() -> Void)?

    private var timer: Timer?

    init() {
        let saved = UserDefaults.standard.integer(forKey: "shibaFocusMinutes")
        focusMinutes = FocusModel.durations.contains(saved) ? saved : 45
    }

    var isActive: Bool { phase != .idle }

    var showsCard: Bool { (phase != .idle || result != nil) && !cardHidden }

    var clockText: String {
        String(format: "%02d:%02d", remaining / 60, remaining % 60)
    }

    func setFocusMinutes(_ minutes: Int) {
        guard FocusModel.durations.contains(minutes) else { return }
        focusMinutes = minutes
        UserDefaults.standard.set(minutes, forKey: "shibaFocusMinutes")
    }

    func startFocus(minutes: Int? = nil) {
        if let minutes { setFocusMinutes(minutes) }
        stopTimer()
        phase = .focusing
        paused = false
        result = nil
        cardHidden = false
        remaining = focusMinutes * 60
        startTimer()
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
        phase = .idle
        paused = false
        remaining = 0
        result = nil
        cardHidden = false
        onChange?()
    }

    /// Hides the card without touching the running session; the countdown keeps
    /// going and the card comes back when the phase changes.
    func hideCard() {
        guard isActive, !cardHidden else { return }
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
        guard timer == nil else { return }
        // Common mode keeps counting while a menu is open.
        let next = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(next, forMode: .common)
        timer = next
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}

// MARK: - Card

struct FocusCard: View {
    @ObservedObject var model: FocusModel

    var onTogglePause: () -> Void = {}
    var onExtend: () -> Void = {}
    var onStop: () -> Void = {}
    var onStartBreak: () -> Void = {}
    var onStartFocus: () -> Void = {}
    var onSkipBreak: () -> Void = {}
    var onDismiss: () -> Void = {}
    var onHideCard: () -> Void = {}
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
                if model.isActive {
                    Text(model.clockText)
                        .font(PixelFont.font(12))
                        .foregroundStyle(palette.ink)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 1)
                        .background(PixelBox(corner: 1).fill(palette.panelDeep))
                }
                Button(action: model.isActive ? onHideCard : onDismiss) {
                    PixelGlyph(kind: .close, color: palette.inkSoft, size: 9)
                        .frame(width: 15, height: 15)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help(model.isActive ? "收起卡片，计时继续" : "关闭")
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
        .frame(width: 252, alignment: .leading)
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
                    Button("延长 5 分钟", action: onExtend)
                        .buttonStyle(PixelButtonStyle(palette: palette))
                    Button("结束", action: onStop)
                        .buttonStyle(PixelButtonStyle(palette: palette))
                }
            }
            Spacer(minLength: 0)
        }
    }
}
