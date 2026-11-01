# CForge Product Requirements

CForge is a private C programming academy for exactly 55 first-year engineering students.

Positioning: CForge is not an AI that writes C programs for students. It is an academy that teaches students to write C programs independently.

Product definition (vision, journeys, feature map): [CFORGE_PRODUCT_BLUEPRINT.md](CFORGE_PRODUCT_BLUEPRINT.md). Topic coverage: [docs/FIVE_UNIT_RESOURCE_MATRIX.md](docs/FIVE_UNIT_RESOURCE_MATRIX.md).

## Milestone 1 outcome

A complete, secure, independently testable vertical slice:

1. Invitation-only student access with a hard cap of 55 active seats.
2. A dedicated Docker GCC judge that the academy process never replaces.
3. One original beginner exercise: **Hello, CForge!**
4. A student workspace with Monaco, custom stdin, Run, and Submit.
5. Hidden tests that never leave the server.
6. Production fails closed when `JUDGE_URL` is missing.

## In scope

- Environment validation and removal of insecure production defaults.
- Judge isolation: non-root, no student-code network, CPU/memory/time/process limits, per-submission workspace, cleanup.
- Invitation accept + roll-identifier/password login.
- Database-level access controls (Postgres RLS) for student rows and hidden tests.
- Unit, integration, and Playwright coverage for the required cases.

## Out of scope (still)

- AI tutor, public leaderboard, public registration.
- Invented official laboratory lists or previous-year papers. Ingest APIs exist; banks stay empty until faculty uploads.
- Invented student names. The approved roster is 26EG104G01–G55; names stay null until faculty import.
- Claiming production security certification from functional tests.
- Inventing laboratory lists, unread Unit 999 entries, or examination weightage.

## Access rules

- No public sign-up.
- A student is created only by consuming a single-use invitation.
- Active seat count must never exceed 55. Enforcement is application-level and database-level.
- Roll identifier is an opaque unique login key. Format is not college-validated in this milestone.

## Run versus Submit

| Action | Input used | Tests used | Browser receives |
| --- | --- | --- | --- |
| Run | Custom stdin, or the public sample if stdin is empty | None of the hidden suite | Compilation text, stdout/stderr, status |
| Submit | Each server-side test stdin | Full sample + hidden suite | Per-test pass/fail and status only |

Hidden stdin and expected outputs are never included in API responses or HTML.

## Success criteria

See `docs/MILESTONE1.md`. Functional tests passing is not a production-security claim.

## Academic foundation

Programming education is the primary experience. Curriculum is hierarchical, classified, and versioned. The five official units come from the teacher’s lesson-plan screenshots. That wording is the current official source. The college PDF is still absent, so page numbers, marks, and unread Unit 999 rows are not invented.

See `docs/CURRICULUM_ARCHITECTURE.md`, `docs/SYLLABUS_INGESTION.md`, `docs/AI_TEACHING_POLICY.md`, `docs/STUDENT_PROGRESS_AND_MASTERY.md`, and `docs/ADAPTIVE_LEARNING_ARCHITECTURE.md`.

Placement, mastery, and readiness are three separate scores. Students are never stored as one global beginner/intermediate/advanced label.

## Milestone 2C (this update)

Architecture and documentation only. No new student-facing features. Milestone 1 access and judge rules above still apply.

## Milestone 2D.1 / 2D.2

Persistent learning records (memory + optional Postgres), diagnostic sessions from existing Unit 1 lesson items, and server-side placement. Placement is not mastery. Invitation, seat cap, and judge rules are unchanged.
