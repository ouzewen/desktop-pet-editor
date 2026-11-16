# 素材目录与命名

运行时素材根目录是 `public/assets/`，由 Vite 原样复制到 `build/desktop/assets/` 与 `build/web/assets/`。App 内所有图片都从这个目录按相对路径读取。

## 目录

```
public/assets/
├── cat/                  # 160×160 猫基础层（sit_ / walk_ / type_）
│   ├── hd/               # 320×320 HD 猫素材（new_*），含 HD 眼睛遮罩
│   │   └── breeds/       # 黑猫、三花猫和暹罗猫的正面及打字层，共用电脑
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

用 LibTV MCP 以 `i-<节点 ID>-0.png` 保存这六张原图，再运行 `python scripts/extract-orange-cat.py ORIGINALS_DIR STAGING_DIR`（需要 Pillow、NumPy、SciPy）。脚本去掉原图里的棋盘底，按参考位置裁切和对齐，仅用最近邻取样。输出为 320×320 RGBA，alpha 仅为 0 或 255，保留原图颜色和描边宽度。将提取结果先保存到单独的中转目录，以免覆盖 Aseprite 重绘后导出的运行时图层。

### 橘猫耳型

每款有一份 320×320 源文件，统一存放在 `art/orange-cat/ears/`。`body` 和 `head` 已锁定。应用在橘猫正面待机和打字时读取下表中的 PNG，随头部一起定位。侧面走路使用自己的耳型素材和映射。

| 配置 ID | 耳型 | Aseprite 源文件 | 运行时 PNG（`public/assets/cat/new_/`） |
| --- | --- | --- | --- |
| CE01 | 三角立耳 | `upright.aseprite` | `CAT_ear_upright.png` |
| CE02 | 折耳 | `folded.aseprite` | `CAT_ear_folded.png` |
| CE03 | 圆耳 | `round.aseprite` | `CAT_ear_round.png` |
| CE04 | 垂耳 | `droopy.aseprite` | `CAT_ear_droopy.png` |
| CE05 | 卷耳 | `curled.aseprite` | `CAT_ear_curled.png` |

改稿后只导出 `ears` 层，保留透明底、320×320 画布和原坐标。以下命令在项目根目录导出圆耳，其他耳型替换对应文件名即可。

```sh
aseprite -b --layer ears art/orange-cat/ears/round.aseprite \
  --save-as public/assets/cat/new_/CAT_ear_round.png
```

导出后运行 `./desktop/build.sh`，再用生成的桌宠 App 执行 `--self-test` 核对耳型切换和打字帧。

### 橘猫嘴鼻、花纹与配饰

源稿在 `art/orange-cat/`，每个配置 ID 对应一个独立的 `.aseprite`。三类素材都以同一个坐姿底子为基准，锁定 `body`、`head` 和 `ears`。运行时 PNG 同样通过 `aseprite -b --layer <图层名> <源稿> --save-as <PNG>` 导出。

| 源稿目录及图层名 | ID | 运行时 PNG（`public/assets/cat/new_/`） |
| --- | --- | --- |
| `muzzle` | CN02–CN04 | `CAT_muzzle_<ID>.png` |
| `face` | P01、P02、P06 | `CAT_face_<ID>.png` |
| `accessory` | A01–A03、A06 | `CAT_accessory_<ID>.png` |

鼻子随嘴形一起替换。原小圆嘴 CN01 保存在基础头部。A04 小书包和 A05 围巾的源稿保留在原目录。这两件已从工作台移除，旧配置加载时会切换为 A00 无配饰。

### 橘猫打字动画

`art/orange-cat/typing/gentle.aseprite` 和 `fast.aseprite` 各有四帧，帧时长分别为 250 ms 和 90 ms。两组锁定同一份身体、尾巴、头部和电脑，胸前与前爪动作在 `torso_motion` 和 `paws_front` 层。应用使用可换装的头部图层，最后绘制电脑，遮住与键盘交叠的爪子下缘。

在项目根目录导出两组运行图层：

```sh
for mode in gentle fast; do
  aseprite -b "art/orange-cat/typing/$mode.aseprite" \
    --script-param "mode=$mode" \
    --script-param output=public/assets/cat/new_ \
    --script scripts/export-orange-typing.lua
done
```

导出后用桌宠 App 的 `--self-test` 检查八帧变化、头部定位和跨速度切换时的电脑与尾巴。

### 黑猫、三花猫与暹罗猫

源稿在 `art/cat-breeds/`。每个品种的 `*-front.aseprite` 有独立的身体、头部、五套耳朵、眼睛与虹膜遮罩、四套嘴鼻和三套可选花纹。打开时显示默认组合，替换零件时切换相应图层。慢打、快打各有四帧源稿，锁定头部、身体和电脑，动作层保留各品种的爪部毛色。三花的右侧行走源稿为 `calico-right-walk.aseprite`，在共用的行走坐标上单独绘制斑块。

正面和打字图层在 `public/assets/cat/hd/breeds/CC02/`、`CC03/`、`CC04/`。正面运行图层以源稿图层名导出为 320×320 PNG。打字依次读取 `typing_body`、`typing_arms_<模式>_<帧号>`、头部、`typing_front_<帧号>` 和共用的 `breeds/typing_laptop.png`。右侧三花颜色层放在 `public/assets/cat/masks/`，以 `_calico_right.png` 结尾。

红蝴蝶结、蓝色小鱼帽、黄色星星发卡和蓝色鸭舌帽共用正面坐标。鸭舌帽在橘猫中使用 `A06`，其他三种猫使用 `A07`。黑猫、三花和暹罗的旧版 `A06` 打字猫配饰加载时会切换为 `A00` 无配饰。打字动画由动作控制。

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
