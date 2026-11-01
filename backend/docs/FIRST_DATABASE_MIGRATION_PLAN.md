# First Database Migration Plan (Milestone 2F.1A.3)

Design only. **This document does not change SQL, application code, configuration, or the live `cforge` database.** No roles were created. No migrate, bootstrap, or seed was run.

Cluster this plan is written for (**verified** in `docs/LIVE_DATABASE_CLASSIFICATION.md`):

- PostgreSQL 18.6 (Postgres.app), `127.0.0.1:5432`, `listen_addresses=localhost`
- Database `cforge` is **EMPTY**; owner login `cforge` is NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE
- `cforge_app` and `cforge_student` do not exist
- `DATABASE_URL` connects as `cforge`
- `psql` exists under Postgres.app but is not on the default `PATH` that `scripts/migrate.mjs` uses

---

## 1. Role statements already in `schema.sql`

Exact block (`db/schema.sql`):

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_app') THEN
    CREATE ROLE cforge_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_student') THEN
    CREATE ROLE cforge_student NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO cforge_app, cforge_student;
GRANT SELECT, INSERT, UPDATE ON students, invitations, submissions TO cforge_app;
GRANT SELECT ON exercises, exercise_tests TO cforge_app;
GRANT SELECT ON exercises TO cforge_student;
GRANT SELECT ON students, submissions TO cforge_student;
```

What that creates today:

| Role | Attributes in SQL | Intended use |
| --- | --- | --- |
| `cforge_app` | `LOGIN`, no password, no SUPERUSER, no BYPASSRLS | `SET LOCAL ROLE` after `set_config('cforge.student_id', …, true)` (`lib/academy/db.ts`) |
| `cforge_student` | `NOLOGIN` | Privilege/RLS subject only; unused as a connection |

Later files add grants (no new roles):

- `schema-learning.sql`: SELECT/INSERT/UPDATE on learning tables to `cforge_app` (and most to `cforge_student`); then `GRANT cforge_app TO current_user` inside `EXCEPTION WHEN others THEN NULL`
- `schema-roster.sql`: SELECT/INSERT/UPDATE on `student_roster` to `cforge_app`; SELECT to `cforge_student`; SELECT/INSERT on `roster_name_audit` to `cforge_app`
- `schema-assessments.sql`: SELECT/INSERT/UPDATE on `practice_assessment_attempts` to both roles; **no DELETE**
- `schema-curriculum.sql`: **no GRANTs**

**Verified gap:** `CREATE ROLE` requires `CREATEROLE` (or superuser). Live `cforge` has **NOCREATEROLE**. A first apply as `DATABASE_URL` will fail on that `DO` block unless role creation is moved to an admin step.

**Verified gap:** `GRANT cforge_app TO current_user` is required for `SET LOCAL ROLE cforge_app`. Swallowing all errors can hide a failed membership grant.

Do **not** grant SUPERUSER or BYPASSRLS to `cforge`.

---

## 2. Role model (keep `cforge` non-superuser)

Three roles. Only the first exists today.

| Role | Who creates it | Attributes | Used as `DATABASE_URL`? | Used at runtime |
| --- | --- | --- | --- | --- |
| `cforge` | Already exists (2F.1A.2) | LOGIN, NOSUPERUSER, NOBYPASSRLS, owns database and future tables | **Yes** | Owner connection: invite, login, exercise fetch, faculty SQL, migrate |
| `cforge_app` | **Admin step**, not `cforge` | LOGIN, NOSUPERUSER, NOBYPASSRLS, no password (matches current SQL). Not a TCP login in practice | No | `SET LOCAL ROLE` for tenant writes |
| `cforge_student` | **Admin step** | NOLOGIN, NOSUPERUSER, NOBYPASSRLS | No | Grants/RLS only |

**Instance admin** (`ruthvik` on this Mac, or `postgres`) is **not** an application role. It only:

1. Creates `cforge_app` and `cforge_student` if missing, with the same attributes as `schema.sql` (no SUPERUSER, no BYPASSRLS).
2. `GRANT cforge_app TO cforge` so the pool user can `SET ROLE`.
3. Does not become `DATABASE_URL`.

`cforge` keeps CREATE on `public` (already granted) so it can own tables. It does **not** receive CREATEROLE, CREATEDB, SUPERUSER, or BYPASSRLS.

Membership `cforge_app → cforge` is administrative, not a schema object. After that, `schema.sql`’s `CREATE ROLE` block becomes a no-op (`IF NOT EXISTS`).

---

## 3. Execution role per SQL file

| Step | Artifact | Run as | Why |
| --- | --- | --- | --- |
| A | Role provisioning (new, admin-only; not in repo SQL yet) | Instance admin | `CREATE ROLE`; `GRANT cforge_app TO cforge` |
| B | `db/schema.sql` | `cforge` | Tables, `pgcrypto`, seat-cap function/trigger, `current_student_id()`, ENABLE RLS, M1 policies, GRANTs. Role `DO` is then a no-op |
| C | `db/schema-learning.sql` | `cforge` | Learning tables, FORCE RLS, owner policies, GRANTs; `GRANT cforge_app TO current_user` should succeed (already granted in A; should stop swallowing errors in a later SQL edit) |
| D | `db/schema-roster.sql` | `cforge` | Roster tables, FORCE RLS, roll INSERT `ON CONFLICT DO NOTHING` |
| E | `db/schema-assessments.sql` | `cforge` | Practice attempts, FORCE RLS, idempotent policy drop/create |
| F | `db/seed.sql` | `cforge` | Exercise + hidden-test rows (after it is made re-runnable) |
| — | `db/schema-curriculum.sql` | **Skip on this EMPTY first apply** | Unused at runtime (`catalog.json`). Ledger may record `skipped`. Do not apply “to look complete” |

Docker/`bootstrap-db.sh` must not remain a second sequence. After implementation they should invoke the **same ledger runner** (or only `A` via admin + the runner for B–F).

---

## 4. Ordered migration ledger

New table, owned by `cforge`, applied as the first *schema* step after A (or created by the runner before B):

```text
schema_migrations (
  id          text PRIMARY KEY,   -- stable filename / step id
  checksum    text NOT NULL,      -- sha256 of the exact SQL applied
  applied_at  timestamptz NOT NULL DEFAULT now(),
  applied_by  text NOT NULL       -- session_user
)
```

Proposed ids (same list for fresh bootstrap and later upgrades):

| id | File | Required for 2F runtime | First apply on this EMPTY db |
| --- | --- | --- | --- |
| `2026-10-31_000_roles` | Admin role script (to be added later; not executed now) | Yes | Admin, once |
| `2026-10-31_001_schema` | `db/schema.sql` | Yes | Apply |
| `2026-10-31_002_learning` | `db/schema-learning.sql` | Yes | Apply |
| `2026-10-31_003_roster` | `db/schema-roster.sql` | Yes | Apply |
| `2026-10-31_004_assessments` | `db/schema-assessments.sql` | Yes | Apply |
| `2026-10-31_005_seed` | `db/seed.sql` | Yes (judge rows in Postgres) | Apply after seed is idempotent |
| `2026-10-31_006_exercise_bank_2f3b` | `db/seed-exercises-2f3b.sql` | Yes (ten more judge rows) | Additive `INSERT … ON CONFLICT DO NOTHING` only. Applied after 005. Never rewrite 001–005. |
| `2026-10-31_006_curriculum` | `db/schema-curriculum.sql` | No | **Still skipped.** That id was a design placeholder and is not in the runner. The live 006 id is the exercise-bank step above. |

Runner rules:

1. Connect as `cforge` via `DATABASE_URL` (never print the URL).
2. Open a transaction per step; `ON_ERROR_STOP` equivalent (abort that step; do not record it).
3. Skip any `id` already in `schema_migrations` whose checksum matches.
4. If `id` exists and checksum **differs**, stop (do not auto-reapply).
5. Never concatenate all files blindly (today’s `migrate.mjs`).

Fresh empty DB and a later host use this same table and the same ids. Compose init should call the runner, not a shorter file list.

---

## 5. Making DDL and seed repeatable (later SQL edits — not done here)

| Problem | File | Safe shape |
| --- | --- | --- |
| `CREATE TABLE` | `schema.sql` | `CREATE TABLE IF NOT EXISTS` **or** runner applies `001` only once via ledger (ledger alone is enough if files become immutable) |
| `CREATE TRIGGER students_seat_cap` | `schema.sql` | `DROP TRIGGER IF EXISTS …; CREATE TRIGGER` |
| `CREATE POLICY` | `schema.sql`, learning, roster, curriculum | `DROP POLICY IF EXISTS …; CREATE POLICY` (assessments already does this) |
| Seed `INSERT` | `seed.sql` | `ON CONFLICT (id) DO NOTHING` and `ON CONFLICT (exercise_id, ordinal) DO NOTHING` |
| Role `DO` | `schema.sql` | Keep `IF NOT EXISTS`; run after admin step |
| `GRANT cforge_app TO current_user` | `schema-learning.sql` | Fail the step if grant fails; do not `WHEN others THEN NULL` |
| `CREATE TABLE IF NOT EXISTS` | later files | Does not add columns. Future deltas are **new ledger rows** (`ALTER TABLE …`), not silent edits to old files |

**Policy:** once a ledger id is applied in any environment, do not rewrite that file. New shape changes get a new id.

Ledger + immutable files is the upgrade path. `IF NOT EXISTS` is defense in depth for the first mutable files, not a substitute for ALTER migrations.

---

## 6. `psql` PATH without a machine-specific binary

Do **not** hardcode `/Applications/Postgres.app/Contents/Versions/18/bin/psql` or a username home path.

**Preferred:** stop spawning `psql`. Run each file through the existing `postgres` npm package (`lib/academy/db.ts` already uses it). Then `npm run migrate` needs Node + `DATABASE_URL` only. Postgres.app `psql` PATH becomes irrelevant.

**Acceptable fallback:** resolve `psql` from `process.env.PATH` (`command -v psql`). If missing, fail with a message to add the vendor’s **`latest`** bin dir to the *shell* PATH (operator-owned). Discovery of a few well-known *symlink* locations (`…/Postgres.app/Contents/Versions/latest/bin`) is optional and must not pin a version number or a personal path.

`scripts/bootstrap-db.sh` should call the same Node runner, not raw `psql -f`.

---

## 7. Preserve FORCE RLS, grants, and tenant GUC

Do not “simplify” security while making files idempotent.

Must remain after first apply:

- Learning tables and `practice_assessment_attempts`: `ENABLE` **and** `FORCE ROW LEVEL SECURITY`
- Roster: ENABLE + FORCE; `roster_self` SELECT-only
- Policies: `student_id = current_student_id()` (and roster roll subquery)
- `current_student_id()` reads `cforge.student_id`
- Runtime: `set_config(..., true)` + `SET LOCAL ROLE cforge_app` inside `BEGIN`
- Grants: no DELETE on practice attempts; `exercise_tests` / `invitations` stay without student SELECT policies
- `cforge` stays NOSUPERUSER / NOBYPASSRLS so FORCE RLS applies to the table owner on those tables

Auth/invite/faculty continue to use the owner connection (current code). Do not move them onto `cforge_app` in this design.

---

## 8. Rollback and recovery

This first apply is on an **EMPTY** database. There is no student data to preserve yet.

| Situation | Recovery |
| --- | --- |
| Admin step A fails | Fix privileges; do not drop `cforge`. Re-run A (roles use `IF NOT EXISTS`) |
| Step B–F fails mid-file | Transaction rollback of that step; no ledger row. Repair SQL; re-run runner. Do not drop the database if earlier steps committed |
| Need to abandon a broken first apply **before any student/invite rows** | Allowed: drop objects created by the failed step, or (operator-only) `DROP DATABASE cforge` / recreate empty owned by `cforge`, then start the ledger from scratch. **Not** permitted as an automated migrate behavior |
| After students exist | **No** database drop. Forward-only new ledger ids. Restore from a filesystem/`pg_dump` backup if the catalog is corrupt |
| Checksum mismatch | Stop. Diff the file; add a new id rather than rewriting history |
| Partial apply (e.g. M1 present, learning missing) | Runner applies only missing ids. Do not re-run `001` |

Backup before first apply is optional on EMPTY; take a `pg_dump --schema-only` after a successful apply as the known-good snapshot.

---

## 9. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Current `migrate.mjs` concatenates all files including curriculum | High | Replace with ledger runner; skip curriculum on this host |
| `cforge` cannot `CREATE ROLE` | High | Admin step A; do not grant SUPERUSER/BYPASSRLS/CREATEROLE to `cforge` |
| Silent `GRANT cforge_app TO current_user` | High | Fail closed in a later SQL change |
| Non-idempotent `schema.sql` + `seed.sql` | High | Ledger once + make seed/DDL re-runnable |
| Compose/bootstrap still M1-only | High | Point them at the runner |
| `cforge_app LOGIN` with empty password + local `trust` | Medium | Keep localhost-only; do not use `cforge_app` as `DATABASE_URL` |
| Faculty/roster writes as owner vs FORCE RLS | Medium | Works for owner without BYPASSRLS only if policies allow writes (today they do not). Owner **without** FORCE bypass… FORCE applies to owner. Faculty UPDATE as `cforge` (owner, no BYPASSRLS) **will fail** on roster FORCE RLS. **Verified SQL vs `faculty/roster/route.ts`.** First-apply design does not add an admin write policy; call that out as a follow-up so migrate does not pretend faculty SQL works |
| Curriculum skip vs old `migrate.mjs` | Low | Document skip; tests should match the runner set |
| `psql` missing on PATH | Medium | Node driver |

---

## 10. Implementation status (2F.1A)

Implemented in-repo: `db/provision-roles.sql`, `scripts/migrate-engine.mjs`, `scripts/migrate.mjs`, `scripts/provision-roles.mjs`, `scripts/bootstrap-db.sh` → same engine. Faculty roster writes use transaction-local `cforge.faculty` (no BYPASSRLS). Compose no longer auto-applies a partial init schema.

## 10b. Original implementation order

1. Add admin-only role SQL (create `cforge_app` / `cforge_student` if missing; `GRANT cforge_app TO cforge`). Run once as instance admin. Do not put that password or connection string in docs.
2. Replace `scripts/migrate.mjs` with a ledger runner using the `postgres` package; require `DATABASE_URL`; apply B–F in order; skip curriculum; record checksums.
3. Make `schema.sql` policies/trigger and `seed.sql` inserts re-runnable; make learning/roster policies `DROP IF EXISTS`; stop swallowing the membership grant.
4. Point `bootstrap-db.sh` and Compose init at the same runner (Compose still cannot run the admin role step inside the container if roles are cluster-level — document that A is host-admin).
5. Apply on this EMPTY `cforge` only after a dry-run print of the step list.
6. Re-run live classification. Expected: **FULLY_MIGRATED** for runtime tables; curriculum absent and recorded skipped; `cforge` still NOSUPERUSER / NOBYPASSRLS.
7. Add an integration test that applies the runner twice and expects a no-op second pass.

Do not run any of this until a later milestone authorizes implementation.

---

## 11. Proposed sequence summary

**Roles:** admin provisions `cforge_app` + `cforge_student` + membership; `cforge` stays the non-superuser owner and `DATABASE_URL`.

**Permissions:** admin for `CREATE ROLE` only; `cforge` for all application DDL/DML in schema and seed files.

**Apply order on this EMPTY database:** A → `schema.sql` → `schema-learning.sql` → `schema-roster.sql` → `schema-assessments.sql` → idempotent `seed.sql`. Skip `schema-curriculum.sql`.

**Upgrades:** same ledger, new ids only.

**PATH:** use Node/`postgres`, not a hardcoded Postgres.app path.
