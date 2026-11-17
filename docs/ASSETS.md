# 素材目录与命名

运行时内置素材根目录是 `public/assets/`，由 Vite 复制到 `build/desktop/assets/` 与 `build/web/assets/`。两个构建均排除旧的用户存档路径 `public/assets/cat/custom/`，桌宠打包时也会检查暂存目录。

像素编辑的 PNG、底稿信息和预设清单保存在 `~/Library/Application Support/DesktopPet/custom/`。从项目内打开新版桌宠时，旧工作区存档会合并到此处，原目录备份到同级的 `legacy-custom-backups/`。

## 素材清单与导出

[`src/pet-assets.ts`](../src/pet-assets.ts) 是内置 PNG 的清单。每组记录用途（现役、旧存档兼容、历史库存）、Aseprite 源稿、导出脚本或图层、输出路径和尺寸。工作台读取清单里的零件选项、加载项和尺寸。历史库存留在原路径，只有兼容组进入相关渲染器。无可运行导出流程的素材组在列表中标为 `retained`。

```sh
npm run assets:list
npm run assets:list -- cat.typing.reference-v2.fast
npm run assets:check
npm run assets:export -- cat.ear.folded --out /tmp/pet-review-assets
```

导出使用清单中的脚本或图层，并在临时目录检查 PNG 是否齐全、尺寸是否正确。审核后可用同一命令省略 `--out`，输出到 `public/assets/`。如果 Aseprite 不在 PATH 中，将 `ASEPRITE_BIN` 设为本机 Aseprite 可执行文件路径。桌宠和 Web 构建都会检查 PNG、源稿和脚本的登记；构建无需运行 Aseprite。登记不包含用户自定义存档。

## 目录

```
public/assets/
├── cat/                  # 160×160 猫基础层（sit_ / walk_ / type_）
│   ├── hd/               # 320×320 HD 猫素材（new_*），含 HD 眼睛遮罩
│   │   ├── breeds/       # 各品种的正面及打字层，共用电脑
│   │   ├── typing-v2/    # 当前32帧低抬爪、遮罩与表情
│   │   └── typing-reference/ # 历史12帧图集与共用干净电脑
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
- `cat/hd/new_*.png` 是 320×320 的 HD 代素材，文件名保留 `new_` 前缀以区分代际。当前 `typing-v2/` 图集将 32 张 320×320 帧纵向排列为 320×10240；历史 `typing-reference/` 保留 12 帧、320×3840。其余单帧图层仍为 320×320，渲染器按版本校验尺寸。
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

改稿后通过清单中的 `cat.ear.*` 素材组导出 `ears` 层，保留透明底、320×320 画布和原坐标。


导出后运行 `./desktop/build.sh`，再用生成的桌宠 App 执行 `--self-test` 核对耳型切换和打字帧。

### 橘猫嘴鼻、花纹与配饰

源稿在 `art/orange-cat/`，每个配置 ID 对应一个独立的 `.aseprite`。三类素材都以同一个坐姿底子为基准，锁定 `body`、`head` 和 `ears`。对应素材组可用 `npm run assets:list` 查询。

| 源稿目录及图层名 | ID | 运行时 PNG（`public/assets/cat/new_/`） |
| --- | --- | --- |
| `muzzle` | CN02–CN04 | `CAT_muzzle_<ID>.png` |
| `face` | P01、P02、P06 | `CAT_face_<ID>.png` |
| `accessory` | A01–A03、A06 | `CAT_accessory_<ID>.png` |

原合并嘴鼻和小圆嘴底稿仍保存在源文件中。正面待机和打字使用下方的独立鼻子与嘴巴图层。A04 小书包和 A05 围巾的源稿保留在原目录。这两件已从工作台移除，旧配置加载时会切换为 A00 无配饰。

原 `face/P01、P02、P06` 的整脸贴花保留用于还原早期像素编辑底稿。当前猫外观使用下方独立额头花纹，白脸颊不再随额头选择叠加。

### 独立额头花纹

猫外观的 `pattern` 字段只控制额头：`P00` 品种原额纹、`P03` 无额纹、`P01` 白额线、`P02` 双眉斑、`P05` 小菱纹、`P06` 眉斑加额线。品种预设使用 `P00` 以保持默认外观。M 字纹 `P04` 已下架，源稿和 PNG 仍登记在兼容组，旧配置映射到 `P03`。

每款的 Aseprite 源文件在 `art/cat-shared/forehead/`，身体、头部和耳朵参考层锁定，`forehead` 层可以单独编辑。共用 320×320 坐标，红通道表示深色纹，绿通道表示浅色纹，运行时按所选毛色上色。白额线收在额头，双眉斑不包含脸颊。`P03` 是清除原额纹、不叠加新纹。

`art/cat-shared/face-fur-patterns.aseprite` 保存 `forehead_region`、`face_region` 两个互不重叠的区域遮罩，以及三种独立脸侧毛纹。替换额纹先按当前毛色补齐干净的额头底毛和轻阴影，再绘制独立额纹；更换毛皮纹保持已选额纹，统一处理脸部毛皮和身体。原外轮廓、眼鼻嘴和胡须受保护。

额头区域沿两耳之间的头型用 2 px 台阶收边，替换耳型的实心形状遮罩会保护耳折痕和内耳。三花、暹罗和布偶没有独立烘焙的额头条纹；使用原生毛皮时保留其连续的品种色区，只叠加所选额纹，避免把黑白块或重点色当成额纹清除。选择统一毛皮时才统一额头底毛；额纹图案与配色仍保持独立。


新的像素编辑底稿记录 `markingLayout: shared`；缺失此字段的旧存档按 `legacy` 的整脸贴花与仅身体换纹来还原底稿，再提取用户修改，避免把旧白颊或旧脸纹误判为用户绘画。

### 正面鼻子与嘴巴

`art/cat-shared/front-face-parts.aseprite` 按毛色编号分组，每组有四帧。鼻子 `NO01–NO04` 和嘴巴 `CN01–CN04` 分别在 `nose` 与 `mouth` 图层。头底参考已锁定，橘猫还有一层补齐旧嘴鼻下方毛色的 `base_patch`。两件零件共用 320×320 正面坐标，鼻尖接到嘴线的位置统一在脸部中心。旧 `muzzle` 配置会转成原来的一对嘴形和鼻形。


### 共用低抬爪打字动画

八个品种默认使用 `reference-v2` 三档动画，复用已确认的 Aseprite MCP 32 帧慢打稿。三档使用完全相同的低抬爪轨迹，以播放时长区分速度；上半圈爪边略加粗，下半圈保留，固定前臂虎斑与移动手掌独立。三档保持待机头部尺寸与坐标、肩部和电脑位置，不进入面部。`src/cat-typing-paint.ts` 按当前品种、毛色和花纹给共用动作着色。

| 工作台动作 | 模式 / 源文件 | 循环时长 | 表情与汗水 |
| --- | --- | --- | --- |
| 慢敲键盘 | `gentle` / `gentle.aseprite` | 2240 ms（70 ms/帧） | 保留当前表情 |
| 比较快 | `fast` / `fast.aseprite` | 1280 ms（40 ms/帧） | 沿用睁眼、微笑/平嘴、汗水 |
| 特别快 | `frenzy` / `frenzy.aseprite` | 640 ms（20 ms/帧） | 沿用挤眼、微笑、大汗珠与甩汗 |

三份 320×320 源文件保存在 `art/cat-shared/typing-v2/`，每份 32 帧。`body_reference`、`head_reference`、`laptop_reference` 是锁定参考；`torso_base`、`forearm_texture_restore`、`forearm_edge_cleanup` 保存固定前臂，`paw_left`、`paw_right`、`paw_upper_outline` 保存动作，`paws_mask` 从新爪形派生。现有 `effort_eyes`、`mouth_expression`、`mouth_region` 像素保持不变，旧 12 帧汗水按相位映射到 32 帧。表情不修改保存的瞳色、鼻子和嘴形；自选其他嘴形时保留该选项。挤眼隐藏原眼睛与高光。

真实键盘按最近一秒的输入频率选择档位：达到 5 次进入比较快，达到 9 次进入特别快；特别快降到 6 次退出，比较快降到 2 次退出，避免在阈值附近来回跳动。切换档位保留动作进度，停止打字沿用原有待机超时。

共用手臂和爪子遮罩从慢打源稿导出，素材组为 `cat.typing.reference-v2.shared`。`cat.typing.reference-v2.fast` 和 `cat.typing.reference-v2.frenzy` 分别导出各档的表情和汗水。


共导出 8 张透明 PNG。`arms.png` 和 `paws_mask.png` 供三档共用，和独立的 `sweat_fast.png`、`sweat_frenzy.png` 同为 320×10240 的 32 帧纵向图集。另有 `mouth_smile.png`、`mouth_flat.png`、`mouth_region.png` 和 `effort_eyes.png` 四张 320×320 单帧图层。前臂图集包含固定胸口与肩部；头部、尾巴和电脑继续使用既有可组合图层。

工作台预览记录 `typingAnimation: reference-v2` 并使用 `aligned` 坐标。旧 `reference` 存档继续从 `typing-reference/` 读取原 12 帧图集，旧 `shared` 存档使用原 12 帧轨迹，缺字段的历史打字档按 `legacy` 四帧重建。加载这些旧档时，先还原对应版本底稿，再提取笔迹并叠加当前动作。`--self-test` 检查 32 帧循环、三档同手轨迹、固定纹理、速度切换、表情换装，以及历史帧笔迹迁移。

当前电脑使用独立的 `art/cat-shared/typing-laptop.aseprite`，直接在最终 320×320 坐标绘制。`laptop` 是可编辑层，身体、头部、前爪参考层锁定；三份动作源稿中的 `laptop_reference` 同步引用这版电脑。外轮廓统一为不透明 `#442416`，清理了旧底稿的灰白杂边和右侧金属支架杂色，中央面板与爪印保留。所有品种共用，毛色、毛纹与尾型不参与电脑换色。


这张电脑 PNG 在上述 8 张动作图之外，共计 9 张。新自定义底稿记录 `laptopVersion: clean`；没有此字段的旧底稿按 `original` 重建，包括早期 `reference` 存档。原两张电脑 PNG 保留用于准确提取旧图上的用户笔迹，避免将旧杂边带回新版。

原橘猫电脑层里另有 84 个尾根连接像素。当前渲染将这片毛色精确分离到身体底层，再叠加干净电脑，保留原尾的接缝；换毛色、换纹和自定义笔迹仍作用于这片连接。源稿用锁定的 `tail_join_reference` 记录原像素，动画参考层显示完整合成。

#### 历史 shared 动画与效果源稿

历史 `shared` 的温柔打字和疯狂打字共用 12 帧轨迹，由原温柔打字第 0 帧左爪、第 2 帧右爪生成整数像素中间姿势，循环为 1000 ms 与 360 ms。之后的 `reference` 为三档 12 帧手绘图集，周期 1000/600/360ms。这两代均保留用于旧底稿重建；当前默认动作使用上述 `reference-v2` 图集。

历史效果源稿 `art/cat-shared/typing-effects.aseprite` 保存 `effort_eyes`、`sweat` 和橘猫旧眼睛的底毛补片 `orange_eye_patch`，身体与头部是锁定参考层。四帧分别是休息、出汗、下落、消退；导出一张挤眼、三张汗水、一张补片，共五张透明 PNG。


部分早期品种的头底仍含深棕色圆瞳，渲染器只在努力表情时利用现有眼孔遮罩识别、补齐为邻近原毛色，并缓存结果；正常表情和旧存档继续使用原头底。新增品种宜直接保存不含眼睛的干净头底，眼睛、虹膜、高光保持独立，便于复用表情。

### 橘猫打字原始底稿

`art/orange-cat/typing/gentle.aseprite` 和 `fast.aseprite` 各有四帧，帧时长分别为 250 ms 和 90 ms。两组锁定同一份身体、尾巴、头部和电脑，胸前与前爪动作在 `torso_motion` 和 `paws_front` 层。应用使用可换装的头部图层，最后绘制电脑，遮住与键盘交叠的爪子下缘。

打字使用待机的头部尺寸与坐标。身体、前爪和电脑按颈部和底边对齐后，以最近邻方式呈现。源稿保留原始动作坐标，旧版打字姿势保存的像素编辑会在载入时投影到当前坐标。

两个历史导出组为 `cat.orange.typing.gentle` 和 `cat.orange.typing.fast`。


这些原始四帧保留用于还原 `legacy` 四帧、`shared` 12 帧的旧像素编辑存档，并提供复用的身体与电脑图层；当前 `reference-v2` 动画不再播放原来的高抬手动作。

### 黑猫、三花猫与暹罗猫

源稿在 `art/cat-breeds/`。每个品种的 `*-front.aseprite` 有独立的身体、头部、五套耳朵、眼睛与虹膜遮罩、四套嘴鼻和三套可选花纹。打开时显示默认组合，替换零件时切换相应图层。历史慢打、快打各有四帧源稿，锁定头部、身体和电脑，动作层保留各品种的爪部毛色。三花的右侧行走源稿为 `calico-right-walk.aseprite`，在共用的行走坐标上单独绘制斑块。

正面和打字图层在 `public/assets/cat/hd/breeds/CC02/`、`CC03/`、`CC04/`。正面运行图层以源稿图层名导出为 320×320 PNG。当前打字合成 `typing_body`、`typing-v2/` 共用动作图集、可换装的头部及独立表情和共用的 `typing-reference/laptop.png`，电脑遮住爪子下缘；原有 `typing_arms_fast_<帧号>` 与 `typing_front_<帧号>` 保留用于旧存档还原。右侧三花颜色层放在 `public/assets/cat/masks/`，以 `_calico_right.png` 结尾。

红蝴蝶结、蓝色小鱼帽、黄色星星发卡和蓝色鸭舌帽共用正面坐标。鸭舌帽在橘猫中使用 `A06`，其他三种猫使用 `A07`。黑猫、三花和暹罗的旧版 `A06` 打字猫配饰加载时会切换为 `A00` 无配饰。打字动画由动作控制。

默认眼睛的小高光从 `art/cat-breeds/eye-glints.aseprite` 导出。橘猫用 `CAT_eye_glints.png`，黑猫、三花猫和暹罗猫共用 `eye_glints.png`。侧面的高光从 `walk-eye-glint.aseprite` 导出到 `walk_eye_Y01_glints.png`。

### 英短蓝猫、美短、狸花猫与布偶猫

这四个品种使用 LibTV 项目 `375001d11739451c9f5549e520831c34` 中同名节点的毛色和花纹，套用已验收的 320×320 正面轮廓、眼窝与脚底锚点。分别对应 `CC05`、`CC06`、`CC07` 和 `CC08`，源稿前缀为 `british-blue`、`american-shorthair`、`li-hua` 和 `ragdoll`。

每个 `*-front.aseprite` 包含独立的身体、干净头底、立耳、眼睛、虹膜遮罩、瞳孔区域、嘴、鼻子和高光。四帧标签 `CN01`–`CN04` 保存四组嘴鼻零件，应用可独立组合鼻子和嘴巴。历史 `*-typing.aseprite` 包含 `gentle` 和 `fast` 标签，各四帧。身体、前爪和电脑保存原始动作坐标，锁定的头部参考按旧版动作比例放置，工作台统一对齐到待机尺寸。当前三档打字与其他品种共用 `typing-v2/` 图集，旧动作层继续用于存档还原与品种毛色取样。

运行时 PNG 位于 `public/assets/cat/hd/breeds/<编号>/`，嘴鼻图集位于 `public/assets/cat/hd/face-parts/<编号>.png`。替换耳型和其他表情沿用共用零件及各品种的配色。英短蓝猫的素材组是 `cat.breed.CC05` 和 `cat.breed.CC05.typing`。

### 仅配色接入同轮廓品种

在 `src/cat-breeds.ts` 的 `colorCatBreeds` 加一条记录。以下示例依次指定底毛、花纹和浅毛三色。

```ts
CC09: { name: '示例猫', colors: ['#A69182', '#755D55', '#F7E9DB'] },
```

品种编号用于保存和恢复，发布后保持编号稳定。默认套用橘猫的轮廓和部件，也可用 `template: 'CC04'` 一类的字段复用现有品种的轮廓、原生花纹位置和外观默认值。工作台会自动列出该品种及色块。头身、耳尾、描边和三档打字前爪共用素材并按登记颜色着色。毛色搭配选回「品种原色」时恢复这套配色。

需要新轮廓、比例或原生花纹位置的品种，仍按对应零件和遮罩登记素材。沿用现有花纹位置的配色品种只需上述一条记录。


### 共用正面耳型

正面待机与三档打字共用同一套 320×320 耳型坐标。每个品种提供一份 `ear_upright.png`，建立默认立耳、额头色块和脸侧接缝。从中保留固定额头，再用橘猫已验收的四份替换耳型作轮廓。新增同一坐标体系的品种时，在 `src/cat-ears.ts` 配置画面左、右耳的描边、阴影、毛色和浅色。三花的左右耳可使用不同配色，暹罗可为双耳指定重点色。旧品种的四份替换耳朵 PNG 用于识别早期像素编辑存档里的底稿。

`art/cat-shared/front-ear-masks.aseprite` 对应四款替换耳型。每个标签对应一帧，`head_reference`、`upright_reference` 和 `shape_reference` 是锁定的对位参考。画面左、右耳各有独立遮罩。遮罩中的实心白色使用完整耳朵色，灰色用于耳根过渡，未覆盖的区域保留品种底稿的像素。耳型轮廓有增减的位置也用实心白色标记，让合成器能擦除旧耳尖或加上新轮廓。侧面使用自己的像素形状和锚点。


### 共用尾巴

外观中的尾巴提供 `CT01 细长尾`、`CT02 短尾`、`CT03 蓬松尾`、`CT04 弯钩尾`。短尾取日本短尾猫的绒球形态，蓬松尾参考缅因猫宽厚并逐渐收尖的长毛尾，弯钩尾采用猫尾尖向内弯的姿态。[CFA 日本短尾猫](https://cfa.org/breed/japanese-bobtail/)、[CFA 缅因猫](https://cfa.org/breed/maine-coon-cat/)、[Cats Protection 猫尾姿态](https://www.cats.org.uk/cats-blog/why-do-cats-have-tails)

新增三款源稿位于 `art/cat-shared/tails/CT02.aseprite` 至 `CT04.aseprite`。每份含 `idle`、`typing` 两帧，`tail` 是独立形状，`mackerel`、`classic`、`spotted` 分别保存三种尾纹。身体、头部、电脑和原尾遮罩是锁定参考层。打字帧采用现有原始动作坐标，由工作台与其他身体层共同对齐。

`public/assets/cat/hd/tails/` 中的形状 PNG 使用共用橘色阶，花纹 PNG 的红、绿、蓝通道分别对应三种尾纹。`src/cat-tail.ts` 按品种、毛色搭配与毛皮花纹上色。原尾遮罩沿右后腿外侧的描边分割，替换尾巴合成在身体、前爪和电脑后方。旧配置缺少尾巴字段时使用 `CT01`。


### 毛色搭配

猫配置中的 `palette` 对应品种底稿，`coat` 对应工作台的整套毛色。`src/cat.ts` 中每套搭配声明底毛、花纹和浅毛三个色值，工作台色卡和正面合成共用这组数据。原色直接读取现有底稿。

工作台选择品种时，使用该品种的整套预设覆盖外观选项，毛色搭配恢复 `native`，毛皮与额纹也恢复品种默认；不沿用之前选择的配色。之后仍可继续修改外观。姓名等档案信息和独立自定义笔迹分别保留，不属于品种外观重置范围。

`src/cat-coat.ts` 根据每种底稿的色阶换色，沿用虎斑、三花斑块或重点色的位置。待机和打字共用配色，打字的前爪和电脑边缘上的少量毛发也用同一套色阶。添加配色时沿用现有分层 PNG。

`src/cat-outline.ts` 为非原色搭配生成同色系描边，以花纹色推导深色线条；浅毛色的线条相应柔和，冷色毛发不再保留暖棕边。头部、当前耳型、身体、前爪与当前尾型分别使用原始橘猫图层识别线稿，再在毛色/毛纹合成后着色。不能按最终图像的深色像素全局替换，否则会误伤深毛、斑块或瞳孔。描边不改变 alpha、轮廓和位置，眼睛、鼻嘴、汗滴、配饰和电脑保留各自颜色，用户笔迹最后叠加。新增同坐标体系的品种和毛色可直接复用；改变轮廓时需要提供对应的线稿参考。

像素编辑源信息记录 `outlineVersion: adaptive`。缺少此字段的旧保存按 `original` 重建原底图，再提取真实编辑内容；无元数据 PNG 会匹配新旧两种描边。`coat: native` 在两种版本下逐像素一致。

### 毛皮花纹

`bodyPattern` 统一控制脸部毛皮、躯干、腿和尾巴，额头由 `pattern` 独立控制。`native` 保留品种原纹，`plain` 为无毛纹；细虎斑使用窄条和尾环，经典虎斑使用宽纹和侧腹涡纹，点状虎斑使用断开的斑点。这三种采用猫咪正面坐姿适合显示的局部纹路。 [CFA 猫毛色与花纹说明](https://cfa.org/coat-color-descriptions/)

`art/cat-shared/front-body-patterns.aseprite` 的每个标签对应一张身体或打字动作图层。`body_reference` 是锁定的对位参考，三种花纹各有独立图层。导出时，细虎斑、经典虎斑和点状虎斑分别写入红、绿、蓝通道。渲染器先用干净底毛替换旧纹，再按已选毛色给新纹着色。

对应的脸侧纹由 `head-patterns/face_patterns.png` 使用相同 RGB 通道约定提供。切到非原生毛纹时，面部与身体使用同一套底毛和花纹色；鼻嘴零件自带的背景毛色也随之处理，防止换纹后留下不同色的小补片。上述共用素材同时用于待机和三档打字，无需为每个品种或动作重复绘制。


### 新稿分层

工作台的动作素材以正面待机，以及慢敲键盘、比较快、特别快三档打字为维护范围。

| 分组 | Aseprite 图层 | 代码用途 |
| --- | --- | --- |
| 头部 | 干净头底、左耳、右耳、耳根遮罩、额纹、左右颊纹、胡须 | 统一头部原点，品种花色走独立色区，耳朵共享形状和配色 |
| 五官 | 眼白、瞳孔、虹膜遮罩、小高光、鼻子、嘴 | 单换瞳色、表情、鼻色或嘴形，眼神跟随只移动高光 |
| 身体 | 躯干、胸口花色、尾巴、左右前爪 | 动作帧复用静态躯干，按帧替换或移动前爪 |
| 配饰和道具 | 后层、前层、需要遮挡的独立片 | 用耳根、颈部或前爪锚点定位，按动作控制遮挡 |

源稿先把需要独立替换、移动或遮挡的部位拆开。各层用同尺寸透明画布和统一坐标导出。已经画进底稿的旧五官须先移出，并补齐下面的干净底色。共享骨架的新品种可以提供配色和花色遮罩，同组的外形与动作模板可以直接复用。外轮廓、比例或遮挡明显不同的品种需要自己的对应零件。

### 自定义笔迹

新存档的 `.source.json` 使用 `pixelEdits` 记录各部位的着色和擦除像素，PNG 用作缩略图。左右耳、左右前爪和尾巴使用各自的局部坐标，合成时按当前零件的轮廓对位；头脸、躯干、电脑和画布各有自己的笔迹层。待机时隐藏电脑笔迹，再进入打字时重新显示。旧存档继续按原格式加载，在像素编辑器重新保存时写入分层笔迹。两种格式都保存在用户的应用数据目录。

## 命名约定

- `<view>_<part>[_<id>][_<slot>].png`
  - `view`: `sit`、`walk`、`type`
  - `part`: `body`、`head`、`ears`、`ear_CE02`、`eye_Y05`、`mouth_CN02` 等
  - `slot`（柴犬遮罩）: `g`（主色）、`s`（阴影）、`l`（高光）、`w`/`d`（猫毛色）
- 虹膜遮罩统一为 `*_iris.png`，只保留 alpha，用于换瞳色。眼神跟随移动独立的小高光图层。
- 所有分层 PNG 的单帧必须与所在代际的画布尺寸一致：基础层 160×160，`cat/hd/` 为 320×320。多帧图集按导出脚本约定排列，`typing-reference/` 的动作与汗水图集为 320×3840。

## 新增一个猫零件

1. 在 `src/pet-assets.ts` 登记选项编号、源稿、导出方法和输出尺寸。只有改变接缝或遮挡时，才需要调整相应的合成规则。
2. 通过 `assets:export` 导出到审核目录，确认后更新运行时 PNG。
3. 运行 `assets:check`、构建与自检，核对组合、动作和旧存档。

## 参考图

`fixtures/` 里是柴犬 M1 的验收对照图，不属于运行时素材，可在 PR/评审时引用。柴犬的耳朵/嘴鼻代工说明见 `docs/SHIBA-NOTES.md`。
