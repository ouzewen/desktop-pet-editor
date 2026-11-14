#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
./node_modules/.bin/vite build --config desktop/vite.config.ts
app="dist-desktop/柴犬桌宠.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
cp -R dist-desktop/assets "$app/Contents/Resources/"
cp dist-desktop/pet.js desktop/pet.html "$app/Contents/Resources/"
cat > "$app/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>local.desktop-pet-editor.shiba</string>
<key>CFBundleName</key><string>柴犬桌宠</string>
<key>CFBundleExecutable</key><string>ShibaPet</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>LSUIElement</key><true/>
</dict></plist>
PLIST
swiftc -target "$(uname -m)-apple-macosx13.0" desktop/Pet.swift -o "$app/Contents/MacOS/ShibaPet"
codesign --force --sign - "$app"
printf 'Built %s\n' "$app"
