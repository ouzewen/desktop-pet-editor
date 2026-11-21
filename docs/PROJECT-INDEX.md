# 桌宠项目管理索引

最近盘点为 2026-11-21。现用项目是 macOS 猫咪桌宠，工作台、分层素材和构建脚本都在本仓库。

## 版本与回退

| 想找什么 | 从哪里打开 |
| --- | --- |
| 日常使用的 App | `/Applications/桌宠.app`，**0.3.8（构建 36），右键菜单精简** |
| 本机安装包、校验值和自检记录 | [0.3.8 构建 36 本机归档](../release-archive/0.3.8-build36-menu/) |
| 对应源码与素材快照 | 本地 Git 标签 `local-v0.3.8-build36-menu`。80×80 素材的原验收标签为 `local-v0.3.8-build35-pixel80`。 |
| 更新前的安装包 | `~/Library/Application Support/DesktopPet/App Backups/桌宠-v0.3.8-build35-before-menu.app` · [构建 35 本机归档](../release-archive/0.3.8-build35-pixel80/) |
| 发布历史与版本号 | [版本与构建](VERSIONING.md) · [变更记录](../CHANGELOG.md) |

线上公开内测仍为构建 35。本机菜单版为构建 36，回退或重装时以本机归档的 ZIP 和 SHA-256 为准。日常开发构建默认读取 [VERSION](../VERSION)，它记录的是源码默认版本。

## 素材与评审

| 想找什么 | 位置 |
| --- | --- |
| 改像素画 | [现用 80×80 Aseprite 分层源稿](../art/cat-pixel80/) · [其他源稿和历史参考](../art/) |
| 查正式版用了哪些图 | [184 张现用 PNG](../desktop/assets-pixel80/) · [逐文件清单 CSV](../release-archive/0.3.8-build35-pixel80/active-assets.csv) |
| 找旧存档对应的底稿 | [首版 80×80 差异素材](../desktop/assets-pixel80-v1/) · [原始运行时图层、旧动作与 Web 使用的素材](../public/assets/) |
| 找预览与验收记录 | [最终原生工作台复查](../output/cat-pixel80/native/installed-production/) · [表情对照图](../output/cat-pixel80/native/asset-completion/expressions-preview.png) · [工作台视觉评审](../output/cat-pixel80/native/workbench-native/) |
| 找历次试稿、照片和花色记录 | [全部历史评审与中间导出](../output/) · [审美与制作复盘](CAT-PRODUCT-PLAYBOOK.md) · [花色指南](CAT-COAT-COMPONENT-GUIDE.md) |
| 查素材组、版本用途和导出方式 | [素材说明](ASSETS.md) · [代码素材清单](../src/pet-assets.ts) |

修改顺序是 Aseprite 分层源稿 → `output/cat-pixel80/assets/` 暂存 → macOS 原生工作台验收 → `desktop/assets-pixel80/` 正式 PNG。正式 PNG 会按原坐标展开给渲染器，清单中显示的文件尺寸可能是 320×320 或图集尺寸。

## 代码、构建与本机数据

| 内容 | 位置 |
| --- | --- |
| macOS 工作台、菜单与系统交互 | [Swift 源码](../desktop/Sources/) · [App 图标、字体与运行页面](../desktop/Resources/) |
| 猫咪渲染、动作、外观配置和 Web 编辑器 | [TypeScript 源码](../src/) |
| 照片生成后端与验收用例 | [后端](../server/) · [测试夹具](../fixtures/) |
| 构建、自检、素材导出与发布 | [App 构建脚本](../desktop/build.sh) · [工具脚本](../scripts/) · [开发入口](../README.md) |
| 日常构建、测试包和临时工程文件 | [build](../build/) · [本机 80×80 安装版构建目录](../build/desktop-installed-80/) |
| 自定义猫咪、会议录音、文件整理记录和本地设置 | `~/Library/Application Support/DesktopPet/` 下的 `custom/`、`Meetings/`、`FileOrganization/` 等目录，及当前应用的 macOS 偏好设置 |
| 早期爪伴、柴犬和网页原型 | [上级项目说明](../../README.md) · [柴犬历史说明](SHIBA-NOTES.md) |
| 独立的桌宠反馈服务 | [桌宠反馈服务目录](../../桌宠反馈服务/) |

## 后续维护

- 素材有替换时，更新源稿和正式导出，运行 `npm run assets:check`，再用 macOS 工作台验证相关组合和动作。
- 验收一份可安装的版本后，归档安装 ZIP、SHA-256 和自检记录，并在版本表补上对应的源码标签。对外发布按[发布流程](VERSIONING.md#发布流程)递增构建号。
- 日常开发和评审产物继续留在相应目录。需要回退 App 时，从「版本与回退」选目标安装包。自定义形象、会议录音与个人数据由本机单独保存。
