#!/usr/bin/env bash
#
# Installs a screenshot as a project's cover image.
#
#   ./scripts/use-project-cover.sh gmm-mining ~/Desktop/gmm-screenshot.png
#
# Slugs: gmm-mining, pharmacy-pos, hotel-operations,
#        transport-manifests, restaurant-pos
#
# Resizes to 1600px wide (matching the other covers), converts to PNG, and
# writes public/images/projects/<slug>/cover.png. The site picks it up on the
# next build once `coverImage` is set for that project in
# lib/data/projects.ts. For gmm-mining that line is already there.

set -euo pipefail
cd "$(dirname "$0")/.."

SLUG="${1:-}"
SRC="${2:-}"

if [ -z "${SLUG}" ] || [ -z "${SRC}" ]; then
  echo "Usage: ./scripts/use-project-cover.sh <slug> <path-to-image>"
  echo
  echo "Slugs:"
  ls public/images/projects
  exit 1
fi

if [ ! -d "public/images/projects/${SLUG}" ]; then
  echo "Unknown slug '${SLUG}'. Available:"
  ls public/images/projects
  exit 1
fi

if [ ! -f "${SRC}" ]; then
  echo "No file at: ${SRC}"
  exit 1
fi

DEST="public/images/projects/${SLUG}/cover.png"

python3 - "$SRC" "$DEST" <<'PY'
import sys
from PIL import Image
src, dest = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im.thumbnail((1600, 1600), Image.LANCZOS)
im.save(dest, "PNG", optimize=True)
print(f"{im.size[0]}x{im.size[1]}")
PY

echo "Installed -> ${DEST}"
echo
echo "Now run:  npm run build"
