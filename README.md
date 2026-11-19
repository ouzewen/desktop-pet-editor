# 桌宠工作台

一只像素猫桌面宠物，加一个可以调形象、预览动作、管理提醒的 macOS 工作台。工作台用 SwiftUI 写，宠物画面由 WKWebView 里的 Canvas 分层合成，和 Web 形象编辑器共用同一套渲染代码。

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

- 橘猫、黑猫、三花猫、暹罗猫、英短蓝猫、美短、狸花猫和布偶猫可以组合耳朵、鼻子、嘴巴、面部花纹、毛皮花纹、毛色和配饰。
- 八种猫都可在工作台预览待机，以及慢敲键盘、比较快、特别快三档打字。
- 打字默认使用 `reference` 动画：每档在 Aseprite 中直接绘制 12 帧低抬爪动作，循环分别为 1000、600、360 ms。比较快保持睁眼并逐渐出汗，特别快叠加挤眼、大汗珠和甩汗；独立动作与表情层支持换装、自定义绘画，真实键频切换档位时保留动作进度。
- 额头花纹独立选择；毛皮花纹同时替换脸部、身体与尾巴的纹路，可与毛色搭配组合。
- 「自定义外观」可上传一张首图和最多两张同猫补图。首图定义画面左右，补图只在能对应到同一只前爪时补齐遮挡的部位，生成后会标出取样图号。照片识别由构建时配置的后端提供，Mac 校验花色并渲染待机和打字预览。斑块和画笔位于「手动微调」。
- 「像素编辑」从左侧预览载入当前形象。画笔和橡皮擦支持方块与圆点，可调范围为 1–32 像素。编辑器提供 32 个常用色和系统选色器，保存的形象可在「自定义」列表中使用。
- 「外观」面板里的「瞳色」提供原色和六种颜色。选色后可在左侧预览，点击「应用到桌宠」保存。
- 眼神跟随由鼠标方向带动眼睛的小高光，可在工作台底部开关。
- 重要提醒：右键小猫添加，提醒以待办列表悬浮在小猫上方；点击输入框外部自动收起
- 专注与微休息：右键「开始专注」可选 25/45/60 分钟，也可自定义 1–180 分钟；猫上方浮层显示倒计时，到点文字提醒休息 5 分钟，可暂停、延长 5 分钟或跳过；卡片上的「钉住」可把猫和卡片固定在当前位置
- 天气提醒：右键「看看天气」随时查看；「天气提醒」里可开启每日提醒（默认 08:30）、选提醒时间或手动指定城市。自动定位优先系统定位，失败回退 IP 定位
- 听歌状态：只识别音乐类 App（QQ音乐、Apple Music、Spotify、网易云音乐、酷狗音乐）是否在出声，播放时在猫旁边显示「听歌中 · App」；视频、通话等其他声音不触发，可在右键菜单关闭
- 剪贴板历史：自动记录最近 15 条复制的文字（仅内存，退出清空；密码管理器的 concealed 内容跳过），右键「剪贴板（N）」打开列表，点一条即复制
- 划词翻译：在工作台底栏开启后申请「辅助功能」权限。拖选英文后可点击「翻译」，使用 macOS 本地 Translation 框架译成中文，最多翻译前 500 字，并可一键复制译文。
- 问问桌宠：右键「问问桌宠…」聊天。本地 Qwen2.5-1.5B（Ollama，localhost:11434；需先安装并启动 Ollama，首次使用会自动拉取约 1GB 模型），不调云 API；天气/新闻/股票/今天/最新等关键词先走 Bing 搜索再让模型口语化回答，其余问题直接回答；记住名字、喜好、作息（本地 SQLite，不上传）
- 打字动画和本地打字统计各有独立开关，主动开启任一项时申请「输入监控」权限。动画根据按键节拍触发，统计只保存时长和次数。
- 文件整理：右键小猫，在「整理文件」中选桌面或一个文件夹。查看原位置和去向后，点击「开始整理」，按修改月份、名称关键词和扩展名分类。移动记录留在本机，可在结果卡片撤销。
- 「显示打字统计」控制工作台预览下方的今日数据。本地打字统计开启时，关闭显示后仍在本机按天记录。活跃时长累计相隔不超过 5 秒的按键间隔。
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
├── docs/                    # 素材、版本与历史说明
├── scripts/clean.sh         # 清理构建产物与缓存
├── VERSION                  # 源版本号
└── CHANGELOG.md
```

- 构建产物统一放在 `build/`（已忽略）：`build/web` 是 Web 编辑器，`build/desktop/桌宠.app` 是 App。
- 内置素材的源稿、导出与运行时路径统一登记在 [src/pet-assets.ts](src/pet-assets.ts)，可用 `npm run assets:list` 查询。猫素材目录与新增零件流程见[猫桌宠素材目录与命名](docs/ASSETS.md)。照片自动生成的外观标准见[猫咪照片生成与花色验收](docs/CAT-COAT-REVIEW.md)。
- 版本号、构建号与发布流程见 [docs/VERSIONING.md](docs/VERSIONING.md)。

## 素材说明

- 猫的基础层是 160×160；部分 HD 素材（耳、嘴、眼、毛色、打字动作）是 320×320，位于 `public/assets/cat/hd/`，文件名保留 `new_` 前缀以区分代际。
- 毛色通过 `*_g/_s/_l/_w/_d` 遮罩实现，瞳色使用 `*_iris` 遮罩。眼神跟随使用独立的小高光图层。
- 当前三档打字使用 `front-v6` 正视动画。各档使用 64 帧循环，动作图层与导出命令见[共用低抬爪打字动画](docs/ASSETS.md#共用低抬爪打字动画)。

## 版本与签名

- `VERSION` 是源版本号；构建时写入 App 的 `CFBundleShortVersionString`，`CFBundleVersion` 使用 git 提交数。
- 本地构建优先使用 `DESKTOP_PET_SIGN_IDENTITY`，其次使用钥匙串里的 `Desktop Pet Local Signing`；没有签名身份时使用临时签名，重建后可能需要重新授权输入监控。
- 对外分发需要 Developer ID 签名并提交 Apple 公证。

## 许可

- 像素字体 [Ark Pixel Font](https://github.com/TakWolf/ark-pixel-font)，SIL OFL 1.1，许可证见 `desktop/Resources/ArkPixel-OFL.txt`。
- 项目内其余美术素材为项目自绘，仅用于本项目。

## 照片识别后端

后端需要 Node.js 22.18 或以上。将北京地域按量付费的百炼 Key 配置为后端进程的 `DASHSCOPE_API_KEY` 环境变量，然后运行 `node server/cat-photo.mjs`。默认监听 `127.0.0.1:8778`，App 的本地开发构建会连这个地址。后端默认调用 `qwen3-vl-plus`。可用 `DASHSCOPE_BASE_URL` 配置北京地域的工作空间端点，或用 `DASHSCOPE_VISION_MODEL` 切换北京地域支持图片和 JSON 对象模式的模型。

对外部署时，将服务放在自己的 HTTPS 网关后接入账户鉴权及用户配额。构建桌宠时通过 `DESKTOP_PET_PHOTO_BACKEND_URL` 传入网关地址。百炼 Key 只配置在后端。每次成功返回包含百炼逐次调用的输入与输出 Token 数，便于按官方价格核算成本。

本机验收可使用已安装的 Ollama 及 `qwen3-vl:2b-instruct`。在 Ollama 已运行的 Mac 上，分别启动本机后端和构建工作台。

```sh
PET_PHOTO_PROVIDER=ollama PET_PHOTO_PORT=8783 node server/cat-photo.mjs

DESKTOP_PET_PHOTO_LOCAL=true DESKTOP_PET_PHOTO_BACKEND_URL=http://127.0.0.1:8783 \
  DESKTOP_PET_BUILD_DIR=build/photo-multiview-local ./desktop/build.sh
open build/photo-multiview-local/桌宠.app
```
