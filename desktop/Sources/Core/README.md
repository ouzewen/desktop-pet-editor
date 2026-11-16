# Core

纯逻辑层：状态机、规则、解析、提示词、时间计算。

硬性要求：**不 import AppKit / SwiftUI / WebKit**，不触碰系统能力。
新增功能时，先看这里能不能放下它的判断逻辑。

约定见 `docs/PORTABILITY.md`。
