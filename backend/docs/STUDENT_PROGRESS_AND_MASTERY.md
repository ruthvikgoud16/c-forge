# Student progress and mastery

Canonical progress model for implementation from Milestone 2D. Event kinds and dimensions in [LEARNING_MASTERY_MODEL.md](LEARNING_MASTERY_MODEL.md) still apply; this file owns **placement versus mastery versus readiness** and the persistence plan.

## Current runtime (2D.1)

[`lib/learning/store.ts`](../lib/learning/store.ts) holds events, diagnostics, placements, and preferences in memory. [`lib/learning/persist.ts`](../lib/learning/persist.ts) writes the same rows to Postgres when `DATABASE_URL` is set and the learning migration has been applied. [`lib/curriculum/progress.ts`](../lib/curriculum/progress.ts) derives mastery from those events.

Derived topic mastery states remain: `started`, `practised`, `assessment_passed`, `mastered` via [`lib/mastery/types.ts`](../lib/mastery/types.ts). Placement is a separate map.

[`db/schema-curriculum.sql`](../db/schema-curriculum.sql) already defines `mastery_events` with owner-only RLS. The academy does not currently write that table when the in-memory store is used.

Opening a lesson records `lesson_opened` and is **not** mastery.

The student dashboard (`/learn`, `dashboardPayload.analytics`) reads the same events, placements, and `practice_assessment_attempts`. It does not store a second progress model. It does not publish examination readiness.

There is **no** placement state in the running app.

## Three scores

| Score | Question | Source | Derived values |
| --- | --- | --- | --- |
| Placement | What should I study now? | Diagnostics and explicit retakes | See ADAPTIVE_LEARNING_ARCHITECTURE.md |
| Mastery | What have I demonstrated over time? | `mastery_events` | `null`, `started`, `practised`, `assessment_passed`, `mastered` |
| Readiness | Am I prepared for this assessment? | Assessment attempts + `exam` dimension | per assessment: not started / in progress / met threshold |

Never publish a single “overall percent mastered” as if it were all three.

## Mastery derivation (keep)

- `started` — any event, including open
- `practised` — guided, independent, or knowledge check attempted
- `assessment_passed` — configured assessment threshold
- `mastered` — independent accuracy **and** retention probe **and** assessment passed

Hints raise assisted accuracy only. Tag one primary dimension per event.

## Persistence plan (2D, not 2C)

When `DATABASE_URL` is set:

1. `POST /api/v1/progress` inserts `mastery_events` for the authenticated student.
2. Placement writes go to `student_topic_placements` (proposed).
3. Diagnostic and assessment sessions persist with item results; answer keys never return to the browser except for items the product explicitly reveals after submit.
4. Recommendation snapshots may be stored for audit.

When `DATABASE_URL` is unset (local without Postgres): keep the in-memory fallback, same pattern as invitations. Document that restarts lose progress.

Browser localStorage is **not** authoritative. Server checks own the student.

Content version: store `curriculum_version` on events so a rewritten lesson does not silently re-interpret old results as mastery of the new payload.

## Privacy and RLS

- Students read and insert only their own `mastery_events`, placements, preferences, and attempts.
- `exercise_tests` remain unreadable to students.
- Faculty analytics (later) use a faculty role or service query that returns aggregates, never another student’s source or hidden stdin.

## Migration sketch

1. Add proposed tables in a new SQL file (2D). Do not alter seat-cap or judge tables.
2. Dual-write memory + Postgres if needed for one release.
3. Read-from-Postgres when a row exists.
4. Tests: restart simulation, owner isolation, opened ≠ mastered, placement ≠ mastered.
