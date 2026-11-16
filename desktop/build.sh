#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

with_model=0
for arg in "$@"; do
  if [ "$arg" = "--with-model" ]; then with_model=1; fi
done

version="$(tr -d '[:space:]' < VERSION)"
build_number="$(git rev-list --count HEAD 2>/dev/null || echo 1)"

if [ "${SKIP_NPM_BUILD:-0}" != "1" ]; then
  npm run build
  ./node_modules/.bin/vite build --config desktop/vite.config.ts
fi

app="build/desktop/桌宠.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
cp -R build/desktop/assets "$app/Contents/Resources/"
cp build/desktop/pet.js desktop/Resources/pet.html "$app/Contents/Resources/"
cp desktop/Resources/AppIcon.icns "$app/Contents/Resources/AppIcon.icns"
cp desktop/Resources/ArkPixel12.ttf "$app/Contents/Resources/ArkPixel12.ttf"
cp desktop/Resources/ArkPixel-OFL.txt "$app/Contents/Resources/ArkPixel-OFL.txt"

cat > "$app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>local.desktop-pet-editor.shiba</string>
<key>CFBundleName</key><string>桌宠</string>
<key>CFBundleDisplayName</key><string>桌宠</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>CFBundleExecutable</key><string>DesktopPet</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>${build_number}</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSLocationUsageDescription</key><string>用于获取所在城市，给出穿衣与天气提醒。</string>
</dict></plist>
PLIST

if [ "$with_model" = "0" ]; then
  printf 'Note: 这个构建不含本地模型，加 --with-model 生成完整版\n'
fi

if [ "$with_model" = "1" ]; then
  runtime_dir="${OLLAMA_RUNTIME_DIR:-$HOME/ollama-cli}"
  model_file="${PET_MODEL_GGUF:-/tmp/qwen2.5-1.5b-instruct-q4_k_m.gguf}"
  rm -rf "$app/Contents/Resources/ollama" "$app/Contents/Resources/model"
  mkdir -p "$app/Contents/Resources/ollama" "$app/Contents/Resources/model"
  cp -R "$runtime_dir"/. "$app/Contents/Resources/ollama/"
  cp "$model_file" "$app/Contents/Resources/model/"
  printf 'Bundled local model: %s\n' "$(basename "$model_file")"
fi

swiftc -target "$(uname -m)-apple-macosx13.0" \
  desktop/Sources/main.swift \
  desktop/Sources/Workbench.swift \
  desktop/Sources/Reminder.swift \
  desktop/Sources/Focus.swift \
  desktop/Sources/Weather.swift \
  desktop/Sources/Music.swift \
  desktop/Sources/Clipboard.swift \
  desktop/Sources/Translation.swift \
  desktop/Sources/Chat.swift \
  desktop/Sources/LocalRuntime.swift \
  desktop/Sources/Trash.swift \
  desktop/Sources/QuickBar.swift \
  desktop/Sources/FileActions.swift \
  desktop/Sources/PixelEditor.swift \
  desktop/Sources/PixelUI.swift \
  -lsqlite3 \
  -o "$app/Contents/MacOS/DesktopPet"

sign_identity="${DESKTOP_PET_SIGN_IDENTITY:-}"
if [ -z "$sign_identity" ]; then
  sign_identity=$(security find-identity -v -p codesigning |
    awk '/"Desktop Pet Local Signing"$/ { if (!identity) identity = $2 } END { print identity }')
fi
if [ -z "$sign_identity" ]; then
  sign_identity=-
  printf '%s\n' 'Ad hoc signing: macOS may require Input Monitoring authorization again after updates.' >&2
fi
codesign --force --sign "$sign_identity" "$app"
printf 'Built %s (v%s, build %s)\n' "$app" "$version" "$build_number"
