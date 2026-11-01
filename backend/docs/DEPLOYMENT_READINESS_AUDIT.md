# CForge deployment readiness audit

Read-only review, 2026-10-31. Private cohort of 51 rolls (`26EG104G01`–`G51`).

**This is not a production-security certificate.** Green tests on a laptop do not mean the platform is ready for students.

Evidence labels used below:

| Label | Meaning |
| --- | --- |
| **Verified** | Observed in this repository or by a non-destructive check on this machine |
| **Reported** | Stated by the operator (local Mac + local PostgreSQL). Not confirmed here |
| **Unverified** | Not observed in this audit |

---

## 1. Application startup and environment

**Verified.** Academy is Next.js 15 (`npm run dev` binds `127.0.0.1:3000`; `npm run start` is `next start --port 3000` with no hostname lock). Judge is a separate Node process (`npm run judge` → `services/judge/src/server.mjs`, default port 7080, listen `0.0.0.0`).

Startup contract (`lib/academy/env.ts`):

- Development: missing judge is allowed; execute then returns 503.
- Production: `SESSION_SECRET` must be ≥32 characters and not a known placeholder; `DATABASE_URL` is required; `ALLOW_MEMORY_LEARNING=1` throws; weak `JUDGE_SECRET` throws if set.
- Development session secret falls back to a hard-coded non-production string if `SESSION_SECRET` is empty.

README says: copy `.env.example` → `.env.local`, `docker compose up -d db judge`, `npm install`, `npm run migrate`, `npm run dev`.

**On this audit host (verified):** `.env` and `.env.local` are absent. Only `.env.example` exists. Ports 3000, 5432, and 7080 did not accept connections from this shell. `DATABASE_URL` was unset in the audit process. `psql` and `docker` were not on `PATH`.

**Reported:** the operator runs the app on a Mac with local PostgreSQL. That instance was not reachable from this audit process.

**Unverified:** a successful `next build` / `next start` on a production host; HTTPS; process supervisor; log rotation.

---

## 2. PostgreSQL connection and migration

**Verified in code.**

- Runtime client: `postgres` pool, `max: 4` (`lib/academy/db.ts`). Uses `DATABASE_URL`. Optional `DATABASE_APP_URL` is loaded but the pool uses `databaseUrl`.
- `npm run migrate` (`scripts/migrate.mjs`) requires `DATABASE_URL` and pipes, in order: `db/schema.sql`, `schema-curriculum.sql`, `schema-learning.sql`, `schema-roster.sql`, `schema-assessments.sql`, `db/seed.sql` through `psql -v ON_ERROR_STOP=1`.
- `db/schema.sql` uses `CREATE TABLE` **without** `IF NOT EXISTS` for `students`, `invitations`, `exercises`, `exercise_tests`, `submissions`. A second migrate on an existing database is expected to fail.
- `scripts/bootstrap-db.sh` applies only `schema.sql` + `seed.sql` (learning, roster, assessments omitted).
- `docker-compose.yml` init mounts only `schema.sql` and `seed.sql`. A compose-first database **will not** create learning, roster, or assessment tables unless `npm run migrate` is also run — and migrate will then collide with already-created Milestone 1 tables.

**Reported:** local PostgreSQL is used.

**Unverified:** that the operator’s database has been migrated with the full `migrate.mjs` set; table list; role `cforge_app`; current row counts. This audit did not open a database session.

---

## 3. Persisted versus in-memory student data

When `DATABASE_URL` is set (and always in `NODE_ENV=production`), writes that go through persist helpers are intended to hit PostgreSQL. When `DATABASE_URL` is unset in non-production, `learningStorageMode()` is **memory**.

| Data | Intended durable store | Verified in code | Notes |
| --- | --- | --- | --- |
| Student account (roll, password hash, status) | `students` | Yes | Created on invite accept if SQL client exists; else in-process `AcademyStore` |
| Invitations | `invitations` | Yes | Same split |
| Seat cap | trigger `students_seat_cap` + app check | Yes | 51 active |
| Official roster rolls / names | `student_roster` | Partial | Seed SQL + memory `seedRoster()`. Faculty name POST updates memory always; Postgres only if `getSql()` |
| Preferences, diagnostics, placements, learning events | `schema-learning.sql` | Yes | `withStudentTx` + hydrate on next request |
| Practice assessment attempts / scores / item results | `practice_assessment_attempts` | Yes | 2F.1 persist + hydrate |
| Diagnostic `assessment_attempts` | `assessment_attempts` | Yes | Hydrated |
| Judge hidden tests | `exercise_tests` | Schema + seed | Execute path uses DB row or in-process bank fallback |
| Exercise **submissions** (run/submit history) | `submissions` table exists | **No writer** | Schema only. Execute does not INSERT |
| Faculty papers / labs | none | Memory (`lib/content/ingest.ts`) | Lost on process restart |
| Curriculum / lessons / packages | files on disk | Yes | Not per-student |
| Session | httpOnly cookie | Yes | Not in Postgres |

**Unverified:** a logout → academy restart → login cycle against the operator’s Postgres showing the same attempts.

---

## 4. Milestone 2F.1 — is it fully implemented?

**In repository: yes (code + tests). Against a named production database: unverified.**

Present and consistent with the milestone:

- `db/schema-assessments.sql`: `practice_assessment_attempts`, FORCE RLS, owner policy on `current_student_id()`, unique attempt numbers, idempotency unique index, no DELETE grant.
- `lib/content/assess-persist.ts`: postgres mode uses `withStudentTx`; memory only when storage mode is memory; production persist errors become HTTP 503.
- Submit route scores on the server; client score fields rejected.
- `hydrateStudent` reloads practice attempts after restart (when postgres mode).
- Tests: `tests/assessment-persist.test.ts`, `tests/assessment-postgres.integration.test.ts` (embedded Postgres port 55434, or `DATABASE_URL` if set).

Not part of 2F.1 and still open: official labs, PYQ bank, Docker judge on this Mac, durable migrate of the operator’s cluster.

---

## 5. Authentication, session, and RLS

**Verified.**

- Auth is roll number + password. Invitation required. Unknown rolls → `unknown_roll`. No Google OAuth.
- Passwords: scrypt with per-password salt (`lib/academy/crypto.ts`).
- Session cookie `cforge_session`: payload + SHA-256 of `secret.payload` (not HMAC-SHA256). httpOnly, SameSite=Lax, `Secure` only when `NODE_ENV=production`, 14-day maxAge. Identity for learning APIs is this cookie; body `studentId` is stripped.
- Faculty: bearer `FACULTY_TOKEN` on invitation/roster/papers/labs routes. Not a student identity.
- `ALLOW_DEV_INVITE` / `DEV_INVITE_TOKEN` work only when not production.
- RLS: Milestone 1 tables + learning + roster + practice assessments. Learning writes `SET LOCAL ROLE cforge_app` and `set_config('cforge.student_id', …, true)` inside a transaction.
- Superuser connections bypass RLS. Invite accept and faculty roster SQL use the owner pool (`getSql()`), not `cforge_app`.
- No Next.js `middleware.ts`. No login rate limit. No CSRF token beyond SameSite=Lax.

**Unverified:** cookie theft resistance on a real HTTPS deployment; faculty token storage on the operator’s machine.

---

## 6. Backup and restore

**Verified: none in this repository.** No `pg_dump` / `pg_restore` script, no snapshot playbook, no documented RPO/RTO.

`docker-compose.yml` defines volume `cforge_pg` (useful only if compose Postgres is what is actually used). `scripts/bootstrap-db.sh` is not a restore tool.

**Unverified:** whether the operator already dumps their local cluster.

Without backups, 51 students’ attempts and placements are a single-disk failure away from loss.

---

## 7. Judge deployment and isolation

**Verified in code.**

- Academy never compiles C (`refuseInProcessCompile`). Execute is the only judge client.
- Judge Dockerfile: `gcc:13-bookworm`, process user 65534, Node HTTP adapter.
- Compose judge: `read_only`, `/tmp` tmpfs, `pids_limit: 128`, `mem_limit: 256m`, `cpus: 1.0`, `no-new-privileges`, user 65534, internal bridge. Port 7080 is still **published on the host**.
- Runtime isolate (`isolate.mjs`): temp dir, `gcc -std=c11 -O0`, run binary with time/output limits, delete workspace. Architecture text mentions an optional nested `docker` isolate mode; **that mode is not in `isolate.mjs`**. Isolation is process + container, not a second Docker-in-Docker sandbox.
- Judge listens on `0.0.0.0`. Auth is `Authorization: Bearer $JUDGE_SECRET` only.
- Default compose secret `dev-judge-secret-not-for-production` is on the production insecure list.

**Verified on this host:** Docker CLI not on `PATH`. Apple `gcc` is Clang 21; earlier isolate suites were skipped when the compile probe failed. Docker judge was not executed in this audit.

**Unverified:** isolate breakout resistance; concurrent 51-student load; network policy that keeps 7080 off the public internet.

---

## 8. Environment variables (secrets by name only)

Values were not read. Names from `.env.example`, `loadEnv`, judge, Playwright, and compose:

| Name | Role | Secret? |
| --- | --- | --- |
| `NODE_ENV` | `development` / `production` | No |
| `PORT` | Academy (example only; scripts hard-code 3000) | No |
| `DATABASE_URL` | Postgres owner URL | **Yes** (credentials in URL) |
| `DATABASE_APP_URL` | Optional app-role URL | **Yes** if set |
| `SESSION_SECRET` | Cookie signature | **Yes** |
| `JUDGE_URL` | Judge base URL | No (placement) |
| `JUDGE_SECRET` | Judge bearer | **Yes** |
| `FACULTY_TOKEN` | Faculty API bearer | **Yes** |
| `ALLOW_DEV_INVITE` | Dev invite switch | No (forbidden in production) |
| `DEV_INVITE_TOKEN` | Dev invite token | **Yes** if used |
| `ALLOW_MEMORY_LEARNING` | Force memory store | No (forbidden in production) |
| `JUDGE_PORT` | Judge listen port | No |
| `JUDGE_TIME_LIMIT_MS` | Isolate time | No |
| `JUDGE_MEMORY_LIMIT_MB` | Documented; not applied in `isolate.mjs` | No |
| `JUDGE_OUTPUT_LIMIT_BYTES` | Isolate output cap | No |
| `JUDGE_PIDS_LIMIT` | Compose / docs | No |
| `E2E_BASE_URL` | Playwright | No |
| `E2E_NO_WEBSERVER` | Playwright | No |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Compose DB | **Yes** (password) |

Placeholders in `.env.example` (`replace-with-…`) are rejected in production for session/judge secrets.

---

## 9. Git / version control and other blockers

**Verified.** There is no `/Users/ruthvik/Cforge/.git`. `/usr/bin/git` reports Apple Git 2.50.1. No remotes, branches, or tags. The tree cannot be tagged, reviewed, or rolled back with git on this disk.

Related blockers **verified in repo or on this host:**

- `npm run migrate` is not safe to re-run on an already-created Milestone 1 schema.
- Compose init schema set ≠ `migrate.mjs` schema set.
- `next start` does not bind localhost-only.
- Judge binds all interfaces; 7080 published in compose.
- No TLS, reverse proxy, or firewall config in-repo.
- No backup/restore.
- No process manager / systemd unit.
- Xcode CLI / Docker / `psql` not available in this audit PATH (operator machine may differ).
- Exercise `submissions` table unused.
- Papers/labs in memory only.

---

## 10. Tests and latest actual results

**Inventory (verified):** 25 Vitest files under `tests/*.test.ts`; 3 Playwright files under `tests/e2e/`.

**Cached Vitest results** (`node_modules/.vite/vitest/.../results.json`, mtime 2026-10-31 15:59 IST): 26 listed files, each `failed: false`, including `learning-postgres.integration.test.ts` (~928 ms) and `assessment-postgres.integration.test.ts` (~926 ms). `tests/exercise-bank.test.ts` also `failed: false` (20 ms). This cache is **not** a single signed-off full-suite command after every later edit.

**Commands with recorded stdout in this project’s agent history:**

| When | Command | Result |
| --- | --- | --- |
| 13:24 IST | `npm test` then Playwright | Vitest: **20 files, 90 passed, 2 skipped** (gcc isolate). Playwright: **6 passed** (`milestone1.spec.ts` only) |
| ~13:53 IST | Playwright `test-results/.last-run.json` | `"status": "passed"`, `failedTests: []` — **which spec file is not recorded** |
| 15:56 IST | Focused 2F.2 set (8 files) | **45 passed** |
| 15:59 IST | Focused 2F.3 + related | `exercise-bank`: **5 passed, 1 skipped** (gcc isolate). Adjacent files passed |

**Skipped / not run as production proof:**

- Local gcc isolate (Docker judge never run in recorded sessions).
- Full Playwright after 2F.2/2F.3 (`academy-hub.spec.ts`, `milestone-2d3.spec.ts` not in the 13:24 log).
- Any test against the operator’s durable `DATABASE_URL` (unset here).
- Load, TLS, or backup restore tests (none exist).

---

## Prioritized blockers

1. **No version control.** Cannot ship, review, or revert a known tree.
2. **Durable schema apply is unsafe / incomplete.** Compose/bootstrap omit later SQL; full migrate is not idempotent on `schema.sql`.
3. **No backups.** Student attempts and placements have no restore path in-repo.
4. **Judge and academy network exposure.** Judge `0.0.0.0` + published 7080; `next start` not locked to localhost; no TLS in-repo.
5. **Production env not instantiated here.** No `.env.local`; `DATABASE_URL` unset in this process; local PG/judge ports closed during the audit.
6. **Judge isolation unverified on this Mac.** No Docker in PATH; gcc isolate skipped in recorded runs.
7. **Invite/roster/exercise SQL still use the owner connection.** RLS for those paths is weaker than learning writes.
8. **Memory leftovers.** Papers/labs; submissions unused; development without `DATABASE_URL` is an in-memory academy.
9. **No rate limits / no production security review.** Faculty token and judge secret are single shared bearers.
10. **Test evidence is partial.** Latest green cache ≠ one full post-2F.3 suite on the deployment database.

---

## Recommended architecture (51 students, low cost)

Keep one small host (a single VPS, or the Mac on a private network). Do not add extra microservices.

```
Students (HTTPS)
    → Caddy or nginx (TLS, 80/443 only)
        → Next.js `next start` on 127.0.0.1:3000
            → Postgres 16 on 127.0.0.1:5432 (not published)
            → Judge container on 127.0.0.1:7080 (not published)
```

Operating notes:

- `NODE_ENV=production`. Set strong `SESSION_SECRET`, `DATABASE_URL`, `JUDGE_SECRET`, `FACULTY_TOKEN`. Do not set `ALLOW_DEV_INVITE` or `ALLOW_MEMORY_LEARNING`.
- Apply schema **once** with a checked migration (fix idempotency before a second apply). Do not rely on compose initdb alone.
- Daily `pg_dump` to another disk or object storage; test restore on a copy before the first class.
- Judge: run the existing Dockerfile; do not publish 7080; academy uses `JUDGE_URL=http://127.0.0.1:7080`.
- Faculty token only on the instructor machine. Mint invitations; students join with official rolls.
- Init git, tag a release, keep secrets out of the tree.
- One `next start` process is enough for 51 seats if the judge queue stays short (submit is sequential per request today).

This is a **recommended** shape, not a deployed one.

---

## Verified vs reported vs unverified (summary)

**Verified:** invitation + seat-cap design; session cookie; RLS SQL and `cforge_app` learning writes; 2F.1 persist code and isolation tests in-repo; public DTOs strip hidden tests and assessment keys; twelve judge exercises in the in-process bank + seed SQL; production fail-closed env rules; no `.git`; no in-repo backup; compose/migrate mismatch; this audit host had no listening 5432/3000/7080 and no `.env.local`.

**Reported:** the project is used on the operator’s Mac with local PostgreSQL.

**Unverified:** that local cluster’s actual schema and data; HTTPS; Docker judge execution; gcc isolate of the new bank; full Playwright after recent milestones; restart/login persistence on the operator’s database; production secret quality; backup restore; load under 51 concurrent submits.

**Do not treat the platform as production-ready.**
