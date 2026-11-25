#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

usage() {
  cat <<'EOF'
Usage: scripts/release-update.sh VERSION BUILD_NUMBER [--publish-test]

Build, notarize, and sign a Sparkle update for Apple silicon.
Set DESKTOP_PET_SIGN_IDENTITY to a Developer ID Application name or SHA-1.
Set DESKTOP_PET_UPDATE_FEED_URL to the approved public appcast URL.
The notarization Keychain profile defaults to desktop-pet-notary.
Use --publish-test to upload a prerelease and then update the appcast.
EOF
}

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

if [[ "${1:-}" == --help ]]; then usage; exit 0; fi
if (( $# < 2 || $# > 3 )) || [[ -n "${3:-}" && "$3" != --publish-test ]]; then
  usage >&2
  exit 1
fi

version="$1"
build="$2"
publish="${3:-}"
[[ "$version" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ && "$build" =~ ^[1-9][0-9]{0,11}$ ]] ||
  die 'Use a three-part version and a positive integer build number.'
[[ "$(uname -m)" == arm64 ]] || die 'Run this release on Apple silicon.'

repo=ouzewen/desktop-pet-editor
branch=codex/update-feed
feed_path=docs/appcast.xml
feed_api="repos/$repo/contents/$feed_path"
raw_url="https://raw.githubusercontent.com/$repo/refs/heads/$branch/$feed_path"
pages_url=https://ouzewen.github.io/desktop-pet-editor/appcast.xml
feed_url="${DESKTOP_PET_UPDATE_FEED_URL:-}"
[[ "$feed_url" == "$raw_url" || "$feed_url" == "$pages_url" ]] ||
  die 'Set DESKTOP_PET_UPDATE_FEED_URL to this repository’s public Pages or raw appcast URL.'

identity="${DESKTOP_PET_SIGN_IDENTITY:-}"
[[ -n "$identity" ]] || die 'Set DESKTOP_PET_SIGN_IDENTITY to the Developer ID Application identity.'
security find-identity -v -p codesigning |
  awk -v identity="$identity" '
    /"Developer ID Application:/ {
      name = substr($0,index($0,"\"") + 1)
      sub(/"$/, "", name)
      if ($2 == identity || name == identity) found = 1
    }
    END { exit !found }
  ' || die 'The specified Developer ID Application identity is unavailable.'

profile="${DESKTOP_PET_NOTARY_PROFILE:-desktop-pet-notary}"
xcrun notarytool history --keychain-profile "$profile" >/dev/null

sparkle=build/dependencies/sparkle-2.10.1/bin
[[ -x "$sparkle/sign_update" ]] || die 'Run desktop/build.sh once to retrieve Sparkle tools.'
public_key="$("$sparkle/generate_keys" --account desktop-pet-editor -p)"
[[ "$public_key" =~ ^[A-Za-z0-9+/]{43}=$ ]] || die 'Could not read the existing Sparkle public key.'
# SHA-256 of the public key shipped in 0.3.6. Keep the existing signing identity
# even on machines where the original release bundle is unavailable.
baseline_key_hash=eb5bd9e09385a259e07f424f13387ee3d05842cef570ade17c51150ae34c5e1a
key_hash="$(printf %s "$public_key" | shasum -a 256 | awk '{print $1}')"
[[ "$key_hash" == "$baseline_key_hash" ]] || die 'The Keychain public key differs from the 0.3.6 release.'

tag="v$version"
zip_name="DesktopPet-$tag-macos-arm64.zip"
release_url="https://github.com/$repo/releases/download/$tag/$zip_name"
output="$(mktemp -d "$PWD/build/release-$tag.XXXXXX")"
previous_feed="$output/previous.xml"
if [[ -n "$publish" ]]; then
  command -v gh >/dev/null || die 'Publishing requires an authenticated GitHub CLI.'
  [[ "$(gh api "repos/$repo" --jq .visibility)" == public ]] || die 'The release repository must be public.'
  source_commit="$(git rev-parse HEAD)"
  [[ -z "$(git status --porcelain)" ]] || die 'Commit the release source before publishing.'
  gh api "repos/$repo/commits/$source_commit" --silent
  gh api --method GET "$feed_api" -f ref="$branch" > "$output/feed-response.json"
  jq -r '.content' "$output/feed-response.json" | base64 -D > "$previous_feed"
  feed_sha="$(jq -er .sha "$output/feed-response.json")"
  curl --fail --silent --show-error --location --max-time 30 "$feed_url" -o "$output/public.xml"
  xmllint --noout "$output/public.xml"
else
  curl --fail --silent --show-error --location --max-time 30 "$feed_url" -o "$previous_feed"
fi

python3 - "$previous_feed" "$version" "$build" <<'PY'
import sys
import xml.etree.ElementTree as ET

path, version, build = sys.argv[1:]
sparkle = "{http://www.andymatuschak.org/xml-namespaces/sparkle}"
channel = ET.parse(path).getroot().find("channel")
if channel is None:
    sys.exit("The published appcast is missing its RSS channel.")
new_version = tuple(map(int, version.split(".")))
if new_version <= (0, 3, 6) or int(build) <= 33:
    sys.exit("The release must advance beyond version 0.3.6, build 33.")
for item in channel.findall("item"):
    enclosure = item.find("enclosure")
    for field, new_value, parse in (
        ("version", int(build), int),
        ("shortVersionString", new_version, lambda value: tuple(map(int, value.split(".")))),
    ):
        for container in (item, enclosure):
            if container is None:
                continue
            old = container.findtext(sparkle + field) or container.get(sparkle + field)
            if old is not None and new_value <= parse(old):
                sys.exit("Both release numbers must exceed the previous appcast entry.")
PY

DESKTOP_PET_VERSION="$version" DESKTOP_PET_BUILD_NUMBER="$build" \
  DESKTOP_PET_BUILD_DIR="$output" DESKTOP_PET_UPDATE_ACCESS_FILE= \
  DESKTOP_PET_UPDATE_PUBLIC_KEY="$public_key" DESKTOP_PET_UPDATE_FEED_URL="$feed_url" \
  DESKTOP_PET_SIGN_IDENTITY="$identity" ./desktop/build.sh

app="$output/桌宠.app"
plist="$app/Contents/Info.plist"
for key in CFBundleShortVersionString CFBundleVersion SUFeedURL SUPublicEDKey SUVerifyUpdateBeforeExtraction; do
  case "$key" in
    CFBundleShortVersionString) expected="$version" ;;
    CFBundleVersion) expected="$build" ;;
    SUFeedURL) expected="$feed_url" ;;
    SUPublicEDKey) expected="$public_key" ;;
    SUVerifyUpdateBeforeExtraction) expected=true ;;
  esac
  [[ "$(plutil -extract "$key" raw "$plist")" == "$expected" ]] || die "Unexpected $key in the built app."
done
codesign --verify --deep --strict "$app"
ditto -c -k --sequesterRsrc --keepParent "$app" "$output/notary.zip"
xcrun notarytool submit "$output/notary.zip" --keychain-profile "$profile" --wait --output-format json \
  > "$output/notary.json"
[[ "$(jq -r .status "$output/notary.json")" == Accepted ]] || die "Notarization was not accepted. See $output/notary.json."
xcrun stapler staple "$app"
xcrun stapler validate "$app"

zip="$output/$zip_name"
ditto -c -k --sequesterRsrc --keepParent "$app" "$zip"
unzip -tq "$zip"
signature="$("$sparkle/sign_update" --account desktop-pet-editor -p "$zip")"
[[ "$signature" =~ ^[A-Za-z0-9+/]{86}==$ ]] || die 'Sparkle signing did not return an EdDSA signature.'
"$sparkle/sign_update" --verify --account desktop-pet-editor "$zip" "$signature"
length="$(stat -f %z "$zip")"

new_feed="$output/appcast.xml"
python3 - "$previous_feed" "$new_feed" "$version" "$build" "$release_url" "$length" "$signature" <<'PY'
import sys
import xml.etree.ElementTree as ET
from email.utils import formatdate

old_path, new_path, version, build, url, length, signature = sys.argv[1:]
namespace = "http://www.andymatuschak.org/xml-namespaces/sparkle"
ET.register_namespace("sparkle", namespace)
sparkle = "{" + namespace + "}"
tree = ET.parse(old_path)
channel = tree.getroot().find("channel")
item = ET.Element("item")
ET.SubElement(item, "title").text = f"陪你喵 {version}"
ET.SubElement(item, sparkle + "version").text = build
ET.SubElement(item, sparkle + "shortVersionString").text = version
ET.SubElement(item, sparkle + "minimumSystemVersion").text = "13.0.0"
ET.SubElement(item, "pubDate").text = formatdate(usegmt=True)
ET.SubElement(item, "enclosure", {
    "url": url, "length": length, "type": "application/octet-stream",
    sparkle + "edSignature": signature,
})
channel.insert(len(channel) - len(channel.findall("item")), item)
tree.write(new_path, encoding="utf-8", xml_declaration=True)
PY
xmllint --noout "$new_feed"

if [[ -n "$publish" ]]; then
  gh release create "$tag" "$zip" --repo "$repo" --target "$source_commit" --prerelease \
    --title "陪你喵 $version 测试版" --notes "用于验证「陪你喵」的应用内自动更新。"
  curl --fail --silent --show-error --location --max-time 120 "$release_url" -o "$output/download.zip"
  cmp "$zip" "$output/download.zip" || die 'The public Release asset differs from the signed ZIP.'
  base64 -i "$new_feed" | tr -d '\n' > "$output/appcast.base64"
  gh api --method PUT "$feed_api" --silent \
    -f branch="$branch" -f sha="$feed_sha" -f message="Publish Sparkle update $tag" \
    -F "content=@$output/appcast.base64"
  for attempt in 1 2 3 4 5 6; do
    if curl --fail --silent --show-error --location --max-time 10 "$feed_url" -o "$output/live.xml" &&
      cmp -s "$new_feed" "$output/live.xml"; then
      printf 'The public appcast serves %s.\n' "$tag"
      break
    fi
    [[ "$attempt" != 6 ]] ||
      die 'The release and feed commit exist, but the public appcast has not returned the new file yet.'
    sleep 5
  done
fi

printf 'ZIP: %s\nAppcast: %s\n' "$zip" "$new_feed"
