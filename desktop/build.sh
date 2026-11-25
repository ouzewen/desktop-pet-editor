#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

pixel80=0
for arg in "$@"; do
  if [ "$arg" = "--pixel80-preview" ]; then pixel80=1; fi
done

version="${DESKTOP_PET_VERSION:-$(tr -d '[:space:]' < VERSION)}"
build_number="${DESKTOP_PET_BUILD_NUMBER:-$(git rev-list --count HEAD 2>/dev/null || echo 1)}"
app_name="桌宠"
bundle_id="local.desktop-pet-editor.shiba"
build_mode="production"
default_build_dir="build/desktop"
if [[ "$pixel80" == 1 ]]; then
  app_name="桌宠 80 像素测试版"
  bundle_id="local.desktop-pet-editor.pixel80"
  build_mode="cat-pixel80"
  default_build_dir="build/desktop-pixel80"
fi
build_dir="${DESKTOP_PET_BUILD_DIR:-$default_build_dir}"
public_key="${DESKTOP_PET_UPDATE_PUBLIC_KEY:-}"
feed_url="${DESKTOP_PET_UPDATE_FEED_URL:-}"
update_access_file="${DESKTOP_PET_UPDATE_ACCESS_FILE:-}"
update_access=""
photo_local="${DESKTOP_PET_PHOTO_LOCAL:-false}"
default_photo_port=8778
if [[ "$photo_local" == true ]]; then default_photo_port=8783; fi
photo_backend_url="${DESKTOP_PET_PHOTO_BACKEND_URL:-http://127.0.0.1:$default_photo_port}"
feedback_url="${DESKTOP_PET_FEEDBACK_URL-https://wcnl1cadjlcs.feishuapp.com/app/app_17jcbsr3ja7/api/pet-feedback}"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ || ! "$build_number" =~ ^[1-9][0-9]*$ ]]; then
  echo 'Expected a three-part version and a positive integer build number.' >&2
  exit 1
fi
if [[ "$pixel80" == 1 && ( -n "$public_key" || -n "$feed_url" || -n "$update_access_file" ) ]]; then
  echo 'The 80 px test app uses its own app identity and does not accept update feeds.' >&2
  exit 1
fi
if [[ -n "$public_key" ]]; then
  if [[ ! "$public_key" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
    echo 'DESKTOP_PET_UPDATE_PUBLIC_KEY must be a base64 Sparkle EdDSA public key.' >&2
    exit 1
  fi
  if [[ -n "$update_access_file" ]]; then
    update_access="$(tr -d '[:space:]' < "$update_access_file")"
    if [[ ! "$update_access" =~ ^[a-f0-9]{64}$ || -z "$feed_url" ]]; then
      echo 'A private update build needs a 64-digit hex access code and an explicit feed URL.' >&2
      exit 1
    fi
  fi
  feed_url="${feed_url:-https://ouzewen.github.io/desktop-pet-editor/appcast.xml}"
  if [[ -n "$feed_url" && "$feed_url" != https://* && ! "$feed_url" =~ ^http://127\.0\.0\.1:[0-9]+/ ]]; then
    echo 'The Sparkle feed must use HTTPS or loopback HTTP for local testing.' >&2
    exit 1
  fi
elif [[ -n "$feed_url" || -n "$update_access_file" ]]; then
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
./node_modules/.bin/vite build --config desktop/vite.config.ts --mode "$build_mode" --outDir "$build_dir"

app="$build_dir/$app_name.app"
assets="$build_dir/assets"
if [ -e "$assets/cat/custom" ] || [ -L "$assets/cat/custom" ]; then
  printf '%s\n' 'Desktop asset staging contains private presets.' >&2
  exit 1
fi
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources" "$app/Contents/Frameworks"
# Reused output directories can contain resources packaged by older builds.
rm -rf "$app/Contents/Resources/assets/cat/custom" \
       "$app/Contents/Resources/ollama" "$app/Contents/Resources/model"
cp -R "$assets" "$app/Contents/Resources/"
cp -R "$build_dir/assets-pixel80" "$app/Contents/Resources/"
cp -R "$build_dir/assets-pixel80-v1" "$app/Contents/Resources/"
cp "$build_dir/pet.js" desktop/Resources/pet.html "$app/Contents/Resources/"
cp desktop/Resources/AppIcon.icns "$app/Contents/Resources/AppIcon.icns"
cp desktop/Resources/CatLetterEnvelope.png "$app/Contents/Resources/"
cp desktop/Resources/ArkPixel12.ttf "$app/Contents/Resources/ArkPixel12.ttf"
cp desktop/Resources/ArkPixel-OFL.txt "$app/Contents/Resources/ArkPixel-OFL.txt"
# Finder uses the localized display name when the base name matches the on-disk bundle name.
mkdir -p "$app/Contents/Resources/zh-Hans.lproj"
/usr/bin/plutil -convert binary1 -o "$app/Contents/Resources/zh-Hans.lproj/InfoPlist.strings" \
  desktop/Resources/zh-Hans.lproj/InfoPlist.strings

cat > "$app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>${bundle_id}</string>
<key>CFBundleName</key><string>${app_name}</string>
<key>CFBundleDisplayName</key><string>${app_name}</string>
<key>CFBundleDevelopmentRegion</key><string>zh-Hans</string>
<key>LSHasLocalizedDisplayName</key><true/>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>CFBundleExecutable</key><string>DesktopPet</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>${build_number}</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSMicrophoneUsageDescription</key><string>用于在你开始会议录音后记录麦克风声音。</string>
<key>NSAudioCaptureUsageDescription</key><string>用于在你开始会议录音后记录电脑播放的声音。</string>
<key>NSLocationUsageDescription</key><string>用于获取所在城市，给出穿衣与天气提醒。</string>
<key>NSDesktopFolderUsageDescription</key><string>用于处理你拖到桌宠上的单个桌面文件。</string>
<key>NSDownloadsFolderUsageDescription</key><string>用于处理你从下载文件夹拖到桌宠上的单个文件。</string>
<key>NSDocumentsFolderUsageDescription</key><string>用于处理你从文稿文件夹拖到桌宠上的单个文件。</string>
</dict></plist>
PLIST
plist="$app/Contents/Info.plist"
if [[ "$pixel80" == 1 ]]; then plutil -insert PetPixel80Preview -bool true "$plist"; fi
if [[ "$photo_local" == true ]]; then plutil -insert PetPhotoLocal -bool true "$plist"; fi
plutil -insert PetPhotoBackendURL -string "$photo_backend_url" "$plist"
if [[ -n "$feedback_url" ]]; then plutil -insert PetFeedbackURL -string "$feedback_url" "$plist"; fi
if [[ "$photo_backend_url" == http://127.0.0.1:* || "$photo_backend_url" == http://localhost:* || "$feed_url" == http://127.0.0.1:* || "$feedback_url" == http://127.0.0.1:* || "$feedback_url" == http://localhost:* ]]; then
  plutil -insert NSAppTransportSecurity -json '{"NSAllowsLocalNetworking":true}' "$plist"
fi
if [[ -n "$public_key" ]]; then
  if [[ -n "$feed_url" ]]; then plutil -insert SUFeedURL -string "$feed_url" "$plist"; fi
  if [[ -n "$update_access" ]]; then plutil -insert PetUpdateAccess -string "$update_access" "$plist"; fi
  plutil -insert SUPublicEDKey -string "$public_key" "$plist"
  # AppUpdates schedules the 9 AM check by local calendar time.
  plutil -insert SUEnableAutomaticChecks -bool NO "$plist"
  plutil -insert SUAllowsAutomaticUpdates -bool NO "$plist"
  plutil -insert SUVerifyUpdateBeforeExtraction -bool YES "$plist"
fi

swiftc -target "$(uname -m)-apple-macosx13.0" \
  desktop/Sources/main.swift \
  desktop/Sources/PetEdge.swift \
  desktop/Sources/PetSurface.swift \
  desktop/Sources/Workbench.swift \
  desktop/Sources/AccessoryShop.swift \
  desktop/Sources/WorkbenchGuide.swift \
  desktop/Sources/Feedback.swift \
  desktop/Sources/CatLetterDiary.swift \
  desktop/Sources/CatLetter.swift \
  desktop/Sources/TypingActivity.swift \
  desktop/Sources/Reminder.swift \
  desktop/Sources/Focus.swift \
  desktop/Sources/Weather.swift \
  desktop/Sources/Music.swift \
  desktop/Sources/Clipboard.swift \
  desktop/Sources/Translation.swift \
  desktop/Sources/MeetingCapture.swift \
  desktop/Sources/MeetingNotes.swift \
  desktop/Sources/MeetingRecorder.swift \
  desktop/Sources/Trash.swift \
  desktop/Sources/QuickBar.swift \
  desktop/Sources/FileActions.swift \
  desktop/Sources/PixelEditor.swift \
  desktop/Sources/CatPhotoClient.swift \
  desktop/Sources/CatPhotoFurEvidence.swift \
  desktop/Sources/PixelUI.swift \
  desktop/Sources/AppUpdates.swift \
  desktop/Sources/PrivateUpdateAccess.swift \
  -F "$sparkle_dir" -framework Sparkle \
  -Xlinker -rpath -Xlinker @executable_path/../Frameworks \
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
codesign "${sign_options[@]}" --entitlements desktop/Resources/DesktopPet.entitlements "$app"
codesign --verify --deep --strict "$app"
printf 'Built %s (v%s, build %s)\n' "$app" "$version" "$build_number"
