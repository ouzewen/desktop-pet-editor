# 桌宠工作台

一只像素猫桌面宠物，加一个可以调形象、预览动作、管理提醒的 macOS 工作台。工作台用 SwiftUI 写，宠物画面由 WKWebView 里的 Canvas 分层合成，和 Web 形象编辑器共用同一套渲染代码。

当前默认展示猫；柴犬 M1 的代码、素材和自检仍然保留，只是工作台暂时隐藏了犬类入口。

跨平台约定见 [docs/PORTABILITY.md](docs/PORTABILITY.md)：后续开发按「将来可移植到 Windows」分层，平台能力与业务逻辑分离。

## 快速开始

### macOS 桌宠 App

需要 macOS 13+ 与 Xcode Command Line Tools。

```sh
npm ci
./desktop/build.sh
open build/desktop/桌宠.app
```

自检：

```sh
build/desktop/桌宠.app/Contents/MacOS/DesktopPet --self-test
```

### Web 形象编辑器

需要 Node.js 22.12+ 或 24。

```sh
npm ci
npm run dev
npm run build     # 输出到 build/web/
npm run preview
```

## 功能

- 猫品种：橘猫、黑猫、三花、暹罗；耳朵、嘴鼻、瞳色、面部花纹、毛色和配饰可组合
- 四种猫都可在工作台预览待机、温柔打字和疯狂打字。
- 「像素编辑」从左侧预览载入当前形象。画笔和橡皮擦支持方块与圆点，可调范围为 1–32 像素。编辑器提供 32 个常用色和系统选色器，保存的形象可在「自定义」列表中使用。
- 眼神跟随：瞳孔跟随鼠标，可在工作台底部开关
- 重要提醒：右键小猫添加，提醒以待办列表悬浮在小猫上方；点击输入框外部自动收起
- 专注与微休息：右键「开始专注」可选 25/45/60 分钟，也可自定义 1–180 分钟；猫上方浮层显示倒计时，到点文字提醒休息 5 分钟，可暂停、延长 5 分钟或跳过；卡片上的「钉住」可把猫和卡片固定在当前位置
- 天气提醒：右键「看看天气」随时查看；「天气提醒」里可开启每日提醒（默认 08:30）、选提醒时间或手动指定城市。自动定位优先系统定位，失败回退 IP 定位
- 听歌状态：只识别音乐类 App（QQ音乐、Apple Music、Spotify、网易云音乐、酷狗音乐）是否在出声，播放时在猫旁边显示「听歌中 · App」；视频、通话等其他声音不触发，可在右键菜单关闭
- 剪贴板历史：自动记录最近 15 条复制的文字（仅内存，退出清空；密码管理器的 concealed 内容跳过），右键「剪贴板（N）」打开列表，点一条即复制
- 划词翻译：拖选英文后光标旁出现「翻译」按钮，点击后用 macOS 本地 Translation 框架英文→中文（离线、无 API、无 token），结果显示在猫上方的气泡里并可一键复制中文；超过 500 字只翻前 500 字。首次使用需要在「隐私与安全性 › 辅助功能」里允许桌宠
- 问问桌宠：右键「问问桌宠…」聊天。本地 Qwen2.5-1.5B（Ollama，localhost:11434；需先安装并启动 Ollama，首次使用会自动拉取约 1GB 模型），不调云 API；天气/新闻/股票/今天/最新等关键词先走 Bing 搜索再让模型口语化回答，其余问题直接回答；记住名字、喜好、作息（本地 SQLite，不上传）
- 打字同步：读取全局按键节拍驱动打字动画，需要「输入监控」授权
- 像素风工作台与提醒卡片，支持亮色/夜间两套配色
- 形象编辑器：图层预览、配置调整与 PNG 导出

## 目录结构

```text
.
├── src/                     # TypeScript 渲染器与 Web 编辑器
├── public/assets/           # 运行时素材（Vite public）
│   └── cat/hd/              # 320×320 HD 猫素材
├── desktop/
│   ├── Sources/             # SwiftUI / AppKit 源码
│   ├── Resources/           # pet.html、App 图标、像素字体
│   ├── build.sh             # 构建桌宠 App
│   └── vite.config.ts       # 桌宠 bundle 的 Vite 配置
├── fixtures/                # 柴犬 M1 验收对照图（不参与运行）
├── docs/                    # 素材、版本与历史说明
├── scripts/clean.sh         # 清理构建产物与缓存
├── VERSION                  # 源版本号
└── CHANGELOG.md
```

- 构建产物统一放在 `build/`（已忽略）：`build/web` 是 Web 编辑器，`build/desktop/桌宠.app` 是 App。
- 素材目录、命名约定和新增零件流程见 [docs/ASSETS.md](docs/ASSETS.md)。
- 版本号、构建号与发布流程见 [docs/VERSIONING.md](docs/VERSIONING.md)。

## 素材说明

- 猫的基础层是 160×160；部分 HD 素材（耳、嘴、眼、毛色、打字动作）是 320×320，位于 `public/assets/cat/hd/`，文件名保留 `new_` 前缀以区分代际。
- 换色通过 `*_g/_s/_l/_w/_d` 遮罩完成，瞳色和眼神跟随使用 `*_iris` 遮罩。
- 柴犬 M1 的 160×160 素材仍在 `public/assets/` 根目录下的 `frames/`、`parts/`、`motion/`、`masks/` 中，历史说明见 [docs/SHIBA-NOTES.md](docs/SHIBA-NOTES.md)。

## 版本与签名

- `VERSION` 是源版本号；构建时写入 App 的 `CFBundleShortVersionString`，`CFBundleVersion` 使用 git 提交数。
- 本地构建优先使用 `DESKTOP_PET_SIGN_IDENTITY`，其次使用钥匙串里的 `Desktop Pet Local Signing`；没有签名身份时使用临时签名，重建后可能需要重新授权输入监控。
- 对外分发需要 Developer ID 签名并提交 Apple 公证。

## 许可

- 像素字体 [Ark Pixel Font](https://github.com/TakWolf/ark-pixel-font)，SIL OFL 1.1，许可证见 `desktop/Resources/ArkPixel-OFL.txt`。
- 项目内其余美术素材为项目自绘，仅用于本项目。
