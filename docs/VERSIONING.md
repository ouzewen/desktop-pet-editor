# 版本与构建

## 版本号

- 源版本号在 `VERSION`，`package.json` 和锁文件保持同步。
- App 的 `CFBundleShortVersionString` 来自 `VERSION`。
- 本地构建的 `CFBundleVersion` 默认取 `git rev-list --count HEAD`。正式发布可用 `DESKTOP_PET_BUILD_NUMBER` 设置构建号，且必须大于上一次发布的构建号。Sparkle 用这个值判断是否有新版。
- 构建成功后终端会打印 `v<version>, build <n>`。

## 构建与产物

- `./desktop/build.sh` 构建桌宠 App 到 `build/desktop/桌宠.app`。
- `npm run build` 构建 Web 编辑器到 `build/web/`。
- `build/` 已在 `.gitignore` 中忽略，不提交构建产物。
- `scripts/clean.sh` 清理构建产物与本地缓存。

## 发布流程

1. 更新 `VERSION` 与 `package.json`（锁文件同步）。
2. 在 `CHANGELOG.md` 记录本次变更。
3. 构建并运行 `--self-test`。
4. 提交后打 tag：`git tag -a v0.2.0 -m "0.2.0"`，推送 tag 即可对应一个可复现版本。
5. 对外分发时需要 Developer ID 签名与公证；本地开发沿用固定签名身份和 Bundle ID，避免每次重建都重新授权输入监控。

## 应用内更新

桌宠使用 Sparkle 2。配置了更新源的构建默认定期检查，工作台顶部发现新版时会显示版本和「安装并重启」。菜单栏桌宠图标和应用菜单均提供「检查更新…」，可打开 Sparkle 更新窗口。用户确认安装后，Sparkle 会下载、验证并安装更新，然后重新打开桌宠。日常本地构建未配置更新源时，检查菜单项为灰色。

### 准备正式更新源

正式发布前，在本机钥匙串安装 Developer ID Application 证书及对应私钥，并用 `security find-identity -v -p codesigning` 确认该身份可用。通过 `xcrun notarytool store-credentials desktop-pet-notary` 的交互提示保存公证凭据，并用 `xcrun notarytool history --keychain-profile desktop-pet-notary` 验证连接。

1. 用 `build/dependencies/sparkle-2.10.1/bin/generate_keys --account desktop-pet-editor -p` 读取这个项目的 EdDSA 公钥。首次在新环境构建时，先运行一次 `./desktop/build.sh` 取得 Sparkle 工具。首次创建项目密钥时省略 `-p`。后续每个正式版本使用同一把密钥，私钥保存在钥匙串并备份。
2. 设置 `DESKTOP_PET_UPDATE_PUBLIC_KEY` 为该公钥，设置 `DESKTOP_PET_SIGN_IDENTITY` 为 Developer ID Application 签名身份，再构建正式包。更新清单默认地址为 `https://ouzewen.github.io/desktop-pet-editor/appcast.xml`，对应 GitHub Pages 的 `codex/update-feed` 分支下的 `docs/appcast.xml`。
3. 将 App 用 `ditto -c -k --sequesterRsrc --keepParent` 压成 ZIP，用 `xcrun notarytool submit <安装包> --keychain-profile desktop-pet-notary --wait` 提交。确认结果为 `Accepted` 后，在 App 上运行 `xcrun stapler staple <App 路径>` 和 `xcrun stapler validate <App 路径>`，再重新生成最终 ZIP。使用 Sparkle 的 `sign_update --account desktop-pet-editor <最终 ZIP>` 签名，将同一个文件上传为 GitHub Release 附件。
4. 更新 [Sparkle appcast](https://sparkle-project.org/documentation/publishing/)，其中 `sparkle:version` 对应 `CFBundleVersion`，`sparkle:shortVersionString` 对应用户看到的版本。将 `enclosure` 指向发行版附件的固定 URL，并填入上一步生成的签名和长度。先从外部确认附件可下载，再更新发布分支上的清单，并核对 Pages 返回了新版清单。

桌宠目前按构建机器的 CPU 架构编译。正式更新包应与该更新源下已安装版本的架构兼容。安装时将应用复制到「应用程序」后再运行。此前安装的版本需要手动换装一次带更新功能的包。

### 本机验证两个版本

使用独立的测试密钥，以及同一个回环地址（例如 `http://127.0.0.1:18764/appcast.xml`）和公钥，构建旧版与新版。分别用 `DESKTOP_PET_BUILD_DIR` 指定不同输出目录，用 `DESKTOP_PET_VERSION` 和 `DESKTOP_PET_BUILD_NUMBER` 区分版本。两个测试包使用同一签名身份和同一测试 Bundle ID，并与日常使用的 App 区分。

用 `ditto -c -k --sequesterRsrc --keepParent` 压缩新版 App，签名后将 ZIP 和清单放在同一个本地 HTTP 服务中。运行旧版，确认后台访问清单，并在菜单栏使用「检查更新…」。点击安装后，检查原路径的 App 版本与构建号、重新启动后的进程和升级前写入的测试偏好。

## 目录约定

- 源码：`src/`（TS 渲染器与 Web 编辑器）、`desktop/Sources/`（Swift）。
- 资源：`public/assets/`（运行时）、`desktop/Resources/`（App 图标、字体、pet.html）。
- 文档：`README.md`、`docs/`、`CHANGELOG.md`。
- 生成物：`build/`、`.playwright-cli/`，不入库。
