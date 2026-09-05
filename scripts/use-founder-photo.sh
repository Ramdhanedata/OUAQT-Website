#!/usr/bin/env bash
#
# Installs the founder photo for the About page.
#
#   ./scripts/use-founder-photo.sh                 # picks the newest photo
#                                                  # from ~/Downloads or ~/Desktop
#   ./scripts/use-founder-photo.sh path/to/pic.jpg # or name the file yourself
#
# Handles HEIC (what iPhones produce) by converting to JPEG, since browsers
# cannot display HEIC. Writes public/images/founder.jpg, which the About page
# picks up automatically on the next build.

set -euo pipefail

cd "$(dirname "$0")/.."
DEST="public/images/founder.jpg"

pick_newest() {
  # Newest image in Downloads or Desktop, ignoring macOS screenshots.
  find "$HOME/Downloads" "$HOME/Desktop" -maxdepth 1 \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' \) \
    ! -iname 'Screenshot*' -print0 2>/dev/null \
    | xargs -0 ls -t 2>/dev/null | head -1
}

SRC="${1:-$(pick_newest)}"

if [ -z "${SRC}" ] || [ ! -f "${SRC}" ]; then
  echo "No photo found."
  echo
  echo "Save your photo to Downloads or Desktop, then run this again."
  echo "Or pass the path directly:"
  echo "  ./scripts/use-founder-photo.sh ~/Downloads/my-photo.jpg"
  exit 1
fi

echo "Using: ${SRC}"
mkdir -p public/images

case "${SRC##*.}" in
  heic | HEIC)
    # sips ships with macOS, so no extra install needed.
    sips -s format jpeg "${SRC}" --out "${DEST}" >/dev/null
    ;;
  *)
    sips -s format jpeg "${SRC}" --out "${DEST}" >/dev/null 2>&1 || cp "${SRC}" "${DEST}"
    ;;
esac

echo "Installed -> ${DEST}"
sips -g pixelWidth -g pixelHeight "${DEST}" 2>/dev/null | tail -2
echo
echo "Now run:  npm run build"
