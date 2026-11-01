# Vercel + Render deployment (prepared, not published)

Do not deploy, migrate, or push until you choose to. This file is the operator checklist.

## Repository split

| App | Local path | Git today | Deploy as |
| --- | --- | --- | --- |
| Emergent frontend | repository root | `https://github.com/ruthvikgoud16/c-forge.git` | Vercel project **`cforge`**, root blank, default domain `cforge.vercel.app` |
| Original API | `backend/` | same repository | Render Node web service, **Root Directory `backend`** |
| PostgreSQL | local `cforge` | n/a | Render PostgreSQL |

The two apps can deploy independently. They must not share a root. Do not set the Vercel root to the parent CForge tree.

## Vercel (Emergent)

- Framework preset: **TanStack Start**
- Root Directory: *(leave blank if the connected repo is `c-forge` / Emergent)*
- Install: `yarn install --frozen-lockfile`
- Build: `yarn build` (`vite build` with Nitro **`vercel`** preset)
- Output: Nitro/Vercel handles it. Do not set a static output directory.
- SSR runtime: Vercel Function (Fluid) produced by Nitro. `src/server.ts` is the server entry. `/api/*` is intercepted there and proxied.
- Region: `sin1` in `cforge-emergent/vercel.json`

### Vercel environment (Production + Preview)

Server-only. **Never** add `VITE_` prefixes.

| Name | Value |
| --- | --- |
| `CFORGE_API_ORIGIN` | `https://<render-api-host>` no trailing slash |

Do **not** set `VITE_CFORGE_DEMO`. Do **not** put `FACULTY_TOKEN`, `SESSION_SECRET`, or database URLs on Vercel.

## Render API

- Runtime: **Node**
- Root Directory: `.` (original CForge, not `cforge-emergent`)
- Build: `npm ci && npm run build`
- Start: `npx next start --hostname 0.0.0.0 --port $PORT`
- Health: `GET /api/v1/ready` (returns 503 until Postgres is restored and reachable)
- Auto-deploy: off
- Node: 20+
- Blueprint: `render.yaml` (do not apply yet)

### Render API environment

| Name | Notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `cforge_app` URL, not the Render admin URL |
| `DATABASE_APP_URL` | same as `DATABASE_URL` |
| `FACULTY_DATABASE_URL` | `cforge_faculty` URL |
| `MIGRATOR_DATABASE_URL` | one-off jobs only |
| `SESSION_SECRET` | ≥32 chars, unique |
| `FACULTY_TOKEN` | existing permanent faculty token |
| `CFORGE_PUBLIC_ORIGIN` | exact Vercel origin, e.g. `https://xxx.vercel.app` |
| `CFORGE_TRUST_PROXY` | `1` |
| `CFORGE_VERIFIED_ROSTER_PATH` | `/etc/secrets/cforge_verified_roster.csv` |
| `JUDGE_ALLOW_PRODUCTION` | `0` |
| `JUDGE_URL` | empty |
| `JUDGE_SECRET` | empty |
| `ALLOW_MEMORY_LEARNING` | `0` |
| `ALLOW_DEV_INVITE` | `0` |

Upload `db/cforge_verified_roster_2026-10-31.csv` as a Render secret file. Do not commit it.

## `/api` proxy

Browser requests stay same-origin on Vercel (`fetch("/api/...")`).

`src/server.ts` proxies `/api` and `/api/*` to `CFORGE_API_ORIGIN`, forwarding:

- method, path, query string, body
- `Cookie`, `Authorization`, `Origin`, `Content-Type`
- status and response body
- `Set-Cookie` after stripping `Domain=` so `cforge_session` stays HttpOnly on the Vercel host

CSRF still uses `sameOrigin`. Production also accepts `Origin` values listed in `CFORGE_PUBLIC_ORIGIN`. Unknown origins stay 403.

## Labs and papers limitation

Faculty labs and papers live in process memory (`lib/content/ingest.ts`). A Render restart or extra instance loses them. Student accounts, roster, progress, assessments, and profile/DOB persist in Postgres.

## Database backup and later restore (do not run yet)

1. On this Mac: `npm run backup` (writes `~/.cforge/backups/cforge-*.dump` + sha256). Confirm G45 and 55 roster rows in the dump listing if you inspect it.
2. Create Render PostgreSQL. Note the **admin** external URL. Do not treat an empty Render database as migrated.
3. Restore the dump onto Render with `pg_restore` as the Render admin (not `cforge_app`).
4. As admin, create/align `cforge_app`, `cforge_faculty`, `cforge_migrator`, `cforge_owner` and set passwords. Local `provision-roles` is loopback-only; remote provision needs a separate, explicit operator step.
5. Point `DATABASE_URL` / `FACULTY_DATABASE_URL` at those logins. Database name may stay Render’s name; `cforge_app` must not be SUPERUSER or BYPASSRLS.
6. Only if the restored database already has `schema_migrations` or restored tables:

```bash
CFORGE_ALLOW_REMOTE_MIGRATE=1 \
CFORGE_CONFIRM_TARGET='<render-host>/<dbname>' \
MIGRATOR_DATABASE_URL='...' \
node scripts/migrate-remote.mjs --dry-run
```

Empty remote targets are refused unless `CFORGE_ALLOW_EMPTY_TARGET=1` (do not use that to skip restore).

## Dashboard steps (when you decide to publish)

### Git

1. Keep Emergent on `ruthvikgoud16/c-forge` for Vercel.
2. Create a **separate** GitHub repo for the original API when you are ready to push. Do not push until you ask.

### Render

1. New PostgreSQL (`cforge-postgres`), Singapore, do not expose publicly if you can avoid it.
2. New Web Service → Node → API repo → root `.` → commands above → auto-deploy off.
3. Paste env vars. Add the roster secret file.
4. Restore the local dump before expecting `/api/v1/ready` = 200.

### Vercel

1. Add New Project → import `ruthvikgoud16/c-forge`.
2. Confirm framework **TanStack Start**, root blank, `yarn build`.
3. Set `CFORGE_API_ORIGIN` to the Render service origin.
4. Do not deploy until Render `/api/v1/ready` is 200 against the restored database.

### After first successful deploy (later)

1. Copy the Vercel origin into Render `CFORGE_PUBLIC_ORIGIN`.
2. Sign in as G45 and faculty through the Vercel host only.
3. Confirm cookies are `cforge_session` on the Vercel domain, not the Render domain.
