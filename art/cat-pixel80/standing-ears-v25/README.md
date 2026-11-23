# CE01 三角立耳 · pixel80-v25

以正式 build70 的 `0c717f0` 为基准。十二份分层稿是已确认的默认原色待机，旧的 30 色待机源稿和旧版编辑器底稿仍保留。每侧内耳共 24 格，主色 18 格、阴影 6 格，右侧以 `x = 75 - 左侧 x` 镜像。坐标用画面方向，遮罩约定见 [CE01-mask-spec.json](CE01-mask-spec.json)。

- 使用 `npm run assets:export -- cat.ear-retouch.CE01-masks` 导出左右共用遮罩。
- 使用 `npm run assets:export -- cat.ear-retouch.CE01-<ID>` 导出该品种的默认待机合成。桌面素材镜像位于 `desktop/assets-pixel80/cat/standing-ears-v25`。
- 分层渲染只对当前形状为 CE01 的一侧使用遮罩。去除旧内耳边色和耳根重线时，从当前头部的同侧像素取色。恢复坐标和主、暗色见 `src/cat-standing-ear-plan.ts`。
- 新像素底稿使用 `pixel80-v25`。历史底稿继续使用原版本，v23 和 v24 留作独立候选后续集成。
