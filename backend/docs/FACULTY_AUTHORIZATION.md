# Faculty database authorization (2F.7.1)

Bearer `$FACULTY_TOKEN` is still required on faculty HTTP routes (compared with `timingSafeEqual`). It is not enough to hold `DATABASE_URL`.

## Roles

| Role | Login | Purpose |
| --- | --- | --- |
| `cforge` | no (after 2F.8.2) | Legacy name. **NOLOGIN**. Does not own tables. |
| `cforge_owner` | no | Owns application objects. Not a runtime credential. |
| `cforge_migrator` | yes | `GRANT cforge_owner`. Used only by `npm run migrate`. |
| `cforge_app` | yes | `SET LOCAL ROLE` for student RLS. |
| `cforge_student` | no | Student privilege name. |
| `cforge_faculty` | yes | Faculty persist only. `NOSUPERUSER` `NOBYPASSRLS` `NOINHERIT`. |

`current_faculty()` is `current_user = 'cforge_faculty'`. Setting `cforge.faculty='1'` as `cforge` does not pass FORCE RLS policies.

## Connection

Faculty routes call `withFacultyTx` on `FACULTY_DATABASE_URL` after Bearer auth. That URL must be the `cforge_faculty` login, not `DATABASE_URL`. If the app database is configured and the faculty URL is missing, faculty operations return **503** `FACULTY_PERSIST_FAILED`.

Grants are least-privilege: roster update + audit insert, invitation insert/update/select, column-limited SELECT on students (no `password_hash`), and aggregate columns on learning/placement/practice tables. No `exercise_tests`. No student INSERT.

## Operator steps

1. `npm run provision-roles` as the instance admin. Optional `TRANSFER_OWNERSHIP=1`, `FACULTY_DB_PASSWORD`, `APP_DB_PASSWORD`, `MIGRATOR_DB_PASSWORD`.
2. Set `DATABASE_URL` to `cforge_app`, `MIGRATOR_DATABASE_URL` to `cforge_migrator`, and `FACULTY_DATABASE_URL` to `cforge_faculty`. Each login uses a distinct SCRAM password. `npm run apply-pg-hba-scram` after passwords exist.
3. `npm run migrate` uses the migrator and `SET ROLE cforge_owner`. Ledger `013` asserts owner split. Faculty still cannot execute DEFINER accessors or read `password_hash` / `exercise_tests`.

## Residual risk

A stolen faculty Bearer token still authorizes faculty HTTP. A stolen `FACULTY_DATABASE_URL` still sees faculty-granted columns. `SECURITY DEFINER` accessors run as `cforge_owner` and bypass ENABLE-only RLS for their narrow queries. Superuser backups bypass RLS.
