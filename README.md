# 桌宠工作台

一只像素猫桌面宠物，加一个可以调形象、预览动作、管理提醒的 macOS 工作台。工作台用 SwiftUI 写，宠物画面由 WKWebView 里的 Canvas 分层合成，和 Web 形象编辑器共用同一套渲染代码。

当前默认展示猫；柴犬 M1 的代码、素材和自检仍然保留，只是工作台暂时隐藏了犬类入口。

## 快速开始

### macOS 桌宠 App

需要 macOS 13+ 与 Xcode Command Line Tools。

```sh
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

- 猫品种：橘猫、黑猫、三花、暹罗；耳朵、嘴鼻、眼型、瞳色、面部花纹、毛色可组合
- 动作预览：待机、左走、右走、打字；拖动桌宠时按方向走动
- 眼神跟随：瞳孔跟随鼠标，可在工作台底部开关
- 重要提醒：右键小猫添加，提醒以待办列表悬浮在小猫上方；点击输入框外部自动收起
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
