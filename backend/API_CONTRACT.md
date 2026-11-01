# CForge API Contract — Milestone 1

All JSON. Session cookie `cforge_session` after login.

## Auth

### `POST /api/v1/auth/invite/accept`

Body: `{ "token": string, "rollIdentifier": string, "password": string }`

- 201: `{ "ok": true, "rollIdentifier": string }` and session cookie. Identity is the invitation’s bound official roll.
- 409: seat cap (`SEAT_CAP`) or `already_registered`.
- 400: `unknown_roll`, `revoked_invitation`, `invalid_invitation` (unknown/expired/unbound/wrong roll), or `weak_password`. HTTP never returns `roll_mismatch`; the accept function still uses that code internally.
- 401: missing token.

Password minimum: 10 characters. The roll must match the invitation’s bound official roll.

### `POST /api/v1/auth/login`

Body: `{ "rollIdentifier": string, "password": string }` → 200 + cookie, or 401.

### `POST /api/v1/auth/logout`

Clears cookie.

### `GET /api/v1/auth/me`

200 `{ "rollIdentifier": string }` or 401.

## Faculty (not student-facing)

### `POST /api/v1/faculty/invitations`

Header: `Authorization: Bearer $FACULTY_TOKEN`

Body: `{ "rollNumber": string, "ttlHours"?: number, "revoke"?: boolean }`

`rollNumber` is required and must be an official unregistered roll. Default TTL 168 hours, max 720.

201 mint: `{ "token": string, "expiresAt": string, "rollNumber": string }` — raw token shown once.

200 revoke: `{ "rollNumber": string, "revoked": true }`.

409: `duplicate_invitation` or `already_registered`. 400: `unknown_roll` or `missing_roll`.

## Exercises

### `GET /api/v1/exercises/:id`

Authenticated. Returns public DTO only:

```json
{
  "id": "uuid",
  "slug": "hello-cforge",
  "title": "Hello, CForge!",
  "objective": "...",
  "statement": "...",
  "inputFormat": "...",
  "outputFormat": "...",
  "constraints": "...",
  "sample": { "stdin": "", "stdout": "Hello, CForge!\n" },
  "starterCode": "...",
  "language": "c"
}
```

No `tests`, no hidden stdin, no expected outputs beyond the public sample.

Lookup accepts UUID or slug. The 2F.3 bank is twenty-two academy problems (two starters + twenty practice). See [docs/JUDGE_EXERCISE_BANK.md](docs/JUDGE_EXERCISE_BANK.md). None are official labs.

## Execute

### `POST /api/v1/execute`

Authenticated.

```json
{
  "exerciseId": "uuid",
  "source": "string",
  "mode": "run" | "submit",
  "stdin": "optional custom stdin for run"
}
```

**Run 200:** `{ "mode":"run", "status":"ok"|"compile_error"|"runtime_error"|"timeout"|"internal_error", "stdout": "...", "stderr": "...", "compiler": "..." }`

**Submit 200:** `{ "mode":"submit", "verdict":"accepted"|"wrong_answer"|"compile_error"|"runtime_error"|"timeout"|"internal_error", "passed": 2, "total": 4, "tests": [ { "ordinal": 1, "passed": true } ] }`

Submit test objects must not include `stdin`, `expected`, or `visibility`.

**503** when production judge configuration is missing (`code: JUDGE_UNAVAILABLE`).

**401** unauthenticated.

## Curriculum (foundation)

### `GET /api/v1/curriculum`

Authenticated. Returns official unit summaries, foundation metadata, source type `teacher_lesson_plan_screenshots`, and per-topic mastery **state** (opened is not mastered).

Also:

- `GET /api/v1/curriculum/units/:slug`
- `GET /api/v1/curriculum/lessons/:id` (records `lesson_opened` only). Public lesson: teaching text, prompts, hints, worked examples. No `answer`, `expected`, or in-lesson check keys.
- `POST /api/v1/curriculum/lessons/:id/check` `{ slot: "trace"|"predict"|"guided"|"independent"|"check", value, itemId? }`. Server grades. **200** `{ correct, itemId, unscored }` — no expected string. Client `correct` is ignored.
- `POST /api/v1/progress` `{ topicId, lessonId?, kind, dimension, assisted }`. Client `correct` is ignored.

Teaching assistant HTTP is not exposed. `TeacherProvider` is unconfigured. Hidden tests are never included.

## Learning platform (2D.1 / 2D.2 — live)

Identity is always the session cookie. A body `studentId` is ignored.

Invitation accept requires an official roll (`26EG104G01`–`26EG104G55`, uppercase). Unknown rolls: **400** `unknown_roll`. Roster membership does not skip the invitation.

### `GET /api/v1/me`

Own roll, optional `displayName`, greeting. **401** if not logged in.

### `GET /api/v1/learn/path`

Own recommended next step and per-topic placement/mastery/availability. `guidanceOnly: true`.

### `GET/POST /api/v1/faculty/roster`

Faculty token. GET lists 55 official rolls plus account status. POST `{ updates: [{ rollNumber, displayName }] }` sets names without creating accounts. `POST /api/v1/faculty/roster/import` applies the verified CSV names. Placement, mastery, and readiness in a request body are rejected (`derived_state_not_writable`). Persist failures: **503** `LEARNING_PERSIST_FAILED`.

### `GET /api/v1/faculty/overview`

Faculty token. Cohort capacity 55, approved roster, active accounts, pending invitations, available seats, unit-wise recorded progress, assessment score buckets (omitted when fewer than three students), common revisit topics. No answer keys or hidden tests.

### `GET/POST /api/v1/faculty/invitations`

Faculty token. GET lists pending/consumed/revoked invitations with bound roll numbers and never raw tokens. POST mints or revokes a roll-bound invitation. Faculty SQL uses `FACULTY_DATABASE_URL` after Bearer auth. Missing faculty DB credentials: **503** `FACULTY_PERSIST_FAILED`. Login, invite, check, submit, and judge routes may return **429** `{ error: "rate_limited", retryAfterSec }` with `Retry-After`. Production uses a shared PostgreSQL token bucket (`014`).

### `GET /api/v1/ready`

Production: **200** only if Postgres answers and learning tables exist. **503** if `DATABASE_URL` is missing, the connection fails, or migrations are incomplete. Non-production may report `storage: "memory"`.

### `GET /api/v1/curriculum/topics/:id`

Authenticated. Topic hub: source label, classification, placement, mastery, readiness, `resources` from `hubCards`, `recommendedNext`. Lessons stay listed regardless of placement.

### `GET /api/v1/assessments/:id`

`topic:{topicId}` or `unit:{unitId}`. Public items only (no answers, no explanations). Includes the caller’s attempt history (no keys). **401** if anonymous. Persist failure: **503**.

### `GET /api/v1/assessments/:id/attempts`

Own attempts for that assessment id. No answer keys.

### `POST /api/v1/assessments/:id/submit`

Body `{ responses: { itemId: string } }`. Server scores. Client score, attempt number, placement, mastery, readiness, and studentId are rejected. **200** `{ earned, total, review: [{ id, topicId, family, correct, marks, max }], byTopic }` — no `expected`, no item `explanation`. Optional `Idempotency-Key` header retries the same stored attempt. Persist failure: **503** `LEARNING_PERSIST_FAILED` (no silent memory fallback in production).

### `GET/POST /api/v1/faculty/papers` and `/api/v1/faculty/labs`

Faculty token. Empty until a real source is posted. No invented trends.

### `GET/POST /api/v1/onboarding/preferences`

Body: `{ "startIntent": "from_scratch" | "test_knowledge" | "theory_weak_coding" | "exam_revision" | "problem_solving" }`. Preference only. Not a global student level.

### `GET /api/v1/diagnostics`

Own session history (ids, status, timestamps). No keys.

### `POST /api/v1/diagnostics`

Starts a diagnostic. **201** public items only (no answers). Items come from existing Unit 1 lesson checks/traces/predicts — not college papers.

### `GET /api/v1/diagnostics/:id`

Owner only. **404** for another student’s id.

### `POST /api/v1/diagnostics/:id/submit`

Body: `{ "answers": [ { "itemId", "value" } ] }`.

- 200: `{ graded: [{ itemId, correct, topicId }], placements, rubricVersion }` — no expected answers.
- 400: invalid/unknown item.
- 409: duplicate answer or already submitted.
- 404: missing or not owned.

Completing a session writes placement with rubric `2d1-placement-v1`. Two **different** methods are required for `DEMONSTRATED`. Placement is not mastery.

### `GET /api/v1/placement`

Per-topic placement, mastery, and readiness. `placementIsNotMastery: true`.

### `GET /api/v1/learn/next`

`{ topicId, resourceType, reason, unmetPrerequisites, startIntent }`.

### `GET /api/v1/dashboard`

Server-computed continue/next and per-topic placement vs mastery.

### `POST /api/v1/progress`

Persists a learning event for the session student. Returns mastery `state` and `placement`.

### `GET /api/v1/faculty/analytics` (later)

Faculty token only. Not implemented in 2D.1.

Execute, invitation, seat-cap, and DTO stripping rules above do not change.
