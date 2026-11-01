# CForge

Private C programming academy. One GitHub repository, two deploy roots.

- **Public UI (Vercel):** this directory. Project name `cforge`. Intended default domain `https://cforge.vercel.app`. Student login stays `/login`. Faculty login stays `/faculty-login`. `https://cforge.vercel.com` needs separate ownership and DNS verification.
- **API (Render):** `backend/`. Root Directory `backend`. Judge stays disabled in production.

Browser calls stay same-origin (`/api`). SSR and the production proxy use server-only `CFORGE_API_ORIGIN`.

Core API documents live in `backend/`: `README.md`, `PRD.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `SCHEMA.md`.

Do not commit `.env.local`, faculty tokens, or `db/cforge_verified_roster_2026-10-31.csv`.
