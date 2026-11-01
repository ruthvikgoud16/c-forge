# Learning-state security verification (Milestone 2D.2 review)

This is a verification report, **not** a production-security certification.

## Database role

- Admin runs `db/provision-roles.sql`. Migration owner (`cforge`) applies `db/schema.sql`, `db/schema-learning.sql`, `db/schema-roster.sql`, `db/schema-assessments.sql`, `db/seed.sql`, then `db/seed-exercises-2f3b.sql` via `npm run migrate`. `schema-curriculum.sql` is not in the runtime ledger.
- Learning writes use `SET LOCAL ROLE cforge_app` inside a transaction after `SELECT set_config('cforge.student_id', <uuid>, true)`.
- `cforge_app` has SELECT/INSERT/UPDATE on learning tables. It does **not** have DELETE.
- `cforge_student` is NOLOGIN and used only as an RLS subject pattern from Milestone 1.

Production should set `DATABASE_URL` (and optionally `DATABASE_APP_URL`). The academy must not use a silent memory store.

## RLS behaviour

Learning tables have `ENABLE` **and** `FORCE ROW LEVEL SECURITY`. Policies require `student_id = current_student_id()`.

`current_student_id()` reads GUC `cforge.student_id`. If it is missing, the comparison is unknown and the row is denied.

Superuser connections bypass RLS. Application learning transactions therefore `SET LOCAL ROLE cforge_app`.

## Identity propagation

- HTTP identity comes only from the HMAC-SHA-256 session cookie (UUID + roll). Client `assessment_completed` / `knowledge_check` progress kinds are rejected.
- Body `studentId` / `student_id` is stripped.
- Persist helpers refuse non-UUID student ids (`missing_student_identity`).
- GUC is transaction-local (`set_config(..., true)`) so a pooled connection cannot keep the previous tenant.

## Connection pooling

`postgres` pool `max: 4`. Tenant GUC and role are `SET LOCAL` in `BEGIN` so they end at `COMMIT`/`ROLLBACK`. Do not set `cforge.student_id` on the session without `LOCAL`.

## Isolation tests

- In-process: `tests/learning-isolation.test.ts`.
- Live PostgreSQL as `cforge_app`: `tests/learning-postgres.integration.test.ts` (two students; cross read empty; cross write RLS deny; delete privilege deny; missing GUC insert deny; roster seed of 51; each student can SELECT only their own roster row).
- Uses `DATABASE_URL` when set, otherwise starts `embedded-postgres` (real PostgreSQL 18, role `cforge_app`, FORCE RLS). Observed: `new row violates row-level security policy` and `permission denied for table learning_events`.

## Production storage policy

| Mode | When |
| --- | --- |
| memory | Tests, or local with no `DATABASE_URL`, or `ALLOW_MEMORY_LEARNING=1` (non-production only) |
| postgres | `DATABASE_URL` present in development, **always** in production |

Production forbids `ALLOW_MEMORY_LEARNING`. Persist errors are 503. Successful 200/201 must not be returned after a failed write.

`GET /api/v1/ready` checks connectivity and required learning tables in production.

## Diagnostic integrity

Bank is built from existing Unit 1 lesson files. Public diagnostic DTOs omit `answer`. Grading uses the server bank. Client `topicId` / `method` / `correct` on submit are ignored. Two selected items per topic come from **different cognitive families**.

Student lesson GET and the lesson player receive `toPublicLesson`: prompts, hints, explanations, worked examples, and notes (including `examAnswer` study copy). Graded fields `body.trace.answer`, `body.predict.answer`, `body.independent.answer`, `body.guided.expected`, and `body.check[].answer` are stripped. In-lesson checks POST to `/api/v1/curriculum/lessons/:id/check`. Assessment GET/submit use `publicItem` / `publicReview` (no `answer`, `expected`, or item `explanation`).

## Legacy schema

`db/schema-curriculum.sql` `mastery_events.topic_id` UUID remains. It is unused. Catalog string ids are canonical. Do not drop the table in this gate.

## Known limitations

- Embedded Postgres binaries are a test dependency (`embedded-postgres`), not a production runtime.
- Server-side check is an oracle: a student can retry `/check` or assessment submit. Keys are not in the payload; rate limits are not this milestone.
- `notes.examAnswer`, flashcard backs, concept explanations, and worked-example outputs stay visible — they are teaching copy, not scored keys.
- Login, invitation accept, and hidden-test load use `cforge_app` plus `SECURITY DEFINER` accessors (012). Learning queries remain `SET LOCAL ROLE cforge_app` after the student GUC. Tables are owned by `cforge_owner` (2F.8.2). `DATABASE_URL` is the `cforge_app` login.
- Passing tests are not a production-security certificate.
