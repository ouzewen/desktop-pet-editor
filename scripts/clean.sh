#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf build .playwright-cli
find . -name .DS_Store -not -path "./node_modules/*" -not -path "./.git/*" -delete
printf 'Cleaned build outputs and local caches.\n'
