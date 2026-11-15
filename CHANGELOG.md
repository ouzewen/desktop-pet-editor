# Changelog

## 0.2.0 — 2026-11-15

- 工作台、提醒卡片与输入条重做为星露谷风像素界面，内置 Ark Pixel 字体。
- 猫咪形象支持 HD（320×320）分层素材：耳朵、嘴鼻、眼睛、毛色、配饰与打字动作。
- 新增眼神跟随、右键重要提醒（待办列表、行内输入、点击空白收起）与打字同步。
- 外观面板移除眼型选择，眼型随预设固定，用户不可再自定义。
- 移除配置导入入口。
- 工程结构整理：原生代码拆到 `desktop/Sources/`，字体/图标/页面放到 `desktop/Resources/`，构建产物统一到 `build/`，新增 `docs/` 与 `scripts/`。
- 版本号写入 `VERSION`，构建时注入 App 的 `CFBundleShortVersionString` 与 `CFBundleVersion`。
- 猫 HD 素材迁移到 `public/assets/cat/hd/`；渲染器路径同步更新。

## 0.1.0 — 2026-10

- M1 柴犬形象编辑器与 macOS 桌宠工作台雏形。
- 160×160 分层 PNG、换色遮罩、动作预览与自检脚本。
