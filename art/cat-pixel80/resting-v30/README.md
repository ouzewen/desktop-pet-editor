# 正面 80×80 底稿 v30

本版原色待机由 v29 原画、已确认的身体 / 下巴阴影和两处前腿落点组成。源稿保留原有图层。五只共用三花躯干的索引稿位于 [shared-calico-body](../shared-calico-body/body-index.aseprite)，配色见 `src/cat-calico-body-palette.json`。共用身体从 y44 开始，五只的下巴在 y39–43，因此也可逐区核对合成。狸花不在共用身体组，使用单独确认的三阶段下巴源稿，含旧暗带补色及两阶阴影。

用 `npm run assets:export -- cat.body-outline.resting-v30.<品种 ID>` 导出单只待机，`cat.body-outline.shared-calico` 导出索引躯干，`cat.body-outline.chin-shading` 导出共用下巴遮罩。桌面素材镜像分别位于 `desktop/assets-pixel80/cat/resting-v30`、`shared-calico-body` 和 `chin-shading`。

原色待机直接显示已核准的合成。现役分层渲染使用同一躯干色位，活动前爪独立上色，电脑继续遮挡相应身体区域。替代花色的下巴与前腿取当前毛色，历史编辑底稿按各自的版本还原。
