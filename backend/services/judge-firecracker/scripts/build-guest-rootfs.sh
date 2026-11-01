#!/usr/bin/env bash
# Build a minimal Debian rootfs with GCC 13 and the vsock supervisor. Linux only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT/versions.env"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "build-guest-rootfs: must run on Linux. This machine cannot produce the guest image." >&2
  exit 2
fi
if ! command -v docker >/dev/null; then
  echo "docker is required to build the immutable guest rootfs" >&2
  exit 1
fi

DEST="${CFORGE_FC_ROOT:-/var/lib/cforge/firecracker}/images"
mkdir -p "$DEST"
ARCH="$(uname -m)"
KERNEL_URL="$CFORGE_FC_KERNEL_URL_X86_64"
[[ "$ARCH" == "aarch64" ]] && KERNEL_URL="$CFORGE_FC_KERNEL_URL_AARCH64"

curl -fsSL "$KERNEL_URL" -o "$DEST/vmlinux"
(cd "$DEST" && sha256sum vmlinux > vmlinux.sha256)

IMAGE="cforge-fc-guest:gcc${CFORGE_GUEST_GCC}"
docker build -t "$IMAGE" -f - "$ROOT/guest" <<'EOF'
FROM debian:bookworm
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      gcc-13 libc6-dev linux-libc-dev ca-certificates make \
    && update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-13 130 \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man
COPY supervisor.c Makefile /tmp/guest/
RUN make -C /tmp/guest CC=gcc-13 CFLAGS="-std=c11 -O2 -Wall -static" \
    && install -m 0755 /tmp/guest/supervisor /sbin/init \
    && rm -rf /tmp/guest
RUN printf 'root:x:0:0:root:/root:/usr/sbin/nologin\n' > /etc/passwd \
    && printf 'root:x:0:\n' > /etc/group \
    && rm -f /etc/ssh/sshd_config /usr/sbin/sshd || true
EOF

CID="$(docker create "$IMAGE")"
docker export "$CID" | python3 - "$DEST/rootfs.ext4" <<'PY'
import sys, tarfile, tempfile, os, subprocess
out = sys.argv[1]
tmp = tempfile.mkdtemp()
img = os.path.join(tmp, "rootfs.ext4")
subprocess.check_call(["dd", "if=/dev/zero", f"of={img}", "bs=1M", "count=768"], stdout=subprocess.DEVNULL)
subprocess.check_call(["mkfs.ext4", "-F", "-q", img])
mnt = os.path.join(tmp, "mnt")
os.makedirs(mnt)
subprocess.check_call(["mount", "-o", "loop", img, mnt])
try:
    with tarfile.open(fileobj=sys.stdin.buffer, mode="r|") as tar:
        tar.extractall(mnt, filter="data")
finally:
    subprocess.check_call(["umount", mnt])
os.replace(img, out)
PY
docker rm "$CID" >/dev/null
(cd "$DEST" && sha256sum rootfs.ext4 > rootfs.ext4.sha256)
echo "guest rootfs written to $DEST/rootfs.ext4 (read-only at runtime)"
