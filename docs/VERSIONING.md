# 版本与构建

## 版本号

- 源版本号在 `VERSION`（当前 `0.2.0`），`package.json` 保持同步。
- App 的 `CFBundleShortVersionString` 来自 `VERSION`。
- `CFBundleVersion` 使用 `git rev-list --count HEAD`，每次提交自动递增，便于判断本机运行的是哪个构建。
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

## 目录约定

- 源码：`src/`（TS 渲染器与 Web 编辑器）、`desktop/Sources/`（Swift）。
- 资源：`public/assets/`（运行时）、`desktop/Resources/`（App 图标、字体、pet.html）。
- 文档：`README.md`、`docs/`、`CHANGELOG.md`。
- 生成物：`build/`、`.playwright-cli/`，不入库。
