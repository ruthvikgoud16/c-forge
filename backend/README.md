# CForge

Private C programming academy. Milestone 1 is a secure Hello, CForge! vertical slice. The official roster is now 55 rolls.

The academy process never runs GCC. A dedicated judge service does.

## Quick start

1. Copy `.env.example` to `.env.local` and replace every placeholder secret.
2. `docker compose up -d db judge` (local override publishes judge on `127.0.0.1:7080` only). Production: `docker compose -f docker-compose.yml up -d` (no host mapping for 7080; academy uses `JUDGE_URL=http://judge:7080`).
3. `npm install`
4. `npm run migrate` (when using Postgres)
5. `npm run dev`
6. Mint an invite: `curl -H "Authorization: Bearer $FACULTY_TOKEN" -d '{"ttlHours":24,"rollNumber":"26EG104G01"}' /api/v1/faculty/invitations`

Production without `JUDGE_URL` returns HTTP 503 on execute. That is intentional.

## Tests

```
npm test
npm run test:e2e
```

Green tests are not a production-security certification. See `docs/SECURITY.md`.

## Milestone documents

- `PRD.md` `ARCHITECTURE.md` `SCHEMA.md` `API_CONTRACT.md` `TASKS.md`
- `docs/SECURITY.md`
- `docs/research/TECHNICAL_REPORT.md`
