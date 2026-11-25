import SwiftUI

struct WorkbenchGuideSheet: View {
    private enum Topic: String, CaseIterable {
        case start = "快速上手"
        case appearance = "外观与动作"
        case recording = "会议录音"
        case productivity = "办公工具"
        case files = "文件操作"
        case updates = "更新与反馈"

        var instructions: [(title: String, body: String)] {
            switch self {
            case .start:
                return [
                    ("打开工作台", "点击菜单栏的「\(PetBrand.name)」图标，或右键小猫，选择「打开工作台」。"),
                    ("移动小猫", "按住小猫拖动到合适的位置。鼠标停在小猫身上时，快捷按钮会出现。"),
                    ("隐藏和归位", "在工作台底部可调整桌宠大小，也可在「桌面设置」中开关「显示桌宠」。找不到小猫时，点击「归位」即可把它移回屏幕。"),
                ]
            case .appearance:
                return [
                    ("换个外观", "在右侧「外观」面板先选品种，再调整毛色与花纹、头部、尾巴和配饰。配饰先到顶栏「商店」获取，再回「配饰」佩戴。左侧会即时预览，满意后点击「应用到桌宠」。"),
                    ("预览动作", "用小猫下方的按钮切换待机、不同速度的敲键盘和听音乐。桌面小猫跟随真实按键时，需要开启「打字动画」。点击预览旁的「导出 PNG」可保存当前一帧，背景保持透明。"),
                    ("保存自己的形象", "展开「自定义外观」，可用像素画笔微调。完成后可「存为形象」方便下次使用，也可以「导出 PNG」。"),
                ]
            case .recording:
                return [
                    ("选好音源", "进入「会议录音」，勾选「系统声音」录下电脑播放的声音，或勾选「麦克风」录下现场声音。两项可同时开启，转写语言也在这里选择。"),
                    ("开始和结束录音", "在工作台点击「开始录音」和「结束录音」。录音中会显示计时，小猫右上角会亮起红点。"),
                    ("查阅文稿和音频", "结束后由 macOS 自动转写，纪要从逐字稿提取重点、决定和待办。左侧按日期选择记录，右侧切换「会议纪要」和「逐字稿」，可一键复制。用「更多」在 Finder 中查看原音频。录音和转写期间也能查阅旧记录。"),
                    ("首次使用", "按系统提示授权所选音源。首次转写可能需要下载语言模型，录音与文稿保存在本机。"),
                ]
            case .productivity:
                return [
                    ("专注、待办提醒和剪贴板", "悬停在小猫身上可打开「待办」「剪贴板」和「专注」。待办右侧可勾选完成，点击文字可编辑。展开「今日已完成」可恢复当天的条目。剪贴板展示最近复制的文字，退出 App 后清空。"),
                    ("打字动画与统计", "在工作台底部的「桌面设置」中可分别开启「打字动画」和「本地打字统计」，并按提示授予输入监控权限。展开「今日打字统计」可查看今日活跃时长和按键次数。收起后仍会按本地统计开关记录。"),
                    ("划词翻译", "在底部开启「划词翻译」并授权辅助功能后，选中英文，点击出现的「翻译」。此功能需要 macOS 15 或更新版本。"),
                ]
            case .files:
                return [
                    ("处理单个文件", "把一个文件拖到小猫身上，松手后选「压缩」「转格式」或「删除」。支持的转换格式以菜单为准，删除会把文件移到废纸篓。"),
                ]
            case .updates:
                return [
                    ("检查更新", "在工作台右上角点击「检查更新」。发现新版后，先保存手头的编辑，再点击「安装并重启」。"),
                    ("提交反馈", "在工作台左上角选择「帮助 → 意见反馈」，选择问题类别并描述遇到的情况。反馈会附上 App 版本，便于定位问题。"),
                ]
            }
        }
    }

    let palette: PixelPalette
    let recordingAvailable: Bool
    @Environment(\.dismiss) private var dismiss
    @State private var topic: Topic

    init(palette: PixelPalette, recordingAvailable: Bool, opensOnRecording: Bool) {
        self.palette = palette
        self.recordingAvailable = recordingAvailable
        _topic = State(initialValue: opensOnRecording && recordingAvailable ? .recording : .start)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("使用说明")
                        .font(PixelFont.font(20))
                        .foregroundStyle(palette.ink)
                        .accessibilityAddTraits(.isHeader)
                    if let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String {
                        Text("\(PetBrand.name) v\(version)")
                            .font(PixelFont.font(12))
                            .foregroundStyle(palette.inkSoft)
                            .accessibilityIdentifier("workbench-guide-version")
                    }
                }
                Spacer()
                Button("关闭") { dismiss() }
                    .buttonStyle(PixelButtonStyle(palette: palette))
                    .keyboardShortcut(.cancelAction)
                    .accessibilityIdentifier("workbench-guide-close")
            }

            HStack(spacing: 0) {
                VStack(spacing: 5) {
                    ForEach(Topic.allCases.filter { recordingAvailable || $0 != .recording }, id: \.self) { item in
                        topicButton(item)
                    }
                    Spacer(minLength: 0)
                }
                .padding(8)
                .frame(width: 132)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(palette.panelDeep)

                Rectangle()
                    .fill(palette.borderSoft)
                    .frame(width: 1)
                    .accessibilityHidden(true)

                ScrollView {
                    VStack(alignment: .leading, spacing: 15) {
                        Text(topic.rawValue)
                            .font(.system(size: 18, weight: .semibold))
                            .accessibilityAddTraits(.isHeader)
                            .accessibilityIdentifier("workbench-guide-topic")
                        ForEach(topic.instructions, id: \.title) { section in
                            VStack(alignment: .leading, spacing: 5) {
                                Text(section.title)
                                    .font(.system(size: 13, weight: .semibold))
                                    .accessibilityAddTraits(.isHeader)
                                Text(section.body)
                                    .font(.system(size: 13))
                                    .lineSpacing(4)
                                    .textSelection(.enabled)
                            }
                        }
                    }
                    .foregroundStyle(palette.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                }
                .id(topic)
            }
            .background(palette.panelAlt)
            .clipShape(PixelBox(corner: 3))
            .overlay(PixelBox(corner: 3).stroke(palette.borderSoft, lineWidth: 1).allowsHitTesting(false))
        }
        .padding(18)
        .frame(width: 660, height: 460)
        .background(palette.panel)
    }

    private func topicButton(_ item: Topic) -> some View {
        Button { topic = item } label: {
            HStack(spacing: 4) {
                Text(item.rawValue)
                Spacer(minLength: 0)
                if topic == item { PixelGlyph(kind: .arrowRight, color: palette.inkSoft, size: 12) }
            }
            .font(PixelFont.font(12))
            .foregroundStyle(palette.ink)
            .padding(.horizontal, 9)
            .padding(.vertical, 8)
            .background {
                if topic == item {
                    PixelBox(corner: 2).fill(palette.panel)
                        .overlay(PixelBox(corner: 2).stroke(palette.accentDeep, lineWidth: 1))
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(topic == item ? .isSelected : [])
    }
}
