# 十二只猫的构建 84 组件配方

这套 80×80 源稿以构建 84（`12cf694`）的原色待机为基准。每只猫有 42 个可寻址部件层，以及隐藏并锁定的原稿。方向一律按画面左、右，坐标原点在画面左上角，配方按由后到前的顺序叠放。正面锚点、范围、颜色角色、所用遮罩和来源见 [catalog.json](catalog.json)，运行导出读取 [recipes.lua](recipes.lua)。

| 种类 | 编辑位置 | 影响范围 |
| --- | --- | --- |
| 单品种局部 | 对应品种的 `.aseprite`。额纹用 `head.forehead`，左右颊纹用 `head.cheek.left/right`，下巴用 `head.chin`，胸侧浅毛用 `body.pale`，身体花纹用 `body.coat`。 | 原色待机与采用同一静态底图的三档打字。原花色换耳、眼、鼻或嘴时，配方会传递其它未被换件覆盖的改动。 |
| 共用立耳内耳形状 | `shared.aseprite` 中四个 `ear.CE01.lining.<left/right>.<main/shadow>` 层。画布位置沿用左右耳对齐区域，主色和阴影分开。 | 同一遮罩直接用于十二只原色的 PNG、分层换件和三档打字。在单侧换成其它耳型时，仅立耳侧沿用 CE01。 |
| 单只猫的内耳颜色 | 每只 `.aseprite` 的 `ear.<side>.liner.main/shadow`。每层保留一个不透明色。 | 配方读这些层的颜色，在共用遮罩上绘制。可给左右不同色；工作台显式内耳色继续走原选件和阴影色差。 |
| 鼻嘴、眼、高光、尾和四爪 | 同一品种源稿的 `face.*`、`eye.<side>.*`、`tail.CT05` 和 `paw.<front/rear>.<side>.*`。 | 原色配方独立分层。已有选件和动作继续使用自己的姿势、表情、遮挡和动画帧。共用图里的眼、鼻、嘴、尾、爪遮罩目前用作几何参考与导出校验。 |
| 源稿试换件 | `variants.aseprite` 存橘猫画面右侧 CE04 试装件。 | 供 Aseprite 导出回归。原生工作台的换耳、眼、鼻走现有入口，不读取试稿作为选项。 |

## 如何按部位修改和查询引用

1. 按上表打开单只源稿或共用源稿，只改对应层。内耳轮廓移动时，退出格会露出本只外耳底毛，主色和阴影必须留在同侧耳内，且不能重叠。修改共享几何以后，若需让四个色层在编辑器里看起来也同步，可以刷新各只有色预览；预览层的格子位置不参与共用遮罩导出。
2. 在仓库根目录执行下面的命令，重新生成桌面和网页两份缓存。桌面缓存包含每只原色的 `*-stock.png`、仅标记本轮相对基准发生变化的 `*-native-edit-mask.png`、每只耳色表和左右共用内耳遮罩。缓存 PNG 由源稿导出，直接改 PNG 不会更新源稿。
3. 用目录查哪些品种引用同一形状。例如运行 `jq -r '.cats | to_entries[] | select(any(.value.parts[]; .sharedGuide=="ear.CE01.lining.left.main")) | .key' art/cat-pixel80/component-recipes84/catalog.json`。条目的 `geometryMode` 区分由共用形状生成、按共用指南对齐和品种专属三种情况。
4. 局部美术变化仍应在 80×80 原尺寸核对。涉及原色描边、花纹与前爪时，对照待机和打字抬落帧。涉及眼鼻嘴时，额外核对相邻的替换件、眨眼和表情，避免颜色或形状跨进独立部件。换其它毛色、尾型、躯干纹样、照片笔迹时使用各自已有的配方和保护规则。

```sh
# ASEPRITE_BIN 指向本机 Aseprite 可执行文件
npm run assets:export -- cat.component-recipes --out desktop/assets-pixel80
npm run assets:export -- cat.component-recipes
npm run assets:check
```

## 遮挡和兼容

- 躯干挡住尾根，后爪位于身体外侧，前爪覆在躯干前。配方登记四爪坐姿锚点，并保留实际用于活动爪取色的左右前爪采样位置。打字仍用现有三档的活动爪、电脑前后层和特效，保持自己的嘴形与节拍。
- 眼缘、瞳色和高光分别分侧。鼻锚点为 (37,30)，嘴和人中从 (37,32) 开始。关闭部件后露出的底毛从历史头层和现有色盘补齐。胸肩、斑块和各只外耳的局部色位保留原有差异。
- `pixel80-v41` 是品种花色配方入口。构建 84 的 `pixel80-v39` 与十二只初次分层的 `pixel80-v40` 继续按原合成规则回读。以后若已发布版本的默认图有可见改动，发新 artVersion 并保留旧重建基准，避免把新版画法误判为用户笔迹。

## 品种的两张替代花色卡

工作台读取 `catCoatCards` 中同品种的两个替代花色，从同一品种的 42 层源稿生成，沿用 `cat.ts` 中的毛色、纹样色和浅毛色三档。生成的 `*-coat-roles.png` 登记描边、固定五官与可换件的可见占位，运行时按这些占位着色。眼、鼻、内耳仍保留各自的默认色，唇线和结构线按花色色盘变化。没有单独维护的变体整猫源稿。

额纹、身体或前爪需要局部修订时，照上面的步骤只改对应的 Aseprite 图层并重导。卡片和选中待机读同一结果，三档打字共用其底图和前爪取色。动作换嘴时，`*-mouth-backing.png` 用源稿底毛补露出的格子，动作嘴与电脑仍按原来的帧绘制。选其它耳、尾、眼鼻嘴或配饰时，选件只接管自身占位；另外选择身体纹样、自由配色或照片笔迹时，继续使用各自的分层入口。

## 三花和淡三花的胸爪接缝

`pixel80-v42` 才会叠放胸爪补片。通白来自 `calico.aseprite` 和 `CC12.aseprite` 的 `body.pale`、前爪毛色及外侧爪上缘层。旧参考和 v40/v41 运行 PNG 保留原色。胸口和爪上沿从两份源稿导出独立补片，两只原色和各自的替代花色共用这处变化。脚底阴影仍由原爪层提供。

局部定稿后用 `cat.component-recipes.chest-white` 分别导出桌面和网页资源。常规 `cat.component-recipes` 导出会保留这两只的旧版原色底稿。Aseprite 严格核验允许两只在 y61–65 把原灰带换成品种白，仍锁定整猫透明轮廓。

## 独立耳型和额纹

`pixel80-v43` 的换耳沿用现有左右耳型组件和所有权遮罩。合成仅替换已改侧的立耳与所选耳型像素范围。原色和内置替代花色以品种配方为头部底稿，保护从 `head.forehead` 导出的额纹层；手动选额纹时使用对应额纹素材的实际像素范围。“无额纹”保留干净头冠。耳尖、外缘和耳根搭接仍由选中耳型控制。

若修订额纹源层，除了常规组件导出，还要将 `cat.component-recipes.forehead-lock` 导出到桌面及网页素材目录。v39–v41 的旧存档继续使用相应的合成规则。v42 和 v43 分别保留两项候选的独立历史底稿。

从 `pixel80-v44` 起，工作台的 NO05～NO08 共用 [80×80 鼻型源稿](../centered-noses.aseprite)。每款各占一个独立层，鼻尖与嘴层的单格人中对准 x37。用 `npm run assets:export -- cat.centered-noses` 和 `npm run assets:export -- cat.centered-noses --out desktop/assets-pixel80` 分别重导 Web 与原生素材。如果改了鼻尖的行号，同步更新 `centeredNoseTips`。默认原色的小方鼻继续继承配方中已批准的色值和三格形状，圆角鼻 NO02 与 v39～v41 历史形状读原素材。

## 验证

不带 `preview` 的 Aseprite 检查会比对源稿直接合成、配方合成和冻结的正式 PNG，验证 30 色上限、遮罩、换件范围和关闭部件后的底毛。它还在内存的临时遮罩副本里加一格，验证十二只都只改同一格，再恢复并重比。可用 `--script-param preview=1` 查看尚未批准的美术编辑，不覆盖正式对照。

```sh
mkdir -p output/components84/all-export
aseprite -b \
  --script-param root="$PWD/art/cat-pixel80/component-recipes84" \
  --script-param output="$PWD/output/components84/all-export" \
  --script scripts/export-cat-component-recipes.lua
```

| 品种 ID | 可见 RGB | 与构建 84 原色待机 RGBA 差异 |
| --- | ---: | ---: |
| black | 21 | 0 |
| CC09 | 23 | 0 |
| orange | 29 | 0 |
| british_blue | 29 | 0 |
| american_shorthair | 25 | 0 |
| CC11 | 28 | 0 |
| siamese | 26 | 0 |
| ragdoll | 28 | 0 |
| li_hua | 30 | 0 |
| CC10 | 29 | 0 |
| calico | 28 | 0 |
| CC12 | 28 | 0 |
