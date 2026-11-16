# Platform

平台能力层：窗口、剪贴板、音频、定位、选区、快捷键、文件、权限。

每个能力一个协议（如 `ClipboardPort`），macOS 实现留在本目录；
Windows 实现将来照同一协议补，业务层不感知平台差异。

约定见 `docs/PORTABILITY.md`。
