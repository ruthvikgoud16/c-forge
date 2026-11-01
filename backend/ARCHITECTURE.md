# CForge Architecture

Product modules and learning engines (design): [CFORGE_PRODUCT_BLUEPRINT.md](CFORGE_PRODUCT_BLUEPRINT.md), [docs/ADAPTIVE_LEARNING_ARCHITECTURE.md](docs/ADAPTIVE_LEARNING_ARCHITECTURE.md), [docs/CONTENT_RESOURCE_MODEL.md](docs/CONTENT_RESOURCE_MODEL.md).

## Milestone 1 process model (implemented, unchanged)

## Processes

```
Browser  →  Next.js academy (no GCC)
                │
                ├── Postgres (RLS)
                └── HTTP + shared secret → Judge service (Docker + GCC)
```

The academy never compiles or executes student C. `lib/academy/refuse-in-process.ts` fails closed if in-process compilation is attempted.

## Trust boundaries

1. Browser is untrusted. It may send source and custom stdin only.
2. Academy authenticates students, authorizes exercise access, and strips hidden fields from DTOs.
3. Judge trusts only requests that present `JUDGE_SECRET`. It does not know about students.
4. Student binaries run inside the judge isolation layer, not in the Next.js process.

## Academy

- Next.js App Router.
- Session cookie: httpOnly, Secure in production, SameSite=Lax, HMAC-signed payload.
- API routes under `/api/v1/*`.
- Execute route is the only path that talks to the judge.

## Judge

- Separate Node service in `services/judge`.
- Listens on an internal port.
- For each submission: temp workspace → `gcc -O0 -std=c11` → run as non-root with limits → delete workspace.
- Isolation modes:
  - `process` (default when the judge container is already the sandbox).
  - `docker` (optional nested `docker run --network=none` with memory/pids/cpu).

## Data

See `SCHEMA.md`. Hidden tests live in `exercise_tests` with `visibility = hidden` and are selected only by the academy service role. The 2F.3 bank is twenty-two academy C problems mapped in `lib/academy/exercise-bank.ts`.

## Production fail-closed

If `NODE_ENV=production` and `JUDGE_URL` is missing or blank, execute endpoints return HTTP 503. There is no localhost default in production.

## Curriculum and teaching intelligence (partially implemented)

```
Browser → Academy
            ├── Curriculum catalog JSON (versioned, classified)
            ├── Learning state (memory + optional Postgres `schema-learning.sql`)
            ├── TeacherProvider interface (unconfigured; no vendor SDK)
            └── Existing judge execute path (unchanged)
```

Logical engines live in the same Next.js process (no extra services).

**2D.1 / 2D.2 implemented:** preferences, diagnostic sessions from existing Unit 1 lesson items, placement evaluation (`2d1-placement-v1`), learning events, dashboard/next/placement/topic-hub APIs. Identity is the session cookie only.

**2D.2 review:** production requires Postgres (`GET /api/v1/ready`). Learning writes use `SET LOCAL ROLE cforge_app` and `set_config('cforge.student_id', …, true)`. Persist failures return 503. Memory store is tests/local only. Details: [docs/LEARNING_STATE_SECURITY.md](docs/LEARNING_STATE_SECURITY.md).

**2D.3 / 2F.5:** 55-roll roster (not 55 activated accounts), prerequisite graph, recommendation engine, `/learn` path and diagnostic UI. Names stay null until faculty import. `/faculty` uses Bearer faculty auth.

**Academy completion:** Topic Resource Hub, Units 1–5 teaching packages, eight visualisers, topic/unit practice assessments, PYQ/lab ingest (empty until faculty source). Recommendation engine unchanged except availability now reflects built resources.

**2F.1:** Practice assessment attempts persist in PostgreSQL (`practice_assessment_attempts`) with FORCE RLS. Scoring stays in-process from the authored bank. Production fails closed if persist fails. Dashboard and `recommendNext` still use placement + learning events; they do not read client-supplied scores.

Discrepancy reconciled: `schema-curriculum.sql` `mastery_events.topic_id` is a UUID FK to unseeded `curriculum_topics`. Runtime catalog IDs are text (`u1-t2`). Learning state uses **text topic ids** in `db/schema-learning.sql`.

Do not add Redis, extra services, or agent orchestration.

- Lesson coding still uses `/api/v1/execute`. GCC stays in the judge service.
- `lib/ai/provider.ts` is the only place a future model adapter should be constructed.
- Retrieval must use verified catalog rows. Official rows are the five screenshot units. PDF pages remain pending.
- AI must never sit on the compile/execute path or override judge results.
- Placement is not mastery. Mastery is not readiness.

See `db/schema-curriculum.sql` and proposed tables in `SCHEMA.md`. Milestone 1 security boundaries are unchanged.
