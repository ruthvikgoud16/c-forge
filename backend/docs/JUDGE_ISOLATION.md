# Judge execution isolation (Milestone 2F.1D.1)

## 2F.10 Firecracker host runtime

Implemented under `services/judge-firecracker/`. Academy still defaults to the Docker judge (`JUDGE_BACKEND=docker`).

| Item | Status on this machine (macOS arm64, 2026-10-31) |
| --- | --- |
| Linux + `/dev/kvm` + cgroup v2 | **Absent** |
| Firecracker / Jailer binaries | **Not installed** (install script exits 2 on Darwin) |
| Guest rootfs + kernel | **Not built** (Linux-only) |
| Real boot / compile in a microVM | **Not run** |
| I1–I12 on Firecracker | **Pending** (`CFORGE_FC_LIVE` unset; host `ready=false`) |
| `JUDGE_ALLOW_PRODUCTION` | **0** |

Pinned release: Firecracker/Jailer **v1.12.0**. Installer verifies GitHub `*.tgz.sha256.txt`. The service will not start a VM without the Jailer binary. Guest config has no `network-interfaces`. Limits: compile 4s/2s CPU/192 MiB/32 pids; run 2s/1s CPU/64 MiB/1 pid; 2 compiles / 4 jobs.

Loopback driver and mock adapter are protocol tests only.

## 2F.10.1 Firecracker integration contract

Production target remains a dedicated Linux/KVM host. This repository now has the academy-side job contract only (`lib/judge/`). It does **not** boot Firecracker and mock tests do **not** prove isolation.

| Step | Who | Payload |
| --- | --- | --- |
| Create job | Academy → judge | `source`, `language=c11`, `ownerId`. No expected stdout |
| Compile once | Judge guest | Exclusive VM / mock `vmId` |
| Stream stdin | Academy → judge | One `stdin` per test. No answer keys |
| Compare | Academy | `outputsMatch` against hidden expected stdout |
| Destroy | Academy | Job + guest discarded; never reused dirty |

`JUDGE_BACKEND=docker` (default) keeps `POST /execute`. `JUDGE_BACKEND=firecracker` uses `POST /v1/jobs`, `POST /v1/jobs/:id/stdin`, `DELETE /v1/jobs/:id` on a private URL. `JUDGE_BACKEND=mock` is for tests. Guest transport is vsock; guest network is none. Judge credentials stay server-side.

Production Run/Submit is still 503 `JUDGE_DISABLED_UNVERIFIED_ISOLATION` unless `JUDGE_ALLOW_PRODUCTION=1`. That flag stays off until a real KVM host passes the 2F.10 isolation tests.

The academy still sends C to the existing Docker GCC judge. There is no in-process compiler and no Docker socket mount.

## Architecture (inspected, then hardened)

One persistent `cforge-judge` container runs Node as UID 65534 and `gcc` on PATH. Nested `docker run` per submission is **not** used: `unshare`/`chroot` fail (`CapEff=0`), cgroupfs is read-only, and mounting the host Docker socket was rejected as a shortcut.

Verified in this environment (LinuxKit 7.0.14, Landlock ABI 8, `prlimit` present, `gcc -static` works):

| Control | Where | Student effect |
| --- | --- | --- |
| Unique `/workspace/runs/<uuid>/` | `isolate.mjs` | Source and binary live only in that directory; directory is deleted after the run |
| `#include` allow-list | `assertSafeSource` | Blocks `/proc`, `/opt/judge`, `..`, and non-ISO headers so gcc cannot read secrets at compile time |
| `gcc -std=c11 -static` | Docker only | Binary does not need `/lib` after Landlock |
| `confine` wrapper | Landlock + seccomp + rlimits | Applied only to the student binary, not to `gcc` |
| Landlock FS (workspace only) | `confine.c` | `/opt/judge`, `/proc`, `/workspace/runs`, `/tmp` cannot be opened. Bookworm headers have no Landlock-net field; TCP is not restricted by Landlock. |
| seccomp deny list | `confine.c` | `socket`/`connect`, `clone`/`fork`, `ptrace`, `mount`, `bpf`, … return `EPERM` |
| rlimits | `confine.c` | Address space (`JUDGE_MEMORY_LIMIT_MB`), CPU seconds, file size, no core, 8 fds |
| Wall-clock timeout | `isolate.mjs` | Process **group** `SIGKILL` on timeout, output cap, or completion |
| `PR_SET_PDEATHSIG` | `confine.c` | Child dies if the adapter dies |
| Empty `execve` env | `confine.c` | `getenv("JUDGE_SECRET")` is empty |
| Secret fd + `env -u` | `entrypoint.sh` | `JUDGE_SECRET` is not left in pid 1’s environ |
| Fail-closed confine | `JUDGE_REQUIRE_CONFINE=1` | Missing wrapper → `internal_error`, not an unconfined run |
| Compose cgroup | `docker-compose.yml` | Container `mem_limit` 256m, `cpus` 1, `pids_limit` 128, `no-new-privileges`, read-only root, `/tmp` noexec |

Run still uses sample (or custom) stdin. Submit still runs every test and returns pass/fail ordinals only. Hidden stdin never leaves the academy process.

## What this does not provide

- **Not a per-submission container or user namespace.** Same kernel, same UID as the HTTP adapter (65534). If Landlock/seccomp were bypassed, the program could read sibling files and `/proc/1`.
- **No `chroot` / `unshare --net` / nested cgroup.** Those calls are `EPERM` in this image.
- **Compile is not Landlocked.** `gcc` must read `/usr`. The include guard is the compile-time secret control; it is not a C preprocessor proof.
- **`RLIMIT_NPROC` is not used as a per-submission cap.** On Linux it is per real UID and would throttle Node/`gcc` under concurrency. Process creation is denied by seccomp instead; the container still has `pids_limit: 128`.
- Host `gcc` used by local Vitest isolate tests does not apply Landlock. Production path is the Docker image.

## Production execution (2F.7)

Production academy processes refuse judge Run/Submit (`JUDGE_DISABLED_UNVERIFIED_ISOLATION`, HTTP 503) unless the operator sets `JUDGE_ALLOW_PRODUCTION=1`. That flag is an explicit acceptance of the residual shared-UID / same-kernel risks above. It is not a claim that isolation is complete.

## Tests

`tests/judge-isolation.docker.test.ts` (requires a live `JUDGE_URL`) covers infinite loops, large `malloc`, process-creation / `#include <unistd.h>`, file reads, `socket()`, concurrent runs, timeout cleanup, valid Hello/add, Run vs Submit, and the 22×88 bank size. `tests/judge-source-guard.test.ts` covers the include guard without Docker.

## Network exposure (Milestone 2F.1D.2)

How the academy reaches the judge:

| Mode | Next.js | `JUDGE_URL` | Judge listen | Host publish |
| --- | --- | --- | --- | --- |
| Local Mac (`npm run dev`) | Host process on `127.0.0.1:3000` | `http://127.0.0.1:7080` | Container `0.0.0.0:7080` (eth0) | `127.0.0.1:7080:7080` via `docker-compose.override.yml` |
| Host `npm run judge` | Host process | `http://127.0.0.1:7080` | `JUDGE_BIND` default `127.0.0.1` | none |
| Container-to-container / production | App on `cforge_internal` | `http://judge:7080` | Container `0.0.0.0:7080` | **none** (`docker compose -f docker-compose.yml`) |

`cforge_internal` is a user-defined bridge (service DNS `judge`). It is not `internal: true` because that flag also blocked the local loopback publish (`NetworkSettings.Ports` stayed empty). Production isolation is: no `ports:` on `judge`. `/health` is checked from inside the container (`127.0.0.1:7080`). Bearer auth on `/execute` is unchanged.

Do not run production with the override file: `docker compose -f docker-compose.yml up -d`. Local `docker compose up` still merges the override so Mac Next.js can call loopback only.

`tests/judge-network-exposure.test.ts` fails if any compose file publishes `7080:7080` or `0.0.0.0:7080`.
