#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
./node_modules/.bin/vite build --config desktop/vite.config.ts
app="dist-desktop/桌宠.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
cp -R dist-desktop/assets "$app/Contents/Resources/"
cp dist-desktop/pet.js desktop/pet.html "$app/Contents/Resources/"
cp desktop/AppIcon.icns "$app/Contents/Resources/AppIcon.icns"
cat > "$app/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>local.desktop-pet-editor.shiba</string>
<key>CFBundleName</key><string>桌宠</string>
<key>CFBundleDisplayName</key><string>桌宠</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>CFBundleExecutable</key><string>DesktopPet</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
</dict></plist>
PLIST
swiftc -target "$(uname -m)-apple-macosx13.0" desktop/main.swift desktop/Workbench.swift desktop/Reminder.swift -o "$app/Contents/MacOS/DesktopPet"
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
printf 'Built %s\n' "$app"
