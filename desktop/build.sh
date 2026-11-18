#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

with_model=0
with_runtime=0
for arg in "$@"; do
  if [ "$arg" = "--with-model" ]; then with_model=1; with_runtime=1; fi
  if [ "$arg" = "--with-runtime" ]; then with_runtime=1; fi
done

version="${DESKTOP_PET_VERSION:-$(tr -d '[:space:]' < VERSION)}"
build_number="${DESKTOP_PET_BUILD_NUMBER:-$(git rev-list --count HEAD 2>/dev/null || echo 1)}"
build_dir="${DESKTOP_PET_BUILD_DIR:-build/desktop}"
public_key="${DESKTOP_PET_UPDATE_PUBLIC_KEY:-}"
feed_url="${DESKTOP_PET_UPDATE_FEED_URL:-}"
photo_local="${DESKTOP_PET_PHOTO_LOCAL:-false}"
default_photo_port=8778
if [[ "$photo_local" == true ]]; then default_photo_port=8783; fi
photo_backend_url="${DESKTOP_PET_PHOTO_BACKEND_URL:-http://127.0.0.1:$default_photo_port}"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ || ! "$build_number" =~ ^[1-9][0-9]*$ ]]; then
  echo 'Expected a three-part version and a positive integer build number.' >&2
  exit 1
fi
if [[ -n "$public_key" ]]; then
  if [[ ! "$public_key" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
    echo 'DESKTOP_PET_UPDATE_PUBLIC_KEY must be a base64 Sparkle EdDSA public key.' >&2
    exit 1
  fi
  feed_url="${feed_url:-https://ouzewen.github.io/desktop-pet-editor/appcast.xml}"
  if [[ "$feed_url" != https://* && ! "$feed_url" =~ ^http://127\.0\.0\.1:[0-9]+/ ]]; then
    echo 'The Sparkle feed must use HTTPS or loopback HTTP for local testing.' >&2
    exit 1
  fi
elif [[ -n "$feed_url" ]]; then
  echo 'An update feed requires DESKTOP_PET_UPDATE_PUBLIC_KEY.' >&2
  exit 1
fi

sparkle_version=2.10.1
sparkle_sha256=1a856d2a9edb8e628de88121d7be04cf0e2167f8641650b78fca00b14244cf27
sparkle_dir="build/dependencies/sparkle-$sparkle_version"
if [[ ! -x "$sparkle_dir/bin/sign_update" ]]; then
  mkdir -p build/dependencies
  staging="$(mktemp -d build/dependencies/sparkle.XXXXXX)"
  trap 'rm -rf "$staging"' EXIT
  archive="$staging/Sparkle.tar.xz"
  curl --fail --silent --show-error --location --retry 2 \
    "https://github.com/sparkle-project/Sparkle/releases/download/$sparkle_version/Sparkle-$sparkle_version.tar.xz" \
    -o "$archive"
  printf '%s  %s\n' "$sparkle_sha256" "$archive" | shasum -a 256 -c -
  mkdir "$staging/sparkle-$sparkle_version"
  tar -xf "$archive" -C "$staging/sparkle-$sparkle_version" ./Sparkle.framework ./bin
  # Rename atomically so other builds never use a partially extracted dependency.
  mv -n "$staging/sparkle-$sparkle_version" build/dependencies/
fi

if [ "${SKIP_NPM_BUILD:-0}" != "1" ]; then
  npm run build
fi
# The renderer and native workbench share a bridge. Rebuild the renderer
# even on quick builds so the executable and its bundled API stay in sync.
./node_modules/.bin/vite build --config desktop/vite.config.ts --outDir "$build_dir"

app="$build_dir/桌宠.app"
assets="$build_dir/assets"
if [ -e "$assets/cat/custom" ] || [ -L "$assets/cat/custom" ]; then
  printf '%s\n' 'Desktop asset staging contains private presets.' >&2
  exit 1
fi
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources" "$app/Contents/Frameworks"
rm -rf "$app/Contents/Resources/assets/cat/custom"
cp -R "$assets" "$app/Contents/Resources/"
cp "$build_dir/pet.js" desktop/Resources/pet.html "$app/Contents/Resources/"
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
<key>NSDesktopFolderUsageDescription</key><string>用于预览并整理桌面上由你确认的文件。</string>
<key>NSDownloadsFolderUsageDescription</key><string>用于预览并整理你选定的下载文件夹。</string>
<key>NSDocumentsFolderUsageDescription</key><string>用于预览并整理你选定的文稿文件夹。</string>
</dict></plist>
PLIST
plist="$app/Contents/Info.plist"
if [[ "$photo_local" == true ]]; then plutil -insert PetPhotoLocal -bool true "$plist"; fi
plutil -insert PetPhotoBackendURL -string "$photo_backend_url" "$plist"
if [[ "$photo_backend_url" == http://127.0.0.1:* || "$photo_backend_url" == http://localhost:* || "$feed_url" == http://127.0.0.1:* ]]; then
  plutil -insert NSAppTransportSecurity -json '{"NSAllowsLocalNetworking":true}' "$plist"
fi
if [[ -n "$feed_url" ]]; then
  plutil -insert SUFeedURL -string "$feed_url" "$plist"
  plutil -insert SUPublicEDKey -string "$public_key" "$plist"
  plutil -insert SUEnableAutomaticChecks -bool YES "$plist"
  plutil -insert SUAllowsAutomaticUpdates -bool NO "$plist"
  plutil -insert SUVerifyUpdateBeforeExtraction -bool YES "$plist"
fi

if [ "$with_runtime" = "1" ]; then
  runtime_dir="${OLLAMA_RUNTIME_DIR:-$HOME/ollama-cli}"
  rm -rf "$app/Contents/Resources/ollama"
  mkdir -p "$app/Contents/Resources/ollama"
  cp -R "$runtime_dir"/. "$app/Contents/Resources/ollama/"
  printf 'Bundled Ollama runtime\n'
else
  printf 'Note: 可用 --with-runtime 内置本地运行时，或连接本机 Ollama。\n'
fi
if [ "$with_model" = "1" ]; then
  model_file="${PET_MODEL_GGUF:-/tmp/qwen2.5-1.5b-instruct-q4_k_m.gguf}"
  rm -rf "$app/Contents/Resources/model"
  mkdir -p "$app/Contents/Resources/model"
  cp "$model_file" "$app/Contents/Resources/model/"
  printf 'Bundled local model: %s\n' "$(basename "$model_file")"
fi

swiftc -target "$(uname -m)-apple-macosx13.0" \
  desktop/Sources/main.swift \
  desktop/Sources/PetEdge.swift \
  desktop/Sources/PetSurface.swift \
  desktop/Sources/Workbench.swift \
  desktop/Sources/TypingActivity.swift \
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
  desktop/Sources/FileOrganizer.swift \
  desktop/Sources/FileOrganizerWindow.swift \
  desktop/Sources/PixelEditor.swift \
  desktop/Sources/CatPhotoClient.swift \
  desktop/Sources/CatPhotoFurEvidence.swift \
  desktop/Sources/PixelUI.swift \
  desktop/Sources/AppUpdates.swift \
  -F "$sparkle_dir" -framework Sparkle \
  -Xlinker -rpath -Xlinker @executable_path/../Frameworks \
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
sparkle="$app/Contents/Frameworks/Sparkle.framework"
rm -rf "$sparkle"
ditto "$sparkle_dir/Sparkle.framework" "$sparkle"
sign_options=(--force --sign "$sign_identity")
if [[ "$sign_identity" != "-" ]] &&
  security find-identity -v -p codesigning | awk -v identity="$sign_identity" \
    'index($0, "Developer ID Application:") && index($0, identity) { found=1 } END { exit !found }'; then
  sign_options+=(--options runtime --timestamp)
fi
sparkle_helpers="$sparkle/Versions/B"
codesign "${sign_options[@]}" "$sparkle_helpers/XPCServices/Installer.xpc"
codesign "${sign_options[@]}" --preserve-metadata=entitlements "$sparkle_helpers/XPCServices/Downloader.xpc"
codesign "${sign_options[@]}" "$sparkle_helpers/Autoupdate"
codesign "${sign_options[@]}" "$sparkle_helpers/Updater.app"
codesign "${sign_options[@]}" "$sparkle"
codesign "${sign_options[@]}" "$app"
codesign --verify --deep --strict "$app"
printf 'Built %s (v%s, build %s)\n' "$app" "$version" "$build_number"
