#!/usr/bin/env bash
# Pin and install matching Firecracker + Jailer binaries. Linux only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT/versions.env"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "install-firecracker: this host is $(uname -s)/$(uname -m); Firecracker/Jailer are Linux+KVM only." >&2
  echo "Binaries were not installed. Provision a dedicated KVM host and re-run." >&2
  exit 2
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|aarch64) ;;
  *) echo "unsupported arch $ARCH" >&2; exit 1 ;;
esac

DEST="${CFORGE_FC_ROOT:-/var/lib/cforge/firecracker}"
BIN="$DEST/bin"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

TGZ="firecracker-${FIRECRACKER_VERSION}-${ARCH}.tgz"
BASE="$FIRECRACKER_RELEASE_BASE"
curl -fsSL "$BASE/$TGZ" -o "$TMP/$TGZ"
curl -fsSL "$BASE/$TGZ.sha256.txt" -o "$TMP/$TGZ.sha256.txt"
(cd "$TMP" && sha256sum -c "$TGZ.sha256.txt")

mkdir -p "$BIN"
tar -C "$TMP" -xzf "$TMP/$TGZ"
FC="$(find "$TMP" -type f -name "firecracker-${FIRECRACKER_VERSION}-${ARCH}" | head -n1)"
JAILER="$(find "$TMP" -type f -name "jailer-${FIRECRACKER_VERSION}-${ARCH}" | head -n1)"
if [[ -z "$FC" || -z "$JAILER" ]]; then
  echo "tarball missing matching firecracker/jailer binaries" >&2
  exit 1
fi
install -m 0755 "$FC" "$BIN/firecracker"
install -m 0755 "$JAILER" "$BIN/jailer"
cp "$TMP/$TGZ.sha256.txt" "$DEST/SHA256SUMS"
echo "$FIRECRACKER_VERSION $ARCH" > "$DEST/VERSION"
echo "installed $FIRECRACKER_VERSION firecracker+jailer to $BIN"
