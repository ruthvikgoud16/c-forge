# CForge Schema — Milestone 1

Canonical SQL: `db/schema.sql`. Seed: `db/seed.sql`.

## Tables

### `students`

| Column | Notes |
| --- | --- |
| `id` | UUID |
| `roll_identifier` | Unique login key. Opaque. No invented college format. |
| `password_hash` | scrypt |
| `status` | `active` or `revoked` |
| `created_at` | timestamptz |

Active seat cap: 55. Enforced by a trigger on insert/update to `active`. Applied schema used 51; ledger `007` replaces the function to 55.

### `invitations`

| Column | Notes |
| --- | --- |
| `id` | UUID |
| `token_hash` | SHA-256 of the raw token |
| `expires_at` | timestamptz |
| `consumed_at` | null until used |
| `consumed_by` | student id |
| `created_at` | timestamptz |
| `roll_number` | official roster roll; immutable after insert (ledger `008`) |
| `revoked_at` | set when faculty revokes an unused invite |

Raw tokens are never stored. New invitations require `roll_number` referencing `student_roster`. One unconsumed, unrevoked, unexpired invite per roll.

### `exercises`

Public metadata only: slug, title, objective, statement, input/output format, constraints, starter code. Seed includes the Milestone 1 pair plus ten 2F.3 academy practice rows (`db/seed.sql`). Ten more rows are added by additive ledger `2026-10-31_006_exercise_bank_2f3b` (`db/seed-exercises-2f3b.sql`). Hidden cases stay in `exercise_tests`. Reference C is not stored in SQL.

### `exercise_tests`

| Column | Notes |
| --- | --- |
| `visibility` | `sample` or `hidden` |
| `stdin` | server-side |
| `expected_stdout` | server-side |
| `ordinal` | run order |

RLS: authenticated students cannot `SELECT` this table. The academy uses a table owner / bypass role.

### `submissions`

Student id, exercise id, mode (`run`/`submit`), verdict, compiler/runtime summaries **without** expected outputs, created_at. Source is stored for the owner only.

## RLS policy intent

- `students`: a student role can read/update only `id = current_student_id()`.
- `submissions`: owner-only select.
- `exercises`: select public rows.
- `exercise_tests`: no student select.
- `invitations`: no student select.

`current_student_id()` reads a session GUC set by the academy after cookie authentication when using the restricted role.

## Curriculum tables (additive)

Canonical SQL: `db/schema-curriculum.sql`.

`curriculum_versions`, `curriculum_units`, `curriculum_topics`, `curriculum_prerequisites`, `curriculum_subtopics`, `lesson_documents`, `lesson_exercise_links`, `mastery_events`.

Every unit, topic, and lesson has `classification` in `{OFFICIAL, SUPPORTING, EXTENSION, LEGACY_UNVERIFIED}`. Live official rows come from `content/curriculum/catalog.json` (screenshot lesson plans). SQL still seeds a `pending-syllabus-pdf` version for future PDF page numbers; that version is not the student catalog.

`lesson_documents.body` is JSON following `docs/LESSON_CONTENT_STANDARD.md`.

`mastery_events` are owner-only under RLS. Opening a lesson is not stored as mastery.

`mastery_events.topic_id` (UUID) is unused at runtime. Catalog topics are text ids.

## Learning state (Milestone 2D.1)

Canonical SQL: `db/schema-learning.sql`. Applied by `npm run migrate` after `db/schema.sql` (curriculum SQL is not in the runtime ledger).

| Table | Purpose |
| --- | --- |
| `student_preferences` | `start_intent` only — not a skill label |
| `diagnostic_sessions` | Open/submitted; `rubric_version`, `curriculum_version` |
| `diagnostic_session_items` | Item ids on a session |
| `diagnostic_answers` | Owner responses; keys stay out of GET payloads |
| `student_topic_placements` | Placement state per catalog `topic_id` text |
| `learning_events` | Lesson progress and diagnostic evidence |
| `assessment_attempts` | Diagnostic completion history (2D) |
| `practice_assessment_attempts` | Topic/unit practice attempts: scores, responses, topic evidence (2F.1) |

Without `DATABASE_URL` (non-production), the same shapes live in process memory (`lib/learning/store.ts`). Production never uses that fallback. Hydration copies Postgres rows into memory when the database is present. Missing history stays `NOT_ASSESSED` / null mastery — never invented as mastered.

Learning tables: `ENABLE` + `FORCE ROW LEVEL SECURITY`. Writes run as `cforge_app` with transaction-local `cforge.student_id`. See [docs/LEARNING_STATE_SECURITY.md](docs/LEARNING_STATE_SECURITY.md).

## Student roster (2D.3)

Canonical SQL: `db/schema-roster.sql`.

| Table | Purpose |
| --- | --- |
| `student_roster` | 55 official rolls; `display_name` nullable |
| `roster_name_audit` | Faculty name changes |

Seeding is `ON CONFLICT DO NOTHING`. Roster rows are not activated accounts. Students see only their own roll under RLS.

Practice assessments persist in `practice_assessment_attempts` (`db/schema-assessments.sql`) with FORCE RLS and the same `cforge_app` + `cforge.student_id` GUC pattern as learning writes. Memory store is local/test only. Faculty paper/lab uploads remain in-process memory until a real source exists.

### Legacy (do not drop)

`db/schema-curriculum.sql` still defines UUID `curriculum_topics` and `mastery_events`. Those objects are **unused** at runtime. Catalog string ids (`u1-t2`) are the learning-state identifiers. Leave the old tables in place until a later migration copies or retires them with a written plan.

## Proposed tables (later — not 2D.1)

Do not add a table per visualisation widget. Reuse typed payloads.

| Proposed table | Purpose |
| --- | --- |
| `content_resources` | Typed notes, one-shots, mind maps, visuals, assessments |
| `resource_topic_links` | Many-to-many reuse |
| `concept_entries` | Searchable micro-explanations (may be a `content_resources` type instead) |
| `flashcard_decks` / `flashcard_cards` | Recall decks |
| `student_preferences` | Onboarding intent; not a skill label |
| `diagnostic_sessions` / `diagnostic_answers` | Adaptive placement evidence |
| `student_topic_placements` | Placement state per topic; separate from mastery |
| `assessment_definitions` / `assessment_attempts` / `assessment_item_results` | Checkpoints; keys stay server-side |
| `recommendation_snapshots` | Optional audit of next-step output |

Entity coverage (existing or proposed; visual types share `content_resources`):

curriculum versions, units, topics, subtopics, prerequisites, content resources + versions, notes/one-shots/mind maps/visuals as payloads, concept entries, flashcard decks/cards, worked examples, exercises + hidden tests, assessments + questions + server-side answer keys, diagnostic sessions, topic placements, lesson/mastery events, exercise submissions, assessment attempts, revision/recommendation snapshots. Faculty analytics are queries, not a student-readable table.

Populate existing `curriculum_prerequisites` from the graph in [docs/ADAPTIVE_LEARNING_ARCHITECTURE.md](docs/ADAPTIVE_LEARNING_ARCHITECTURE.md) during 2D.

Student result rows must store `curriculum_version` so content edits do not silently rewrite history.

RLS: owner-only on all student intelligence tables. Faculty aggregates later use a faculty token, never student-to-student reads. `exercise_tests` remain unreadable to students.
