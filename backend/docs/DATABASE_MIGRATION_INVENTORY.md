# Database Migration Inventory (Milestone 2F.1A.1)

Read-only audit of SQL on disk, bootstrap scripts, and migrate wiring. **This document did not connect to PostgreSQL, did not run migrations, and did not change application or SQL files.**

Labeling:

- **Verified:** observed in repository files during this audit.
- **Assumption:** inferred from PostgreSQL / official image behavior or from other docs; not confirmed against a live cluster.

---

## 1. Method

Inspected:

- `db/schema.sql`, `db/schema-curriculum.sql`, `db/schema-learning.sql`, `db/schema-roster.sql`, `db/schema-assessments.sql`, `db/seed.sql`
- `db/cforge_verified_roster_2026-10-31.csv` (present locally; gitignored; **not** applied by any migrate script)
- `scripts/migrate.mjs`, `scripts/bootstrap-db.sh`, `scripts/import-roster.mjs`
- `docker-compose.yml`, `package.json` (`migrate` script)
- Runtime call sites: `lib/academy/db.ts`, `lib/academy/onboard.ts`, `lib/learning/persist.ts`, `lib/content/assess-persist.ts`, `app/api/v1/faculty/roster/route.ts`
- Tests that apply SQL: `tests/learning-postgres.integration.test.ts`, `tests/assessment-postgres.integration.test.ts`

No `schema_migrations` / Flyway / Knex / Drizzle table or tool exists. **Verified.**

---

## 2. Complete file inventory

| Path | Role | Applied by `npm run migrate` | Applied by Docker init | Applied by `bootstrap-db.sh` |
| --- | --- | --- | --- | --- |
| `db/schema.sql` | Milestone 1 core + roles + seat-cap trigger + `current_student_id()` | Yes (1) | Yes (`01-schema.sql`) | Yes |
| `db/schema-curriculum.sql` | Unused-at-runtime curriculum + `mastery_events` | Yes (2) | **No** | **No** |
| `db/schema-learning.sql` | 2D learning / diagnostic state | Yes (3) | **No** | **No** |
| `db/schema-roster.sql` | 2D.3 official rolls + name audit | Yes (4) | **No** | **No** |
| `db/schema-assessments.sql` | 2F.1 practice assessment attempts | Yes (5) | **No** | **No** |
| `db/seed.sql` | Exercise + hidden-test rows (M1 + 2F.3) | Yes (6) | Yes (`02-seed.sql`) | Yes |
| `db/cforge_verified_roster_2026-10-31.csv` | Local display-name source | **No** | **No** | **No** |

`package.json`: `"migrate": "node scripts/migrate.mjs"`. Requires `DATABASE_URL`. Concatenates the six SQL files above (excluding the CSV) into one `psql -v ON_ERROR_STOP=1` stdin stream. **Verified.**

There is no numbered `db/migrations/` directory and no checksum ledger. Re-applying is “run the same CREATE scripts again,” not an incremental upgrade. **Verified.**

---

## 3. Dependency and execution order

Intended full order (**verified** in `scripts/migrate.mjs`):

1. `schema.sql` — `students`, `exercises`, roles, `current_student_id()`
2. `schema-curriculum.sql` — FKs to `students` and `exercises`; calls `current_student_id()` in `mastery_events` policy
3. `schema-learning.sql` — FKs to `students`; `GRANT cforge_app TO current_user`
4. `schema-roster.sql` — no FK to `students` (roll text only); policies subquery `students`
5. `schema-assessments.sql` — FK to `students`; uses `current_student_id()`
6. `seed.sql` — inserts into `exercises` / `exercise_tests`

Hard dependencies:

- Every later student-owned table needs `students` first.
- `lesson_exercise_links.exercise_id` → `exercises`.
- Learning, roster, and assessment scripts assume role `cforge_app` already exists (`schema.sql` creates it if missing).
- `current_student_id()` must exist before any policy that calls it (curriculum, learning, roster, assessments).
- Seed must run after `exercises` / `exercise_tests` exist.

No SQL file depends on the CSV. `scripts/import-roster.mjs` **assumes** `student_roster` already exists and updates names only.

---

## 4. Object catalog (from SQL text)

### 4.1 Extensions

| Object | File | Notes |
| --- | --- | --- |
| `pgcrypto` | `schema.sql` | `CREATE EXTENSION IF NOT EXISTS` — used for `gen_random_uuid()` |

### 4.2 Tables, keys, checks

**Milestone 1 — `schema.sql` (CREATE TABLE, not `IF NOT EXISTS`)**

| Table | PK / unique | FKs | Checks |
| --- | --- | --- | --- |
| `students` | `id` UUID; `roll_identifier` UNIQUE | — | `status IN ('active','revoked')` |
| `invitations` | `id`; `token_hash` UNIQUE | `consumed_by → students(id)` | — |
| `exercises` | `id`; `slug` UNIQUE | — | — |
| `exercise_tests` | `id`; UNIQUE `(exercise_id, ordinal)` | `exercise_id → exercises` ON DELETE CASCADE | `visibility IN ('sample','hidden')` |
| `submissions` | `id` | `student_id → students` CASCADE; `exercise_id → exercises` CASCADE | `mode IN ('run','submit')` |

**2C foundation — `schema-curriculum.sql` (`IF NOT EXISTS`; unused by live catalog.json runtime)**

| Table | Notes |
| --- | --- |
| `curriculum_versions` | UNIQUE `label`; status check |
| `curriculum_units` | UNIQUE `(version_id, ordinal)`; official/foundation + classification checks |
| `curriculum_topics` | UUID PK; UNIQUE `(unit_id, ordinal)` — **not** catalog ids `u1-t2` |
| `curriculum_prerequisites` | composite PK; self-inequality check |
| `curriculum_subtopics` | UNIQUE `(topic_id, ordinal)` |
| `lesson_documents` | `body jsonb`; mode `learning`/`exam` |
| `lesson_exercise_links` | PK `(lesson_id, exercise_id)` |
| `mastery_events` | `topic_id` UUID FK to `curriculum_topics` (runtime unused) |

**2D.1 learning — `schema-learning.sql` (`IF NOT EXISTS`)**

| Table | Purpose |
| --- | --- |
| `student_preferences` | PK `student_id`; `start_intent` check |
| `diagnostic_sessions` | open/submitted + version strings |
| `diagnostic_session_items` | PK `(session_id, item_id)` |
| `diagnostic_answers` | PK `(session_id, item_id)`; `topic_id text` |
| `student_topic_placements` | PK `(student_id, topic_id)`; placement-state check |
| `learning_events` | catalog `topic_id text`; lesson id text |
| `assessment_attempts` | **diagnostic** history (2D), not practice |

**2D.3 roster — `schema-roster.sql` (`IF NOT EXISTS`)**

| Table | Purpose |
| --- | --- |
| `student_roster` | PK `roll_number`; `display_name` nullable |
| `roster_name_audit` | FK `roll_number → student_roster` (no ON DELETE clause → default NO ACTION) |

**2F.1 assessments — `schema-assessments.sql` (`IF NOT EXISTS`)**

| Table | Purpose |
| --- | --- |
| `practice_assessment_attempts` | UNIQUE `(student_id, assessment_id, attempt_no)`; scores + `responses`/`item_results` jsonb; optional `idempotency_key` |

### 4.3 Indexes (explicit)

| Index | File |
| --- | --- |
| `practice_assessment_idemp` UNIQUE partial on `(student_id, assessment_id, idempotency_key)` WHERE key IS NOT NULL | `schema-assessments.sql` (`IF NOT EXISTS`) |
| `practice_assessment_student_idx` on `(student_id, assessment_id, completed_at DESC)` | same |

All other uniqueness is from PRIMARY KEY / UNIQUE constraints (implicit indexes). **Verified:** no extra indexes on `submissions(student_id)`, `learning_events(student_id)`, `invitations` beyond UNIQUE, or diagnostic tables.

### 4.4 Functions and triggers

| Object | File | Behavior |
| --- | --- | --- |
| `students_enforce_seat_cap()` | `schema.sql` | Before insert/update: if new status is `active` and ≥51 other active rows, `RAISE` `SEAT_CAP` / `P0001` |
| `students_seat_cap` trigger | `schema.sql` | `BEFORE INSERT OR UPDATE` on `students`; `EXECUTE FUNCTION` (PostgreSQL 14+ syntax) |
| `current_student_id()` | `schema.sql` | `NULLIF(current_setting('cforge.student_id', true), '')::uuid` |

Compose image is `postgres:16-alpine`, so `EXECUTE FUNCTION` is valid. **Verified** image pin; **assumption** that any non-compose host is ≥14.

### 4.5 Roles

Created in `schema.sql` if missing:

| Role | Attributes in SQL |
| --- | --- |
| `cforge_app` | `LOGIN`, no password clause |
| `cforge_student` | `NOLOGIN` |

`schema-learning.sql` then `GRANT cforge_app TO current_user` inside a `WHEN others THEN NULL` block so a failed grant is silent. **Verified.**

Runtime: `withStudentTx` does `set_config('cforge.student_id', …, true)` then `SET LOCAL ROLE cforge_app`. Auth, invite mint, exercise fetch, faculty roster SQL, and `assertLearningSchema` use `getSql()` as the `DATABASE_URL` user (no `SET ROLE`). **Verified.**

### 4.6 RLS, FORCE RLS, policies, grants

| Table | ENABLE | FORCE | Policies | Grants |
| --- | --- | --- | --- | --- |
| `students` | yes | **no** | `students_self` SELECT `id = current_student_id()` | app: SELECT/INSERT/UPDATE; student: SELECT |
| `invitations` | yes | **no** | **none** | app: SELECT/INSERT/UPDATE |
| `exercises` | yes | **no** | `exercises_read` SELECT true | app + student: SELECT |
| `exercise_tests` | yes | **no** | **none** (deny non-owner) | app: SELECT only |
| `submissions` | yes | **no** | `submissions_owner` SELECT | app: SELECT/INSERT/UPDATE; student: SELECT |
| curriculum version/units/topics/subtopics/lessons | yes | **no** | SELECT-true (versions filtered by status) | **none** to `cforge_app` |
| `curriculum_prerequisites`, `lesson_exercise_links` | yes | **no** | **none** | **none** |
| `mastery_events` | yes | **no** | SELECT owner | **none** |
| all 7 learning tables | yes | **yes** | owner USING + WITH CHECK | app: SELECT/INSERT/UPDATE; student: most of the same except items SELECT-only |
| `student_roster` | yes | **yes** | `roster_self` **SELECT only** (own roll via `students`) | app: SELECT/INSERT/UPDATE; student: SELECT |
| `roster_name_audit` | yes | **yes** | **none** | app: SELECT/INSERT |
| `practice_assessment_attempts` | yes | **yes** | `practice_assess_owner` (dropped then recreated) | app + student: SELECT/INSERT/UPDATE; **no DELETE** |

`schema.sql` comment: no student policy on `exercise_tests` or `invitations`. **Verified.**

---

## 5. Milestone 2D–2F tables vs runtime

| Feature | SQL table | Runtime writer | Notes |
| --- | --- | --- | --- |
| Preferences | `student_preferences` | `persistPreference` via `withStudentTx` | 2D |
| Diagnostics | `diagnostic_sessions`, `_items`, `_answers` | `lib/learning/persist.ts` | 2D |
| Placement | `student_topic_placements` | same | text topic ids |
| Lesson evidence | `learning_events` | same | not `mastery_events` |
| Diagnostic attempt list | `assessment_attempts` | same | 2D name collision risk with “assessment” |
| Practice scores / responses | `practice_assessment_attempts` | `lib/content/assess-persist.ts` | 2F.1; FORCE RLS; no DELETE |
| Official 51 rolls | `student_roster` | migrate INSERT rolls; faculty/import update names as **owner** | 2D.3 |
| Name history | `roster_name_audit` | faculty POST / import (owner) | FORCE RLS, **no policy** |
| Curriculum SQL graph | `curriculum_*`, `lesson_documents`, `mastery_events` | **not** written by academy TypeScript | catalog is `content/curriculum/catalog.json` |
| Judge exercises | `exercises` / `exercise_tests` | `seed.sql` + in-process `exercise-bank.ts` | 2F.3 seed rows in SQL |
| Accounts / invites | `students` / `invitations` | `onboard.ts` as owner | M1 |
| Submissions | `submissions` | table exists; M1 slice | no source column in SQL |

`SCHEMA.md` lists `practice_assessment_attempts` under the learning-state section as if it lived in `schema-learning.sql`. **Verified doc drift:** the table is only in `schema-assessments.sql`.

`assertLearningSchema()` requires seven names including `practice_assessment_attempts`. The learning integration test’s `REQUIRED_TABLES` omits `assessment_attempts` and `practice_assessment_attempts`. **Verified.**

---

## 6. Fresh bootstrap vs existing upgrade

Three installers, three shapes:

| Path | What a **new empty** data directory gets | Re-run on **existing** data |
| --- | --- | --- |
| Docker `cforge_pg` first boot | `schema.sql` + `seed.sql` only. No learning, roster, assessments, curriculum. | Init scripts **do not run again** (official Postgres image; **assumption** of image behavior). Volume keeps M1-only schema. |
| `scripts/bootstrap-db.sh` | Same two files | Fails on second run: `CREATE TABLE` + seed unique inserts |
| `npm run migrate` | Full six-file set if database is empty | Fails as soon as `schema.sql` hits existing `students` (`CREATE TABLE` without `IF NOT EXISTS`) or seed unique IDs |

**Compose-first then migrate** is the documented README sequence and is **structurally unsafe**: migrate re-executes `schema.sql` after Docker already applied it. **Verified** from compose mounts + `migrate.mjs` + non-idempotent `CREATE TABLE`.

**Migrate-only on empty DB** is the only path in-repo that creates 2D–2F tables in one shot. **Verified** as file wiring; **unverified** that any operator database has actually been migrated.

Later files use `CREATE TABLE IF NOT EXISTS`, so in theory a **partial** database that already has M1 tables could apply files 2–5 if `schema.sql` and `seed.sql` were skipped. No script implements that skip. **Verified** gap.

`CREATE TABLE IF NOT EXISTS` does **not** add missing columns if an older table definition already exists. There is no ALTER/upgrade path. **Verified.**

---

## 7. Missing migrations and bootstrap gaps

**Verified**

- No migration ledger, version number, or expand/contract scripts.
- Docker and `bootstrap-db.sh` omit curriculum, learning, roster, assessments.
- CSV names are never loaded by migrate (import script is separate and not in `package.json`).
- Faculty GET roster uses in-memory `seedRoster()`, not `SELECT` from `student_roster` — SQL roster and HTTP list can diverge.
- No SQL for official labs, PYQ bank, `content_resources`, or faculty analytics tables (`SCHEMA.md` “proposed”).
- `submissions` has no source-code column; `SCHEMA.md` still says source is stored for the owner.
- `schema-curriculum.sql` has no `GRANT` to `cforge_app`; even if runtime used those tables under `SET ROLE`, it would fail permission unless the role is superuser/owner.
- Integration tests apply incomplete subsets (learning test: M1 + learning + roster; assessment test: M1 + learning + assessments; neither applies seed or curriculum).
- `EXECUTION_CHECKPOINT.md` still describes migrate without `schema-assessments.sql` (stale).

**Unverified (no DB session)**

- Whether `cforge_pg` exists and which tables are in it.
- Whether role `cforge_app` exists on any host.
- Row counts, whether 2F.3 seed rows are present, whether FORCE RLS is actually set.

---

## 8. Duplicate or conflicting definitions

Not duplicate `CREATE TABLE` across files. Conflicts are **semantic / installer**:

| Conflict | Detail |
| --- | --- |
| Two “assessment_attempts” concepts | `assessment_attempts` (diagnostic, 2D) vs `practice_assessment_attempts` (2F.1). Names are easy to confuse; both are required. |
| Two curriculum id spaces | UUID `curriculum_topics` vs text catalog ids in learning tables. Documented as leave-in-place legacy. |
| Two exercise banks | `seed.sql` Postgres rows vs `lib/academy/exercise-bank.ts` in-process. Must stay aligned by hand. |
| Two roster stores | SQL `student_roster` vs memory `lib/roster/store.ts`. Faculty GET does not read SQL. |
| Two mastery event tables | unused UUID `mastery_events` vs used `learning_events`. |
| Installer sets | compose/bootstrap ≠ migrate. |
| RLS models | M1 ENABLE-only; 2D/2F ENABLE+FORCE; curriculum ENABLE without grants. |
| `SCHEMA.md` policy intent | Claims students can update self; SQL policy is SELECT-only. Updates go through owner connection. |

---

## 9. Non-idempotent SQL

| Statement class | Files | Re-run effect |
| --- | --- | --- |
| `CREATE TABLE` (no IF NOT EXISTS) | `schema.sql` (5 tables) | Error: relation exists |
| `CREATE TRIGGER students_seat_cap` | `schema.sql` | Error: trigger exists |
| `CREATE POLICY` (no DROP/IF NOT EXISTS) | `schema.sql`, curriculum, learning, roster | Error: policy exists |
| `INSERT` without `ON CONFLICT` | `seed.sql` (all exercise/test rows) | Unique violation on id/slug/`(exercise_id,ordinal)` |
| `CREATE POLICY` after `DROP POLICY IF EXISTS` | `schema-assessments.sql` only | Re-runnable for that policy |

Idempotent or mostly safe: `CREATE EXTENSION IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ENABLE`/`FORCE ROW LEVEL SECURITY`, `GRANT`, curriculum version `INSERT … ON CONFLICT DO NOTHING`, roster `INSERT … ON CONFLICT DO NOTHING`, `CREATE ROLE` guarded by `pg_roles`.

Silent failure: `GRANT cforge_app TO current_user` swallows all exceptions. A migrate can print `migrated` while `SET LOCAL ROLE cforge_app` remains impossible. **Verified** in SQL; **unverified** whether that grant succeeds on a given host.

---

## 10. RLS and privilege risks

**Verified from SQL + TypeScript**

1. **Split trust model.** Learning and practice-assessment writes use `cforge_app` + GUC. Invite accept, login, invite mint, hidden-test fetch, faculty roster UPDATE/INSERT audit, and schema probes use the `DATABASE_URL` role. If that role is a superuser, RLS is bypassed for those paths (`LEARNING_STATE_SECURITY.md` already notes invite/exercise owner connections).

2. **Assumption:** official `postgres` Docker `POSTGRES_USER` is a superuser. Then faculty roster UPDATE works despite FORCE RLS and a SELECT-only policy. On a hardened non-superuser owner **without** `BYPASSRLS`, the same UPDATE/INSERT **will fail** (FORCE RLS + no write policy on `student_roster`; no policy at all on `roster_name_audit`).

3. **`cforge_app` cannot manage invitations or students under RLS.** Grants exist, policies do not. Owner-path code is why M1 auth works today. Moving auth to `SET ROLE cforge_app` without new policies would break invite/login.

4. **`exercise_tests` SELECT grant to `cforge_app` is useless under RLS** (no policy). Hidden keys stay off the student role, which is intended, but any future `SET ROLE` judge-metadata read would see zero rows.

5. **`cforge_app LOGIN` with no password** in SQL. Harmless if `pg_hba` requires a password and none is set; risky if the host uses `trust`. **Assumption** on `pg_hba`. App is not supposed to connect as `cforge_app` at TCP level; it `SET ROLE`s.

6. **`cforge_student` is unused** at runtime but is granted INSERT/UPDATE on practice attempts and several learning tables. Privilege surface is larger than the running code.

7. **Practice attempts grant UPDATE** (and no DELETE). Application treats rows as append-only; SQL still allows an owner-policy UPDATE of scores/json.

8. **Curriculum tables:** RLS enabled, mixed/missing policies, no GRANTs. Harmless while unused; dangerous if someone later queries them as `cforge_app` expecting data.

9. **Owner connection reads `students.password_hash`** on login. Necessary for verification; means a leaked `DATABASE_URL` is a full credential-store read, not a tenant-scoped role.

---

## 11. Recommended migration strategy

Do **not** treat `npm run migrate` as an upgrade command. Split **bootstrap** (empty database) from **versioned deltas** (existing database).

Target end-state:

1. One installer used by Docker init, `bootstrap-db.sh`, and `npm run migrate`.
2. A `schema_migrations (id text PRIMARY KEY, applied_at timestamptz)` ledger (or equivalent).
3. Bootstrap SQL that is safe on empty clusters only; incremental files that are safe on populated clusters (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `DROP POLICY IF EXISTS`).
4. Seed that is `INSERT … ON CONFLICT (id) DO UPDATE` or `DO NOTHING` so 2F.3 exercises can be refreshed without wiping submissions.
5. A documented **admin** role (or `BYPASSRLS` + narrow GRANTs) for faculty roster and invite mint; keep `cforge_app` for student-scoped writes only.
6. Leave `curriculum_*` / `mastery_events` in place until a written retire/copy plan exists. Do not drop them in a hotfix.

---

## 12. Recommended implementation sequence

Do this in order. Each step is a later milestone; this inventory does not implement them.

1. **Inspect the live database (operator).** `\dt`, `\dp`, `\d+` for every public table; check `pg_roles` for `cforge_app`; check `relforcerowsecurity`; count `exercises`, `student_roster`, `practice_assessment_attempts`. Do not run migrate until this snapshot exists. **This audit did not do that.**

2. **Classify the cluster.**
   - Empty → use a single full bootstrap (all six SQL files, or a concatenated `01_bootstrap.sql`).
   - Compose/M1-only (students/exercises exist; learning/roster/assessments missing) → **skip** `schema.sql` and `seed.sql` CREATE/INSERT collisions; apply `schema-curriculum.sql` → `schema-learning.sql` → `schema-roster.sql` → `schema-assessments.sql` → seed with `ON CONFLICT`.
   - Already full → do not re-run current `migrate.mjs`; only apply new numbered deltas.

3. **Make seed idempotent** (`ON CONFLICT` on exercise id and on `(exercise_id, ordinal)`). Required before any installer can be re-run.

4. **Make M1 DDL re-runnable or isolate it.** Either wrap `schema.sql` tables/trigger/policies in `IF NOT EXISTS` / `DROP TRIGGER IF EXISTS` / `DROP POLICY IF EXISTS`, or never include `schema.sql` in upgrade runs.

5. **Unify Docker init** with the full ordered file list (or one bootstrap file). Existing volumes will not re-run init; those hosts still need step 2.

6. **Add `schema_migrations` and change `migrate.mjs`** to apply only unrecorded files. Record the six current files as `2026xxxx_m1` … `2026xxxx_assessments` / `seed` after a successful apply.

7. **Reconcile roster writes.** Faculty and import must use a role that can write under FORCE RLS (admin policy or BYPASSRLS). Add `DROP POLICY IF EXISTS` on roster policies so they are re-runnable. Keep the CSV out of Git.

8. **Do not move invite/login onto `cforge_app` until policies exist** for INSERT/UPDATE on `students` and `invitations` (and decide whether owner bypass remains acceptable).

9. **Align docs:** `SCHEMA.md` (practice table file; student UPDATE policy; submissions source), `README` migrate warning, `EXECUTION_CHECKPOINT.md` file list.

10. **Expand integration tests** to apply the same file set as production migrate, then re-run migrate to prove idempotency.

11. **Only after ledger + idempotent seed:** run one controlled apply on the classified cluster; verify `assertLearningSchema` / `/api/v1/ready`; then continue 2F hardening.

---

## 13. Verdict

The repository has a **concatenated schema dump**, not a migration system. Fresh full apply via `migrate.mjs` on an empty database is the only complete path. Docker and `bootstrap-db.sh` produce an M1-only database. Re-running migrate on that database is expected to fail. 2D–2F objects are well-defined in later SQL files (including FORCE RLS on learning, roster, and practice attempts) but are easy to omit and are not upgrade-safe.

**No SQL or configuration was modified. No database was contacted.**

---

## Addendum — 2F.3b additive exercise bank (later)

After the ledger runner shipped, a sixth runtime step was added. Files `001`–`005` and `db/seed.sql` stay immutable.

| id | File | Kind |
| --- | --- | --- |
| `2026-10-31_006_exercise_bank_2f3b` | `db/seed-exercises-2f3b.sql` | Additive `INSERT … ON CONFLICT DO NOTHING` for ten exercises and their tests |

`scripts/migrate-engine.mjs` `MIGRATION_STEPS` lists 001–007. `scripts/bootstrap-db.sh` calls the same runner. `schema-curriculum.sql` remains off the plan. Fresh empty `cforge` and later upgrades share this list.

## Addendum — 2F.5 faculty dashboard

| id | File | Kind |
| --- | --- | --- |
| `2026-10-31_007_faculty_dashboard` | `db/2026-10-31_007_faculty_dashboard.sql` | Faculty GUC + INSERT G52–G55; seat cap 55; faculty SELECT policies |
| `2026-10-31_008_roll_invitations` | `db/2026-10-31_008_roll_invitations.sql` | `invitations.roll_number` + `revoked_at`; roster FK; one active invite per roll |
| `2026-10-31_009_faculty_role` | `db/2026-10-31_009_faculty_role.sql` | `current_faculty()` = `cforge_faculty` login; least-privilege grants |
| `2026-10-31_010_faculty_invite_policy` | `db/2026-10-31_010_faculty_invite_policy.sql` | Faculty RLS policy on `invitations` |
| `2026-10-31_011_faculty_students_policy` | `db/2026-10-31_011_faculty_students_policy.sql` | Faculty SELECT policy on `students` (no password write) |
| `2026-10-31_012_runtime_access_functions` | `db/2026-10-31_012_runtime_access_functions.sql` | SECURITY DEFINER login/accept/hidden-test accessors; revoke app table reads |
| `2026-10-31_013_owner_runtime_split` | `db/2026-10-31_013_owner_runtime_split.sql` | Assert `cforge_owner` owns public tables; revoke ledger from runtime |
| `2026-10-31_014_rate_limit` | `db/2026-10-31_014_rate_limit.sql` | Token-bucket table + DEFINER take; EXECUTE for app and faculty only |
