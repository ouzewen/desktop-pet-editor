# 版本与构建

## 当前版本

以下状态于 2026-11-21（北京时间）核对。线上版本以对应渠道实际返回的 appcast 为准，本机版本以安装路径下 App 的版本字段和运行进程为准。

| 用途 | 版本 | 入口与功能 |
| --- | --- | --- |
| 当前线上内测 | 0.3.8，构建 35 | 包含会议录音页和右上角「检查更新」。用 0.3.7（构建 34）测试副本完成线上下载、验签、安装和重启。 [GitHub 预发行版](https://github.com/ouzewen/desktop-pet-editor/releases/tag/v0.3.8) |
| 本机安装 | 0.11.21，构建 37 | `/Applications/桌宠.app`，源码 `42a7fd4`。在 build36 上增加首次隐藏提示和菜单栏首项「唤回小猫」，沿用公开 GitHub 内测清单。安装归档与回退路径见[本机安装与回退](#本机安装与回退)。 |
| 已集成并验收的候选 | 0.11.21，构建 38 | 集成提交 `f67caab`。加入工作台配色和布局，保留 build37 隐藏与唤回。独立候选位于 `build/workbench-integration-candidate/桌宠 80 像素测试版.app`，验收记录位于 `build/workbench-integration-review/`。尚未本机安装或上线。 |
| 内测群首次换装 | 0.3.6 迁移版，构建 33 | 群发使用 `DesktopPet-v0.3.6-public-beta-migration-macos-arm64.zip`。每天早上 9 点查公开 GitHub 内测清单，也可从菜单立即检查。 |
| 上一线上内测 | 0.3.7，构建 34 | 用于验证从 0.3.6 迁移版自动发现、下载、验签、安装和重启。与 0.3.6 迁移版使用同一份功能代码。 [GitHub 预发行版](https://github.com/ouzewen/desktop-pet-editor/releases/tag/v0.3.7) |
| 早期分发包 | 0.3.6 原包，构建 33 | GitHub 上的 `DesktopPet-v0.3.6-macos-arm64.zip` 仍指向飞书。收到这份包的用户需手动换成迁移版。 |
| 本机开发 | 默认显示 0.3.4 | `build/desktop/桌宠.app` 默认读取 `VERSION`。打包时使用发布目标的版本号和构建号。 |

### 0.3.8 功能

| 功能 | 当前状态 |
| --- | --- |
| 公开 GitHub 一键更新 | 0.3.7 到 0.3.8 已通过线上验收。 |
| 工作台「检查更新 → 安装并重启」 | 已随 0.3.8 发布。 |
| 会议录音、历史、转写与摘要 | 已随 0.3.8 发布。 |

2026-11-21 核对，[公开内测清单](https://raw.githubusercontent.com/ouzewen/desktop-pet-editor/refs/heads/codex/update-feed/docs/appcast-beta.xml)最高为 build35，[正式更新清单](https://raw.githubusercontent.com/ouzewen/desktop-pet-editor/refs/heads/codex/update-feed/docs/appcast.xml)无发布条目。下一内测包若需覆盖本机 build37，构建号须大于 37。

## 日期版本与上传节奏

- 显示版本暂按北京时间的发布日期使用 `0.月.日`，月份和日期无前导零。例如 11 月 21 日显示 `0.11.21`。
- 每晚 23:30（北京时间，`Asia/Shanghai`）由用户手动上传一个经确认的当日版本到 GitHub。同日预览以构建号或候选编号区分，同一发布日期的线上常规发布只保留经用户确认的一个包。
- GitHub 标签和归档目录可带年份，避免不同年份同一天重名。例如标签 `v2026-11-21`，归档目录 `release-archive/2026-11-21-0.11.21-build<构建号>/`。App 仍显示 `0.11.21`。

## 版本号

- 源版本号在 `VERSION`，`package.json` 和锁文件保持同步。App 的显示版本 `CFBundleShortVersionString` 默认读取 `VERSION`，打包时可由 `DESKTOP_PET_VERSION` 指定，对应更新清单的 `sparkle:shortVersionString`。
- Sparkle 以 `CFBundleVersion` 判断更新，对应更新清单的 `sparkle:version`。发布时显式指定 `DESKTOP_PET_BUILD_NUMBER`，取高于目标更新渠道已发布构建号及需要升级的本机版本构建号的整数。构建号跨月、跨年继续递增。
- 本地开发构建默认取 `git rev-list --count HEAD`。构建成功后终端会打印 `v<version>, build <n>`。

## 构建与产物

- `./desktop/build.sh` 构建桌宠 App 到 `build/desktop/桌宠.app`。
- `npm run build` 构建 Web 编辑器到 `build/web/`。
- `build/` 已在 `.gitignore` 中忽略，不提交构建产物。
- `scripts/clean.sh` 清理构建产物与本地缓存。

## 版本集成与验收

80×80 版本的正式验收起点为 `local-v0.3.8-build35-pixel80`（`b2dc371`），集成分支为 `codex/integration-pixel80`。开发分支在各自工作树使用独立预览构建和测试数据。交给集成时提供分支、提交范围、改动、依赖和已执行的验证。

1. **确认范围和依赖。** 从已验收基线核对开发分支的提交及文件差异，找出依赖的素材、动作、渲染接口和共享文件。原生共用入口 `desktop/Sources/main.swift`、原生与 Web 的桥接签名、版本文件、构建配置及正式安装由集成协调。
2. **逐项集成。** 按实际依赖顺序合并，先接入被依赖的素材、动作或接口，再接调用方。重叠文件逐项核对，确认历史素材和用户配置仍可读取。每组记录原分支提交和集成提交。
3. **验收独立原生候选。** 用单独的构建目录、Bundle ID 和测试偏好构建候选。运行原生 `--self-test`，并回归受影响的功能和共用入口。涉及 80×80 素材或动作时运行 `npm run assets:check` 和原生 `--pixel80-review <输出目录>`，按变更范围核对待机、打字档位、动作过渡和存档兼容。界面交互通过实际操作复查，并保留必要的原生截图。记录命令、退出状态、结果及未覆盖情形。
4. **记录版本状态。** 已集成指源码已进入集成分支，另记候选及验收结果。本机安装指日常路径已替换并重新启动确认。线上发布指 GitHub 附件和目标 appcast 已可读取且互相匹配。各状态均记录显示版本、构建号、提交和证据。正式安装与线上发布分别按用户授权执行。

## 本机安装与回退

1. **准备安装包。** 从验收通过的集成提交生成正式构建，核对版本、Bundle ID、钥匙串签名身份、更新源及资源。构建号高于目标更新渠道和需升级的本机版本，避免安装后被旧更新包覆盖。
2. **确认可安全重启。** 替换前检查录音、保存、转写、纪要生成及更新等进行中任务。等不宜中断的任务结束后再操作。把当前 App 复制到 `~/Library/Application Support/DesktopPet/App Backups/`，以版本和构建号区分，验证签名及备份版本。替换前再次确认可退出，然后让旧版正常退出。
3. **替换并复查。** 替换 `/Applications/桌宠.app`，用 `codesign --verify --deep --strict` 验签。重新打开，确认新进程来自原安装路径，复查 App 版本、构建号、工作台及本次改动的关键交互。若验证失败，使用已验签的旧 App 回退，并核对重启后的路径和版本。
4. **留档。** 将最终安装 ZIP、`SHA256SUMS.txt`、源码提交、构建与原生验收日志、必要截图、安装记录和回退位置存入主检出的 `release-archive/`。解压复核 ZIP 的签名及构建号。回退时只替换 App，继续使用原有的本机配置与用户资料。

当前 build37 的安装记录、校验值和日志在主检出的 `release-archive/2026-11-21-0.11.21-build37/`，回退包为 `~/Library/Application Support/DesktopPet/App Backups/桌宠-v0.3.8-build36-before-hide-recall.app`。

## 发布流程

1. 确定北京时间发布日期，读取目标更新清单和需升级的本机版本，分配构建号。同步更新 `VERSION`、`package.json` 和锁文件，在 `CHANGELOG.md` 记录变更。
2. 用指定显示版本和构建号打包，核对 App 的两项版本字段和渠道配置，运行 `--self-test` 及本次受影响功能的回归。
3. 将用户确认的候选对应到源码提交和 GitHub 标签。对外分发使用 Developer ID 签名、公证和 Sparkle 签名，归档最终 ZIP 与校验值。
4. 用户上传最终签名 ZIP 后，核对 Release 附件与签名时使用的 ZIP 一致，再更新目标渠道的 appcast，核对构建号、显示版本、附件 URL 和签名。

### 现有发布脚本的支持与限制

- `desktop/build.sh` 已支持分别设置 `DESKTOP_PET_VERSION` 和 `DESKTOP_PET_BUILD_NUMBER`，可构建日期显示版本。
- `scripts/release-update.sh VERSION BUILD_NUMBER` 接收两项独立参数，固定使用 `v<显示版本>` 做标签，并从它生成 ZIP 名和 appcast 下载链接。追加 `--publish-test` 会创建 GitHub 预发行版并更新清单。脚本当前只接受 `appcast.xml` 的 raw 或 Pages 地址，现有 `appcast-beta.xml` 渠道需沿用下文的手动打包和清单流程。
- 该脚本要求显示版本和构建号都高于 appcast 里的旧记录，也设有 `0.3.6`、build 33 的最低门槛。跨年时 `0.12.31` 到 `0.1.1` 即使构建号递增也会被拒绝。同一天的第二个同显示版本也会被拒绝。
- 需要带年份标签、发布到现有内测渠道，或显示版本跨年回落时，可先用 `desktop/build.sh` 独立打包，按下文完成公证和 Sparkle 签名，用户把签名 ZIP 上传到所选标签，再用实际附件 URL 更新对应渠道的 appcast。核对递增构建号，并验证旧版能发现更新。

## 应用内更新

桌宠使用 Sparkle 2。配置了更新源的构建按 Mac 本地时间每天早上 9 点后台检查一次。如果当时桌宠未运行或 Mac 在睡眠，当天启动或唤醒后会补查。工作台右上角的「检查更新」可立即检查。发现新版时会显示版本，按钮切换为「安装并重启」。点击后，Sparkle 会下载、验证并安装更新，然后重新打开桌宠。菜单栏桌宠图标与小猫右键菜单的「桌宠设置」中提供「检查更新…」，应用菜单也可直接打开 Sparkle 更新窗口。日常本地构建未配置更新源时，工作台和菜单的更新入口为灰色。

### 历史飞书内测渠道

给所有内测者分发同一份 ZIP。构建时同时设置 `DESKTOP_PET_UPDATE_FEED_URL`（更新服务的 HTTPS 清单地址）、`DESKTOP_PET_UPDATE_PUBLIC_KEY` 和 `DESKTOP_PET_UPDATE_ACCESS_FILE`（内测包更新访问码文件）。打开桌宠后，应用自动带访问码检查更新，朋友无需注册或输入信息。转发的安装包也具备同样的更新资格。

更新服务部署在桌宠意见反馈服务的 `/api/pet-updates/` 路由，服务端设置 `PET_UPDATE_ACCESS_SHA256` 为访问码的 SHA-256。将完成签名的更新包上传至私有 GitHub Release，在服务端设置该仓库的只读 `PET_UPDATE_GITHUB_TOKEN`，并通过 `PET_UPDATE_RELEASES` 配置 JSON 数组。每项记录包含构建号字符串 `build`、版本字符串 `version`、Sparkle 签名字符串 `signature`、字节数 `length`、GitHub 附件数字 ID `assetId`，以及可选纯文本 `notes`。发布前检查清单和归档是否能被内测构建读取，并验证未授权请求被拒绝。

### 签名与公证

正式发布前，在本机钥匙串安装 Developer ID Application 证书及对应私钥，并用 `security find-identity -v -p codesigning` 确认该身份可用。通过 `xcrun notarytool store-credentials desktop-pet-notary` 的交互提示保存公证凭据，并用 `xcrun notarytool history --keychain-profile desktop-pet-notary` 验证连接。

1. 用 `build/dependencies/sparkle-2.10.1/bin/generate_keys --account desktop-pet-editor -p` 读取这个项目的 EdDSA 公钥。首次在新环境构建时，先运行一次 `./desktop/build.sh` 取得 Sparkle 工具。首次创建项目密钥时省略 `-p`。后续每个正式版本使用同一把密钥，私钥保存在钥匙串并备份。
2. 设置 `DESKTOP_PET_UPDATE_PUBLIC_KEY` 为该公钥，设置 `DESKTOP_PET_SIGN_IDENTITY` 为 Developer ID Application 签名身份，并按目标更新渠道设置 `DESKTOP_PET_UPDATE_FEED_URL` 后构建。
3. 将 App 用 `ditto -c -k --sequesterRsrc --keepParent` 压成 ZIP，用 `xcrun notarytool submit <安装包> --keychain-profile desktop-pet-notary --wait` 提交。确认结果为 `Accepted` 后，在 App 上运行 `xcrun stapler staple <App 路径>` 和 `xcrun stapler validate <App 路径>`，再重新生成最终 ZIP。使用 Sparkle 的 `sign_update --account desktop-pet-editor <最终 ZIP>` 签名，将同一个文件上传为 GitHub Release 附件。
4. 更新 [Sparkle appcast](https://sparkle-project.org/documentation/publishing/)，其中 `sparkle:version` 对应 `CFBundleVersion`，`sparkle:shortVersionString` 对应用户看到的版本。私有内测渠道由更新服务根据 `PET_UPDATE_RELEASES` 生成清单。发布前用对应渠道的桌宠检查更新并下载安装。

桌宠目前按构建机器的 CPU 架构编译。正式更新包应与该更新源下已安装版本的架构兼容。安装时将应用复制到「应用程序」后再运行。此前安装的版本需要手动换装一次带更新功能的包。

### 本机验证两个版本

使用独立的测试密钥，以及同一个回环地址（例如 `http://127.0.0.1:18764/appcast.xml`）和公钥，构建旧版与新版。分别用 `DESKTOP_PET_BUILD_DIR` 指定不同输出目录，用 `DESKTOP_PET_VERSION` 和 `DESKTOP_PET_BUILD_NUMBER` 区分版本。两个测试包使用同一签名身份和同一测试 Bundle ID，并与日常使用的 App 区分。

用 `ditto -c -k --sequesterRsrc --keepParent` 压缩新版 App，签名后将 ZIP 和清单放在同一个本地 HTTP 服务中。运行旧版，确认后台访问清单，并在菜单栏桌宠图标的「桌宠设置」中使用「检查更新…」。点击安装后，检查原路径的 App 版本与构建号、重新启动后的进程和升级前写入的测试偏好。

## 目录约定

- 源码：`src/`（TS 渲染器与 Web 编辑器）、`desktop/Sources/`（Swift）。
- 资源：`public/assets/`（运行时）、`desktop/Resources/`（App 图标、字体、pet.html）。
- 文档：`README.md`、`docs/`、`CHANGELOG.md`。
- 本地生成物与归档：`build/`、`output/`、`release-archive/`、`.playwright-cli/`，保存在工作区磁盘。
