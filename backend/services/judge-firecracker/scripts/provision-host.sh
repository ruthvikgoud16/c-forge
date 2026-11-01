#!/usr/bin/env bash
# Dedicated Linux/KVM judge host. Refuses to run on macOS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "provision-host: $(uname -s) $(uname -m) is not a Firecracker host." >&2
  echo "Need: Linux, /dev/kvm, cgroup v2, then install-firecracker + build-guest-rootfs." >&2
  exit 2
fi
if [[ ! -e /dev/kvm ]]; then
  echo "/dev/kvm missing; enable KVM on this machine." >&2
  exit 1
fi
if [[ ! -e /sys/fs/cgroup/cgroup.controllers ]]; then
  echo "cgroup v2 is required." >&2
  exit 1
fi

"$ROOT/scripts/install-firecracker.sh"
"$ROOT/scripts/build-guest-rootfs.sh"

install -d -m 0750 /var/lib/cforge/fc-jail /run/cforge-fc /sys/fs/cgroup/cforge-jobs || true
id -u cforge-fc >/dev/null 2>&1 || useradd --system --home /var/lib/cforge/firecracker --shell /usr/sbin/nologin cforge-fc
install -m 0644 "$ROOT/systemd/cforge-judge-firecracker.service" /etc/systemd/system/cforge-judge-firecracker.service
systemctl daemon-reload
echo "provisioned. Set JUDGE_SECRET in the systemd drop-in. Do not set JUDGE_ALLOW_PRODUCTION until I1-I12 pass."
