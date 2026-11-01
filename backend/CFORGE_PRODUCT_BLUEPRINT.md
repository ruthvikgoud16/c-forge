# CForge Product Blueprint

Milestone 2C. Design only. A document is not an implemented feature.

Canonical engineering contracts remain [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [SCHEMA.md](SCHEMA.md), [API_CONTRACT.md](API_CONTRACT.md), and [TASKS.md](TASKS.md). This file owns product vision, journeys, the feature map, and 2C acceptance evidence.

Section-by-section brief trace: [docs/M2C_SECTION_TRACE.md](docs/M2C_SECTION_TRACE.md). Simulator specs: [docs/VISUAL_SIMULATOR_CATALOG.md](docs/VISUAL_SIMULATOR_CATALOG.md).

## Product vision

CForge is a private C Programming Academy for exactly 51 first-year engineering students.

It is not a HackerRank clone, a PDF dump, an AI that writes programs, or a linear video course.

It combines deep teaching, syllabus-based structure, personalised paths, mind maps, notes, one-shot revision, a concept library, programming practice, visualisations, assessments, revision, mastery tracking, and (later) AI-assisted teaching.

**Positioning:** CForge is not an AI that writes C programs for students. It is an academy that teaches students to write C programs independently.

The academy must continually help each student answer:

1. What do I already understand?
2. What do I need to learn?
3. What should I practise next?
4. Can I solve this independently?
5. Am I actually improving?

## Target students

There are 51 seats. Students do not share one starting knowledge.

Journey examples (never stored as a global level):

- **Profile A — Absolute beginners:** little or no programming language; need ground-up explanations and guided practice.
- **Profile B — Intermediate:** can follow class examples; struggle to turn problems into algorithms.
- **Profile C — Stronger:** can write basic programs; need challenge, skip familiar introductions, and efficient revision.

A student may be beginner on one topic and demonstrated on another. **Never classify a student with one global beginner/intermediate/advanced label.**

## Product principles

1. Teach first. Judge second. AI last.
2. Official syllabus source labels are authoritative. Do not invent unread Unit 999 rows, lab lists, marks, or previous-year papers.
3. Placement, mastery, and readiness are three separate concepts.
4. Opening a lesson is not mastery. One easy MCQ is not exemption.
5. Every official topic remains reachable. Skip introductory instruction; do not hide the lesson.
6. Student C never compiles inside the Academy process.
7. Hidden tests, invitation tokens, and other students' histories stay private.
8. Distinguish ISO C from compiler-specific extensions (`strrev()`, and similar).
9. Prefer one Next.js academy process plus the existing judge. No microservices, Redis, or agent orchestration for 51 students.
10. Content is data-driven. UI does not own the syllabus.

## Current product maturity

Honest snapshot after Milestone 2B. Details: [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md).

| Area | Status |
| --- | --- |
| Invitation, 51-seat cap, login | Implemented (Milestone 1) |
| Monaco + dedicated GCC judge, Run/Submit | Implemented |
| Five official units in catalog | Implemented (screenshot source) |
| Unit 1 topics 2–7 deep lessons | Implemented and schema-verified |
| Unit 1 topic 1 deep lesson | Implemented at older 2A standard |
| Unit 1 topic 8 laboratory | Catalog only; experiments unknown |
| Units 2–5 lessons and resource packs | Catalog only; not written |
| Unit 999 | 17 visible labels; 20 unread |
| Topic resource hub | Lesson link only |
| Adaptive diagnostic / placement | Not implemented |
| Persistent progress | In-memory; SQL tables unused at runtime |
| Standalone notes, one-shots, flashcards, concept library | Not implemented |
| Interactive simulators | Not implemented |
| AI teacher | Interface only; unconfigured |
| Previous-year papers | No papers supplied |
| Git feature branch | Blocked; see [docs/GIT_AND_BRANCH.md](docs/GIT_AND_BRANCH.md) |

## Feature map

| Capability | Student value | Phase |
| --- | --- | --- |
| Invitation academy + judge | Safe practice | Implemented |
| Deep lessons | Learn from zero | Partial (U1 T1–T7) |
| Complete notes | Study and exam writing | Planned (2E+) |
| One-shots | Consolidated revision | Planned (2E+) |
| Mind maps | Relationships and navigation | Partial (Unit 1 catalog map) |
| Quick notes | Syntax and tables | Planned |
| Concept library | Reusable micro-explanations | Planned |
| Flashcards | Recall, not replacement of teaching | Planned |
| Worked-example library | Thought process + dry run | Partial (inside lessons) |
| Visual simulators | See execution | Planned (priority in roadmap) |
| Progressive coding practice | Independence | Partial (2 exercises) |
| Diagnostics and placement | Skip what is already known | Planned (2D) |
| Topic resource hub | One place per topic | Planned (2D) |
| Personalised dashboard | What next, from evidence | Planned (2D) |
| Persistent progress | Survive restart and devices | Planned (2D) |
| Topic/unit assessments | Check understanding | Planned (2E–2G) |
| Revision system | Weak topics and spaced review | Planned (2G) |
| Exam mode | Formal readiness without invented PYQ | Planned (2G) |
| Faculty aggregates | Class insight, no voyeurism | Future |
| AI teacher | Hints, not answers | Milestone 3 |
| Previous-paper intelligence | Only with real papers | Milestone 4 |

Coverage by topic: [docs/FIVE_UNIT_RESOURCE_MATRIX.md](docs/FIVE_UNIT_RESOURCE_MATRIX.md).

## User journeys

### Onboarding (preference, not a label)

After first login the student may choose one preference (skippable, revisable):

- Start from scratch
- Test existing knowledge
- Understand theory but struggle with coding
- Revise and prepare for examinations
- Improve problem-solving

Stored as `student_preferences.startIntent`. Never used as a permanent track.

### Beginner (from scratch)

Dashboard recommends Unit 1 topic 1 or a foundation SUPPORTING lesson if the block diagram is unfamiliar. Deep lesson → visual → guided practice → independent write. Placement stays `NEEDS_LEARNING` until evidence exists.

### Intermediate (class-ready, weak algorithms)

Preference `theory_weak_coding`. Diagnostic may mark some Unit 1 topics `DEMONSTRATED` for placement. Next step is algorithm/flowchart practice and independent programs, not another keyword lecture.

### Stronger (skip introductions)

Preference `test_knowledge`. Diagnostic uses at least two methods per claimed skip. Placement `DEMONSTRATED` unlocks later topics but mastery remains unproven until independent work and retention.

### Exam-focused

Preference `exam_revision`. Dashboard points at one-shots, quick notes, and exam-mode items **once those resources exist**. Until then, the UI must say they are planned, not invent a paper bank.

### All journeys

Every student can open any official topic. Remediation uses SUPPORTING or earlier OFFICIAL material only.

## Adaptive placement

Owned by [docs/ADAPTIVE_LEARNING_ARCHITECTURE.md](docs/ADAPTIVE_LEARNING_ARCHITECTURE.md).

Placement states: `NOT_ASSESSED`, `NEEDS_FOUNDATION`, `NEEDS_LEARNING`, `PARTIALLY_DEMONSTRATED`, `DEMONSTRATED`, `NEEDS_REVISION`.

Placement is not mastery. Mastery is not readiness.

## Five-unit resource architecture

Every official topic is designed to support, where appropriate: deep lesson, complete notes, one-shot, mind map, quick notes, concept links, worked examples, visualisation, practice, assessment, and a lab sheet only when a real laboratory list exists.

Resource contracts: [docs/CONTENT_RESOURCE_MODEL.md](docs/CONTENT_RESOURCE_MODEL.md).

Topic page: [docs/STUDENT_EXPERIENCE.md](docs/STUDENT_EXPERIENCE.md).

Academic rules:

- Preserve source labels from [content/curriculum/catalog.json](content/curriculum/catalog.json).
- Screenshot lesson-plan wording is the current official source. PDF page numbers are pending.
- `strrev()` is non-standard C.
- C passes arguments by value; “call by reference” is taught as passing an address.
- Laboratory topics stay pending until a real experiment list is supplied.
- Unit 999 is not a sixth official unit. Twenty unread entries are not invented.

## Learning engine

A prerequisite graph (not syllabus order alone) drives recommendations. Multiple routes are valid. Required prerequisites still surface.

Initial graph: [docs/ADAPTIVE_LEARNING_ARCHITECTURE.md](docs/ADAPTIVE_LEARNING_ARCHITECTURE.md#prerequisite-graph).

Next-step function inputs: preference, placement, unmet prerequisites, recent practice, and available resources. Output is a recommendation, never a locked gate.

## Assessment engine

Kinds: onboarding diagnostic, topic checkpoint, unit assessment, coding assessment, revision check, exam mode, later integrated syllabus assessment.

Conceptual understanding, programming proficiency, and examination readiness are separate. Exam readiness uses only configured exam-mode items. No fabricated marks or previous-year patterns.

## Mastery model

Owned by [docs/STUDENT_PROGRESS_AND_MASTERY.md](docs/STUDENT_PROGRESS_AND_MASTERY.md).

Opening ≠ practised ≠ assessment passed ≠ mastered. Hint-heavy success is assisted accuracy only.

## Analytics and privacy

Per-student events are owner-only (RLS). Other students never see attempts or source.

Faculty (later, faculty token): aggregates such as “topics with highest error rate”, not named attempt dumps in a student UI. No public leaderboard unless separately justified. Hidden tests never appear in analytics payloads.

## UX navigation

Dashboard · Learn · Study Materials · Practice · Revision · Assessments · Laboratory · My Progress. Previous Papers stays hidden until papers exist.

Design direction only. No visual redesign in 2C. See [docs/STUDENT_EXPERIENCE.md](docs/STUDENT_EXPERIENCE.md).

## Data, APIs, persistence

Proposed entities and endpoints are DESIGN. They are not implemented in this milestone.

See [SCHEMA.md](SCHEMA.md) and [API_CONTRACT.md](API_CONTRACT.md). Browser state is never authoritative.

## AI (future)

Model-agnostic `TeacherProvider`. Curriculum-grounded hints. Never override the judge. Never reveal hidden tests. No fake AI responses. Policy: [docs/AI_TEACHING_POLICY.md](docs/AI_TEACHING_POLICY.md).

## Phased roadmap

Owned by [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md).

**First implementation milestone after this blueprint: 2D — Learning Platform Core.**

## Dependencies

- Official PDF (optional for current OFFICIAL screenshot units; required for page numbers).
- Laboratory manuals (required before lab sheets).
- Previous papers (required before Milestone 4).
- `DATABASE_URL` (required for persistent progress in 2D).
- Xcode CLI / git (required for a real feature branch).
- Linux + Docker + GCC (required to verify isolate tests).
- Faculty token already exists for invitations.

## Risks

| Risk | Mitigation |
| --- | --- |
| Forgetting resource types | Matrix is the gate; 2C test checks every official topic id |
| Collapsing placement into mastery | Three-score rule in progress doc and APIs |
| Inventing labs / PYQ / Unit 999 | Status `U`; tests forbid weightage/PYQ invention |
| Building content before the hub | 2D platform first, 2E content |
| Over-engineering | One academy process; reuse judge |
| In-memory progress loss | 2D Postgres write path |
| Doc drift (OFFICIAL vs PDF) | Screenshot official; PDF pages pending |

## Unresolved decisions (do not block 2C)

| Topic | Evidence | Recommended option | Trade-off | Needed by |
| --- | --- | --- | --- | --- |
| Diagnostic length | 51 first-years, mixed prior knowledge | 12–20 items, 2 methods before skip | Longer vs fatigue | 2D |
| Spaced review | Educational benefit unclear at this scale | Simple “needs revision” queue in 2G; no cron engine | Simpler vs optimality | 2G |
| College roll format | Unresolved in Milestone 1 | Keep opaque roll identifier | Faculty must issue invites | Roster milestone |
| Nested Docker isolate | Not verified on this Mac | Keep process isolate as default in judge container | Weaker local proof | Ops |

## Features intentionally not implemented in 2C

Dashboard, diagnostics, placement writes, topic hub UI, Postgres progress, new APIs, simulators, new lessons, AI, PYQ bank, auth/judge/seat-cap changes, visual redesign.

## 2C acceptance evidence

| Criterion | Evidence |
| --- | --- |
| Repository audited | This file § Current product maturity |
| M1 and 2A/2B documented honestly | This file + TASKS.md |
| Five-unit experience designed | This file + matrix + experience doc |
| Resource ecosystem specified | CONTENT_RESOURCE_MODEL.md |
| Separate contracts for lessons, notes, one-shots, mind maps | CONTENT_RESOURCE_MODEL.md |
| Adaptive onboarding and diagnostic defined | ADAPTIVE_LEARNING_ARCHITECTURE.md |
| Skip introductions with evidence | Placement `DEMONSTRATED` rule |
| Placement ≠ mastery | STUDENT_PROGRESS_AND_MASTERY.md |
| Topic hub defined | STUDENT_EXPERIENCE.md |
| Prerequisite graph documented | ADAPTIVE_LEARNING_ARCHITECTURE.md |
| Persistent progress designed | STUDENT_PROGRESS_AND_MASTERY.md + SCHEMA.md |
| Entities and APIs documented | SCHEMA.md + API_CONTRACT.md |
| Privacy specified | This file + SCHEMA RLS |
| UX journeys documented | STUDENT_EXPERIENCE.md |
| Coverage matrix for all five units | FIVE_UNIT_RESOURCE_MATRIX.md |
| Unknown academic material flagged | Matrix status `U` |
| AI and PYQ remain future | Roadmap + this file |
| Milestone 1 security preserved | No auth/judge/RLS code changes in 2C |
| Dependency-aware roadmap | IMPLEMENTATION_ROADMAP.md |
| Consistency tested | `tests/milestone-2c-docs.test.ts` |
