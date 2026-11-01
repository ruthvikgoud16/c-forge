# Database backup and restore (Milestone 2F.1B)

Local PostgreSQL 18 custom-format backups. **Do not store dump files in Git. Do not print connection strings.**

## Backup

```sh
npm run backup
```

`scripts/backup-db.mjs` confirms `DATABASE_URL` is local `cforge`, then runs `pg_dump --format=custom` as the **instance administrator** (macOS login or `ADMIN_DATABASE_URL`). After 2F.8.3 the administrator still uses local trust; CForge roles must use SCRAM passwords and are not used for dump/restore. FORCE RLS blocks `COPY` as table owner `cforge_owner`; the dump does **not** grant `BYPASSRLS` to runtime logins.

| Rule | Value |
| --- | --- |
| Directory | `$HOME/.cforge/backups` (override `CFORGE_BACKUP_DIR`) |
| Directory mode | `700` |
| File mode | `600` |
| Names | `cforge-<UTC timestamp>.dump` and `.dump.sha256` |
| Target | Loopback host, database name `cforge` only |

`pg_dump` / `pg_restore` are taken from `PATH`, or Postgres.app `Versions/latest/bin`. No versioned executable path is hardcoded.

The script prints basename, byte size, SHA-256, and directory. It never logs `DATABASE_URL` or passwords. A failed dump exits non-zero.

Checksum line format: `<hex>  <filename>`.

## Restore (manual, not onto `cforge`)

Restore only into a **new** database. Never `DROP DATABASE cforge`. Never `pg_restore` with `-d cforge`.

1. Confirm the checksum: `shasum -a 256 -c cforge-<stamp>.dump.sha256` from the backup directory (or compare the hex in that file to `shasum -a 256` of the dump).
2. As the instance administrator on localhost:

   ```sh
   createdb -h 127.0.0.1 -O cforge_owner <new_db_name>
   ```

   `<new_db_name>` must not be `cforge`.
3. Restore as the **instance administrator** (FORCE RLS would block `COPY` as `cforge`). Do not use `-d cforge`.

   ```sh
   pg_restore --no-password -h 127.0.0.1 -p 5432 -U "$USER" -d <new_db_name> cforge-<stamp>.dump
   ```

   Table ownership in the dump remains `cforge`.

4. Compare `schema_migrations`, table list, `exercises` (12), `exercise_tests` (48), table owner `cforge`, and FORCE RLS on learning/roster/practice-assessment tables. Count `student_roster` with the faculty GUC (or as administrator); an ordinary `cforge` session should see 0 roster rows.
5. Point a throwaway `DATABASE_URL` at `<new_db_name>` only if you need an application smoke test. Keep `.env.local` on `cforge`.

Cluster roles (`cforge`, `cforge_app`, `cforge_student`) are **not** inside the dump. They must already exist (see `npm run provision-roles`).

## Restore verification helper

```sh
npm run restore-verify
# or: node scripts/restore-verify.mjs /absolute/path/to/cforge-<stamp>.dump
```

Creates `cforge_restore_verify_<timestamp>`, restores the latest (or named) dump, runs the checks above, and **does not drop** that database or touch `cforge`.

## Recovery of production-like data

If `cforge` is corrupt and a dump is known-good: create a new database, restore into it, reclassify, then change `DATABASE_URL` only after verification. Do not restore over the live name in place.
