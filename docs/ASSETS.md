# 素材目录与命名

运行时素材根目录是 `public/assets/`，由 Vite 原样复制到 `build/desktop/assets/` 与 `build/web/assets/`。App 内所有图片都从这个目录按相对路径读取。

## 目录

```
public/assets/
├── cat/                  # 160×160 猫基础层（sit_ / walk_ / type_）
│   ├── hd/               # 320×320 HD 猫素材（new_*），含 HD 眼睛遮罩
│   ├── new_/             # 320×320 LibTV 橘猫分层，只用于橘猫待机和打字
│   └── masks/            # 160×160 猫的换色遮罩与虹膜遮罩
├── frames/               # 160×160 柴犬（M1）身体/头
├── masks/                # 柴犬换色遮罩
├── motion/               # 柴犬动作层
├── parts/                # 柴犬零件（耳/嘴/尾/眼/花纹）
├── palettes/C01.json     # 柴犬配色
└── presets/preset_m1_12.json
```

- 猫是当前默认与主要维护对象；柴犬（根目录的 M1 素材）仍在仓库中保留，但工作台暂不展示。
- `cat/hd/new_*.png` 是 320×320 的 HD 代素材，文件名保留 `new_` 前缀以区分代际；渲染器会根据 `cat/hd/` 前缀校验 320×320。
- 160×160 猫素材仍用于基础坐姿/行走/打字骨架，HD 素材叠加在更高分辨率画布上。

## LibTV 橘猫素材

新橘猫素材来自画布项目 `2576e72bf0f04924a4720136c4ddec8b` 的「橘猫」「不同耳朵」「嘴鼻」「面部花纹」「配饰」「敲键盘」节点。「图片节点 6」的两个输出是打字草稿；六件配饰取自画布上的「配饰」。原坐姿由身体、基础头部和独立耳朵合成；虹膜遮罩只覆盖深棕色眼仁。两组打字共用同一个头部、电脑和尾巴。

用 LibTV MCP 以 `i-<节点 ID>-0.png` 保存这六张原图，再运行 `python scripts/extract-orange-cat.py ORIGINALS_DIR public/assets/cat/new_`（需要 Pillow、NumPy、SciPy）。脚本去掉原图里的棋盘底，按参考位置裁切和对齐，仅用最近邻取样。输出为 320×320 RGBA，alpha 仅为 0 或 255；保留原图颜色和原有描边宽度。配置中的旧耳朵编号保持不变：CE01 为立耳，CE02–CE05 依次映射到新素材的 CE01–CE04。

## 命名约定

- `<view>_<part>[_<id>][_<slot>].png`
  - `view`: `sit`、`walk`、`type`
  - `part`: `body`、`head`、`ears`、`ear_CE02`、`eye_Y05`、`mouth_CN02` 等
  - `slot`（柴犬遮罩）: `g`（主色）、`s`（阴影）、`l`（高光）、`w`/`d`（猫毛色）
- 虹膜遮罩统一为 `*_iris.png`，只保留 alpha，用于换瞳色和眼神跟随。
- 所有分层 PNG 必须与所在代际的画布尺寸一致：基础层 160×160，`cat/hd/` 为 320×320。

## 新增一个猫零件

1. 在 `src/cat.ts` 的 `catOptions` 中注册选项 id 与中文名。
2. 把分层 PNG 放进 `public/assets/cat/`（160）或 `public/assets/cat/hd/`（320）。
3. 在 `src/render.ts` 的素材清单（`newCatLayers` 或 `catFurLayers`）里登记路径，必要时补绘制顺序。
4. 运行构建与自检，确认所有图层尺寸、组合和动作都通过。

## 参考图

`fixtures/` 里是柴犬 M1 的验收对照图，不属于运行时素材，可在 PR/评审时引用。柴犬的耳朵/嘴鼻代工说明见 `docs/SHIBA-NOTES.md`。
