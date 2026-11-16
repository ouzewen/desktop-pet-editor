# 跨平台开发约定

目标：这个应用以 macOS 为先，但**后续所有开发都要按“将来可以移植到 Windows”来写**。这份文档是硬约定，不是建议；新功能不满足这里的规则，就不算写完。

Windows 端的完整评估见文末「Windows 端现状」；给 Codex 的同步摘要见最后一节。

## 三层结构

新代码必须归到三层之一，不允许混写：

| 层 | 放什么 | 现状位置 | 移植成本 |
|---|---|---|---|
| **纯逻辑层** | 状态机、规则、解析、提示词、时间计算、排序、校验 | 目前和平台代码混在 `desktop/Sources/*.swift` | 几乎为零（换语言照抄） |
| **平台能力层** | 窗口、剪贴板、音频、定位、快捷键、文件系统、进程、权限 | 散落在各个功能文件里 | 需要逐项替换实现 |
| **UI 外壳** | 卡片、面板、工作台界面、菜单 | SwiftUI / AppKit | 需要整套重写（Web 技术栈） |

**规则**：业务判断不允许写在 SwiftUI 视图或 AppKit 回调里。视图只做“把状态画出来 + 把用户动作转成调用”。

## 目录与命名约定

- 平台相关代码统一放 `desktop/Sources/Platform/`，按能力命名：`ClipboardPort`、`AudioPort`、`LocationPort`、`SelectionPort`、`HotkeyPort`；
- 纯逻辑放 `desktop/Sources/Core/`，不 import AppKit/SwiftUI（这是硬性检查项）；
- 功能入口放 `desktop/Sources/Features/`，只依赖 Core 的类型 + Platform 的协议；
- 新增能力时先定义协议与数据结构，再写 macOS 实现；Windows 实现将来照协议补齐即可。

目录迁移可以分步做，但**新文件必须按这个约定落位**。

## 新功能必答五问

每个新功能开工前回答，答案写进 PR/提交说明：

1. 这段逻辑离开 macOS 还成立吗？成立的部分抽到 Core。
2. 用到哪些系统能力？列出来，对应到 Platform 协议。
3. Windows 上这个能力存在吗？不存在的话，降级方案是什么（禁用/替换/提示）？
4. UI 卡片能否只依赖数据？（能在 Windows 用 HTML 重画）
5. 有没有把“权限类型”“菜单结构”“窗口行为”写死进业务逻辑？

## 禁止事项

- 业务逻辑里直接调 `NSPasteboard`、`NSWorkspace`、`CGEventTap`、`AX*`、`CoreAudio`、`CLLocationManager`——必须先过 Platform 协议；
- 在 SwiftUI 视图里做网络请求、删文件、读剪贴板；
- 把菜单结构当业务接口（Windows 的托盘菜单与 macOS 不同）；
- 依赖 macOS 专有语义实现核心交互（例如“非激活面板”的行为差异要隔离）；
- 在功能代码里硬编码路径（用统一的 `AppPaths`）。

## 现有功能的分层现状

| 功能 | 逻辑可移植 | 平台依赖 | Windows 风险 |
|---|---|---|---|
| 宠物渲染（走路/打字/换色） | ✅ TS 直接复用 | WebKit → WebView2 | 低 |
| 提醒 / 专注 | ✅ 状态简单 | 无 | 低 |
| 剪贴板历史 | ✅ | NSPasteboard | 低（Win32 剪贴板） |
| 天气 | ✅ 规则可搬 | CoreLocation / IP | 低（Win 定位 API） |
| 聊天 + 本地模型 | ✅ 提示词与路由 | Ollama HTTP（跨平台） | 低 |
| 快捷条悬停 | ✅ 判定逻辑 | 全局鼠标位置 | 低 |
| 垃圾桶 | ✅ | FileManager.trashItem | 低（IFileOperation） |
| 听歌状态 | ⚠️ 白名单可搬 | CoreAudio 进程音频 | 中（SMTC/WASAPI） |
| 打字同步 | ⚠️ | CGEventTap | 中（低级钩子，杀软误报） |
| 划词翻译 | ⚠️ 文本判定可搬 | Accessibility + Translation | **高**（UIA 不稳定、无系统本地翻译） |
| 工作台 | 🔁 | SwiftUI 大量界面 | 高（整套重画） |

## macOS → Windows 能力对照

| macOS | Windows 替代 |
|---|---|
| NSPanel（透明置顶、不抢焦点） | WS_EX_LAYERED + WS_EX_TOOLWINDOW + WS_EX_NOACTIVATE |
| NSStatusItem 菜单栏 | 系统托盘 Shell_NotifyIcon |
| NSPasteboard | Win32 剪贴板 API + AddClipboardFormatListener |
| CoreAudio 进程音频 | WASAPI 会话枚举 / SMTC 媒体会话 |
| CLLocationManager | Windows Geolocation API（需授权） |
| CGEventTap 键盘 | WH_KEYBOARD_LL 低级钩子 |
| Accessibility（AXSelectedText） | UI Automation TextPattern |
| Translation.framework | 本地 Qwen 翻译，或云翻译 API |
| FileManager.trashItem | IFileOperation（回收站） |
| WKWebView | WebView2（Edge） |
| dmg + 公证 | MSI/MSIX + 代码签名证书（SmartScreen） |

## 高风险项的处理原则

- **划词翻译**：Windows 上选区能力不稳定，默认按“可用则启用、不可用则隐藏按钮”处理；不要让它成为核心链路；
- **听歌状态**：先做“能拿到就显示”，拿不到就静默；
- **打字同步**：钩子可能被杀软拦截，必须可失败、可关闭，不能影响主流程；
- **本地翻译**：没有系统级能力，优先复用本地 Qwen（离线、不花 token），不要偷偷接云 API。

## Windows 端范围建议

- **MVP**：宠物 + 聊天（本地模型）+ 提醒 + 剪贴板 + 专注 + 天气（6–8 周）；
- **二期**：听歌、打字、垃圾桶、快捷条；
- **三期**：工作台（形象编辑）、划词翻译（视 UIA 实测情况）。

## 给 Codex 的同步摘要

> 仓库新增硬约定：`docs/PORTABILITY.md`。后续所有开发按“将来要移植 Windows”来写：
> 1) 业务逻辑与平台能力分离，平台相关代码放 `desktop/Sources/Platform/`，纯逻辑放 `Core/`（不 import AppKit/SwiftUI）；
> 2) 不在视图里写网络/文件/剪贴板逻辑；
> 3) 新功能先定义协议，再写 macOS 实现；
> 4) 划词翻译、听歌检测、键盘钩子是 Windows 高风险项，不要把它们嵌进核心链路；
> 5) 提交说明里回答文档中的“新功能必答五问”。
> Windows 端目标顺序：宠物/聊天/提醒/剪贴板/专注/天气 → 听歌/打字/垃圾桶 → 工作台/划词。

## Windows 端现状（评估结论）

- 原生层无法复用：6,700+ 行 Swift（AppKit/SwiftUI）需要在新技术栈（Tauri/Electron + WebView2）下重写；
- 可复用：`src/` 渲染器（1,000+ 行 TS）、宠物素材、Ollama 模型与接口、全部业务规则；
- 完整对齐约 3–4 个月全职；MVP 约 6–8 周；
- 结论：**难在 UI 重写与三项系统能力，不难在 AI 与核心交互**。
