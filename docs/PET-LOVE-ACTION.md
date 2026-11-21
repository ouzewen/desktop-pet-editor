# 猫咪双击爱心动作候选

[修前／修后连续对照](pet-love-revision/before-after.gif) · [修后全程逐帧](pet-love-revision/all-frames.png) · [品种与笔迹对照](pet-love-revision/verification-grid.png) · [验证与 SHA-256](pet-love-revision/verification.json)

从构建 43 源码 `7db9b2a` 制作。参照已确认的 LibTV 第二版 `v-P9b4oaP1Gl` 的动作顺序。实际素材来自 80×80 正面猫图层和新画的表情、爱心。

## 调用

先按现有流程加载猫图层。左键双击时记录单调时钟，之后每帧传入已经过的毫秒数。

```ts
const petLoveFrame = catPetLoveFrameAt(elapsedMs);
render(canvas, appearance, 'sit', idleFrame, gaze, { ...pose, petLoveFrame });
```

`catPetLoveFrameAt` 在 0–1439 ms 返回 0–29，达到 1440 ms 时返回 `undefined`，调用方继续普通待机。30 帧各 48 ms。第 1 帧眯眼，第 2 帧开始收肩胸，第 3 帧头脸起伏，第 5 帧耳朵开始向两侧压开。头脸的鼻位最多降低 7 格，上额与下巴位移较小，回升时肩胸稍晚复位。相邻原生帧的头脸主位移、肩胸参数和压耳参数每次最多改变一格。前爪和下半身用原来的位置，尾巴绕根部最大扫动 67°。两颗心错开上飘并淡出，距画布上沿至少 2 格。首帧和最后三帧与待机 0 逐像素相同。

分区笔迹跟随所属的头、肩胸或尾巴。旧式整图笔迹下保留静态尾巴，以保住旧的尾部笔迹。

## 源稿与导出

[80×80 Aseprite 源稿](../art/cat-pixel80/pet-love.aseprite) 有 30 帧、8 层。橘猫固定下半身与前爪、参与动作的肩胸、选定尾巴、低头脸部、压耳与额顶分别留作锁定的实装对照。独立的眯眼层和两颗心是正式透明图的导出源。运行时按当前猫配色渲染头、耳、鼻口、描边和尾部；Aseprite 里的橘猫对照层仅用于检视。闭眼线按眼周底毛决定深浅。

`npm run assets:export -- cat.pet-love` 从源稿导出 `eyes.png` 和 `hearts.png`。资产的逻辑坐标用 320×320 展开，原生像素为 4×4 同色块。爱心图集每格 140×92 逻辑像素，放置点 (144,0)，每行 6 格，共 5 行。正式桌面资产同步目录为 `desktop/assets-pixel80/cat/hd/pet-love/`。预览暂存命令 `node scripts/stage-cat-pixel80.mjs cat.pet-love` 走相同导出。

## 验证

用实际前视渲染器逐帧跑完橘猫、黑猫、三花、暹罗及折耳、圆耳、垂耳、卷耳组合，加一套带头、肩胸、前爪和尾巴分区笔迹的橘猫。9 套组合的脚底区域与待机逐像素相同。逐帧核对中央颈肩连续、无分离碎点、爱心至少预留一格空隙与头部隔开。独立浏览器实播按真实时钟访问 0–29 并返回待机。资产清单、Web 构建和桌面渲染包构建通过。双击监听和正式安装由集成流程处理。

[原 17 帧版本的验证记录](pet-love-evidence/verification.json)
