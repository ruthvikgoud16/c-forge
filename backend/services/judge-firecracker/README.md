# CForge Firecracker judge

Linux/KVM host runtime for the academy job contract. This is **not** the local Docker GCC judge.

## This Mac / non-KVM host

Firecracker is not running here. Do not treat mock, loopback, or macOS Vitest results as microVM isolation.

## Linux provision

```bash
sudo ./scripts/provision-host.sh
# /etc/cforge/judge-firecracker.env
# JUDGE_SECRET=...
sudo systemctl enable --now cforge-judge-firecracker
curl -sS http://127.0.0.1:7081/ready
```

Pinned release: Firecracker/Jailer **v1.12.0** (official GitHub tarball + `.sha256.txt`). Jailer is mandatory. Guest has no NIC.

Academy: `JUDGE_BACKEND=firecracker` and `JUDGE_URL=http://127.0.0.1:7081`. Keep `JUDGE_ALLOW_PRODUCTION=0` until I1–I12 pass on this host.
