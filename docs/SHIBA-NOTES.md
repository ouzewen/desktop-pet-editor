# 柴犬 M1 素材说明（历史）

M1 柴犬按 160 px 正面原画逐格拆成身体、头、耳朵、眼睛、嘴鼻和尾巴独立 PNG，运行时由 Canvas 分层合成。

- E03（垂耳）与 E04（长垂耳）由 ImageGen 生成完整正面柴犬后提取耳朵、对齐像素网格，并限制到 C01 毛色与描边。
- N02（方嘴）与 N03（圆嘴）按原画尺寸用像素绘制。
- E03 / E04 / N02 / N03 均为 160×160 RGBA，alpha 只有 0 和 255。
- 柴犬的眉斑、白颊与额线已并入头底座。
- 工作台当前只展示猫；柴犬相关代码、自检和素材继续保留，恢复入口时可直接复用。

## 历史文件位置

- `public/assets/frames/` 存放身体和头部图层。
- `public/assets/masks/` 存放换色遮罩，`g`、`s`、`l` 分别对应主色、阴影、高光。
- `public/assets/motion/` 存放动作图层，`public/assets/parts/` 存放耳朵、嘴、尾巴、眼睛和花纹零件。
- 配色为 `public/assets/palettes/C01.json`，预设为 `public/assets/presets/preset_m1_12.json`。
- 验收对照图在 `fixtures/`。
