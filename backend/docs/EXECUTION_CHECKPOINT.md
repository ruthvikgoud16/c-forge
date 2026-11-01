# Execution checkpoint

Recorded 2026-10-31 13:38 IST. No new implementation in this step. There is no git repository on disk.

## 1. Implemented and working

Milestone 1 vertical slice: invitation accept, 51-seat cap, session cookie, Hello CForge and add-two-integers exercises, hidden tests kept off the public DTO, judge client fail-closed when `JUDGE_URL` is missing. Teacher provider stays `unconfigured`.

Milestone 2A/2B: five official units and 35 topic wordings loaded from catalog JSON. Unit 1 topics 1–7 have lesson JSON and a lesson player. Topic 8 has no lesson. Progress distinguishes opened, practised, and mastered. Unit 1 mind map comes from the catalog.

Milestone 2D.1/2D.2: learning-state SQL with `FORCE ROW LEVEL SECURITY` and `SET LOCAL ROLE cforge_app`. Preferences, diagnostics (from Unit 1 lesson items only), placement `2d1-placement-v1`, and learning events. Memory store when `DATABASE_URL` is unset; production path refuses a silent memory store.

Milestone 2D.3 (code present; see tests for what was actually executed):

- Roster `26EG104G01`–`G51`, names null, idempotent seed `{ created, updated, alreadyPresent }`.
- Invite accept rejects unknown rolls and still requires a valid invitation.
- Prerequisite graph, recommendation, dashboard, path, diagnostic, and onboarding pages.
- Faculty name update at `POST /api/v1/faculty/roster`. No second account.
- Topic page lists lesson / notes / one-shot / practice / laboratory with honest `PLANNED` or `UNAVAILABLE` statuses. It is not the resource-card hub.

`lib/content` (`types.ts`, `compile.ts`, `drafts/unit1.ts`) builds in-memory packages for Unit 1 topics 1–7 only. Nothing imports it. No route, no test.

## 2. Files created or modified

No `.git`, so this is not a diff. Latest session surface:

Working 2D.3: `lib/roster/rolls.ts`, `lib/roster/store.ts`, `lib/curriculum/prerequisites.ts`, `lib/learning/recommend.ts`, `lib/learning/resources.ts`, `db/schema-roster.sql`, `scripts/migrate.mjs`, `app/api/v1/faculty/roster/route.ts`, `app/api/v1/me/route.ts`, `app/api/v1/dashboard/route.ts`, `app/api/v1/learn/path/route.ts`, `app/learn/page.tsx`, `app/learn/path/page.tsx`, `app/learn/topics/[id]/page.tsx`, `app/learn/onboarding/page.tsx`, `app/learn/diagnostic/page.tsx`, `components/academy-nav.tsx`, `components/preference-form.tsx`, `components/diagnostic-client.tsx`, `tests/roster.test.ts`, `tests/roster-privacy.test.ts`, `tests/prerequisites.test.ts`, `tests/recommend-path.test.ts`, `tests/learning-postgres.integration.test.ts`, `tests/e2e/milestone-2d3.spec.ts`, `playwright.config.ts`, `docs/STUDENT_ROSTER.md`, `docs/LEARNING_STATE_SECURITY.md`.

Saved after the last green run (not re-tested): the learn pages above, `playwright.config.ts`, `tests/e2e/milestone-2d3.spec.ts`, `tests/roster.test.ts`, `tests/prerequisites.test.ts`, `tests/learning-postgres.integration.test.ts`, and all of `lib/content/`.

## 3. Database migrations

SQL on disk: `db/schema.sql`, `db/schema-curriculum.sql`, `db/schema-learning.sql`, `db/schema-roster.sql`, `db/seed.sql`. `npm run migrate` applies them with `psql` only when `DATABASE_URL` is set.

`DATABASE_URL` is unset. Durable migration has not been run.

The Vitest integration test applied `schema.sql`, `schema-learning.sql`, and `schema-roster.sql` to a temporary embedded Postgres on port 55433, then shut it down. That is not a pending migration left half-applied. `schema-curriculum.sql` and `seed.sql` were not part of that test apply.

## 4. Tests run and exact results

One command, exit 0, ended 2026-10-31 13:24 IST (`07:54:39Z`):

```text
Test Files  20 passed (20)
     Tests  90 passed | 2 skipped (92)
  Start at  13:24:33
  Duration  992ms
```

The 2 skipped tests are `tests/judge.integration.test.ts` “local gcc isolate” (`describe.skipIf(!gccAvailable)`). Embedded Postgres log lines `new row violates row-level security policy` and `permission denied for table learning_events` were the expected denials inside the passing isolation test.

Playwright, same command, exit 0:

```text
Running 6 tests using 1 worker
  6 passed (4.3s)
```

All 6 are `tests/e2e/milestone1.spec.ts`. `tests/e2e/milestone-2d3.spec.ts` was written at 13:31 IST, after this run, and has not been executed.

## 5. Git

Branch: none. `/Users/ruthvik/Cforge/.git` does not exist. `/usr/bin/git` fails with `xcode-select: No developer tools were found`. Every file is uncommitted working-tree state. No remote.

## 6. Broken or unresolved

- Playwright 2D.3 spec is unrun. Learn pages and three Vitest files were saved after the green run and were not re-run.
- GCC isolate tests skipped. Docker judge was not run on this Mac.
- Topic page hardcodes readiness as “none yet”. Notes, one-shots, assessments, and labs stay `PLANNED` or `UNAVAILABLE`.
- `lib/content` is unused. Calling it would be a new feature, not a current failure.
- No production `DATABASE_URL`. Passing embedded-Postgres tests are not a production security certificate.
- Lesson JSON still includes in-lesson answer keys when a student opens a lesson.

## 7. Acceptance criteria still incomplete

- Topic resource hub (cards for every resource kind; disabled when missing). Current page is a short status list.
- Playwright: unknown roll, invitation still required, greeting is the roll not an invented name.
- `npm run migrate` against a real `DATABASE_URL`.
- Official college PDF page numbers.
- 20 unread Unit 999 labels.
- Unit 1 topic 8 laboratory sheet. Do not invent experiments.
- Milestone 2E resource pack and topic 1 upgrade. The `lib/content` drafts are not this milestone.
- Units 2–5 lessons (2F), revision/exam mode (2G), AI tutor (3), previous papers (4).
- Docker judge verification, git history, production security review.

## 8. Single next implementation task

Build the topic resource hub on `app/learn/topics/[id]/page.tsx`: one card per resource kind from `docs/STUDENT_EXPERIENCE.md`, link only when `topicAvailability` is `AVAILABLE`, disabled honest empty state otherwise. Do not import or extend `lib/content` in that task.

## 9. Commands to resume testing

```bash
export PATH="/Users/ruthvik/Cforge/.tools/node/bin:$PATH"
cd /Users/ruthvik/Cforge
npm test
npx playwright test
npx playwright test tests/e2e/milestone-2d3.spec.ts
```

`npm run migrate` only after `DATABASE_URL` is set. Git resume is blocked until Xcode command-line tools exist; do not `git init` as part of testing.
