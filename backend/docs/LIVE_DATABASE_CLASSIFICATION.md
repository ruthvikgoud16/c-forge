# Live PostgreSQL Classification (Milestone 2F.1A)

Updated after the first safe apply. Credentials redacted. Database was not dropped.

---

## Identity

| Item | Verified |
| --- | --- |
| Server | PostgreSQL 18.6 (Postgres.app), `listen_addresses=localhost`, port 5432 |
| Database | `cforge` |
| Application login | `cforge` — LOGIN, NOSUPERUSER, NOBYPASSRLS |
| Admin used for roles | `ruthvik` |
| `SELECT 1` as `cforge` | Succeeded (`current_user=cforge`, `current_database=cforge`) |

---

## Classification

**FULLY_MIGRATED** for the runtime ledger. `schema-curriculum.sql` was not applied (unused at runtime).

---

## Roles

| Role | Login | Superuser | BYPASSRLS |
| --- | --- | --- | --- |
| `cforge` | yes | no | no |
| `cforge_app` | yes | no | no |
| `cforge_student` | no | no | no |

`GRANT cforge_app TO cforge` is in place. `SET LOCAL ROLE cforge_app` after `set_config('cforge.student_id', …, true)` works as `cforge`.

---

## Ledger (`schema_migrations`, applied_by `cforge`)

| id | checksum |
| --- | --- |
| `2026-10-31_001_schema` | `4b548291b37947fec7e0ed9e6c3fe0bba3ab859ffdccd44b20305f2ca0873cc3` |
| `2026-10-31_002_learning` | `acf29daf04a0fa2b47a4586d6960ec83d4c7590f9b9ec0f5e6cebfd8249d2f5b` |
| `2026-10-31_003_roster` | `ff539bd5b9c4d54023297a860185a3291b4144e1aec6366341b3514bdce4edcd` |
| `2026-10-31_004_assessments` | `bbfdc187117a7a5e92456c240be7d71c32d7253bacd53973a877880868821d2b` |
| `2026-10-31_005_seed` | `925a94817cdc7f750bcf0280bb8b0d4c73b936d7dca53a87ff3de497d327a2be` |

Second `npm run migrate`: all five **skipped** (checksums match).

---

## Schema state

Public tables: `students`, `invitations`, `exercises`, `exercise_tests`, `submissions`, learning-state set, `student_roster`, `roster_name_audit`, `practice_assessment_attempts`, `schema_migrations`.

Counts: 12 exercises, 48 tests, 51 roster rolls. No `curriculum_*` tables.

FORCE RLS: learning tables, `student_roster`, `roster_name_audit`, `practice_assessment_attempts`. M1 tables ENABLE only (unchanged).

Faculty roster writes: policies `roster_faculty` / `roster_audit_faculty` via transaction-local `cforge.faculty='1'`. No BYPASSRLS.

---

## 2F.1C application persistence (verify database)

Target: `cforge_restore_verify_20261031t113808z` only. Child `next dev` on `127.0.0.1:3012` with `DATABASE_URL` override. `.env.local` was not edited.

`GET /api/v1/ready` in non-production reports `database`. The test **stops** if that value is `cforge`.

**Verified 2026-10-31.** `tests/persistence-restart.integration.test.ts` passed (one case, ~6s).

Workflow on unused official rolls created only in the verify database: faculty invite → accept → login → GET lesson `u1-t1-computers-and-binary` → POST in-lesson `trace` check → POST `topic:u1-t1` assessment → logout → stop Next → start Next with the same verify `DATABASE_URL` → login → GET attempts.

Postgres on the verify DB: one `practice_assessment_attempts` row (full marks, attempt 1); learning events include `lesson_opened` and check/assessment kinds. After restart the attempt list stayed length 1 (GET assessment did not insert a second attempt). A second student on the same server saw zero attempts. Origin `cforge` student/invite/event/attempt counts stayed `0/0/0/0`.

`GET /api/v1/ready` reported `database=cforge_restore_verify_20261031t113808z` and `storage=postgres`. The test would have stopped if it reported `cforge`. `.env.local` was not edited. Both restore-verify databases remain.

---

## Remaining blockers

- A leaked `DATABASE_URL` can set `cforge.faculty` in SQL; the HTTP faculty token remains the app-layer control.
- Local `pg_hba` is still `trust` on loopback.
- Official labs / PYQ / production review unchanged.
