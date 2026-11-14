# 宠物形象编辑器 · G2a 柴犬正面样板

本次审核使用 M1 柴犬预设 `preset_m1_12`。正面坐姿按 160 px 原画逐格描摹，按身体、头、耳朵、眼睛、嘴鼻和尾巴拆成独立 PNG。运行时由 Canvas 按层合成，换色只覆盖三种毛色槽位的 PNG 遮罩。

## 本地运行

需要 Node.js 22.12+ 或 24。

```sh
npm ci
npm run dev
```

打开终端里的本地地址。默认显示柴犬。可用 `npm run build` 做生产构建，或用 `npm run preview` 预览构建结果。

## 给 Muse 的验收材料

- [柴犬整犬对照](fixtures/m1-shiba-variants.png)包含 E03、E04、N02、N03 和 C05、C06 换色。
- [主锚点原画](fixtures/m1-shiba-front-160.png)和[默认柴犬导出](fixtures/pet-1x.png)均为 160 px。
- [柴犬预设文件](public/assets/presets/preset_m1_12.json)和[图层目录](public/assets/)。

在「换细节」下逐件切换 E03、E04、N02、N03，每次用整犬检查耳根、脸颊和下巴。切到 C06 灰白检查毛色，再切到 C05 奶油白检查白胸的对比度。

E03 与 E04 由 ImageGen 先生成完整正面柴犬，再从候选提取耳朵、对齐像素网格并限制到 C01 毛色和描边。短垂耳到下巴附近，长垂耳到肩部。N02 与 N03 按原画尺寸用像素绘制。旧版配置导入时，花纹字段统一归为 P00。柴犬的眉斑、白颊与额线已并入头底座。

Chrome 验证了四款换件、C06 下四种耳型的整犬毛色、旧配置导入与导出。C01 默认柴犬与改前的实际合成逐像素一致。四款新零件均为 160 × 160 RGBA，alpha 只有 0 和 255。TypeScript 检查与 Vite 生产构建通过。
