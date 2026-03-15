#!/usr/bin/env bash
# trex installer — https://github.com/edikoo/trex
set -euo pipefail

REPO="edikoo/trex"
BIN_DIR="${TREX_BIN_DIR:-/usr/local/bin}"
BIN="trex"

# ── Detect OS + arch ──────────────────────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64)  TARGET="linux-x64"   ;;
      aarch64) TARGET="linux-arm64" ;;
      *) echo "Unsupported arch: $ARCH"; exit 1 ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      x86_64)  TARGET="macos-x64"   ;;
      arm64)   TARGET="macos-arm64" ;;
      *) echo "Unsupported arch: $ARCH"; exit 1 ;;
    esac
    ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# ── Get latest version ────────────────────────────────────────────────────────
echo "→ Fetching latest trex release..."
VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\(.*\)".*/\1/')"

if [ -z "$VERSION" ]; then
  echo "✗ Could not determine latest version. Check your internet connection."
  exit 1
fi

echo "→ Installing trex ${VERSION} (${TARGET})..."

# ── Download + install ────────────────────────────────────────────────────────
URL="https://github.com/${REPO}/releases/download/${VERSION}/trex-${TARGET}.gz"
TMP="$(mktemp)"
TMP_GZ="${TMP}.gz"

curl -fsSL "$URL" -o "$TMP_GZ"
gunzip -c "$TMP_GZ" > "$TMP"
chmod +x "$TMP"
rm "$TMP_GZ"

# Try to install to BIN_DIR (may need sudo)
if [ -w "$BIN_DIR" ]; then
  mv "$TMP" "${BIN_DIR}/${BIN}"
else
  echo "→ ${BIN_DIR} requires sudo..."
  sudo mv "$TMP" "${BIN_DIR}/${BIN}"
fi

echo "✓ trex ${VERSION} installed to ${BIN_DIR}/${BIN}"
echo ""
echo "  Run: trex --help"
echo "  Tip: trex --git --meta --squash"
