#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

version="$(tr -d '[:space:]' < VERSION)"
build_number="$(git rev-list --count HEAD 2>/dev/null || echo 1)"

npm run build
./node_modules/.bin/vite build --config desktop/vite.config.ts

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
</dict></plist>
PLIST

swiftc -target "$(uname -m)-apple-macosx13.0" \
  desktop/Sources/main.swift \
  desktop/Sources/Workbench.swift \
  desktop/Sources/Reminder.swift \
  desktop/Sources/PixelUI.swift \
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
