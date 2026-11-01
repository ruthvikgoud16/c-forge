# Milestone 2C — Sections 1–19 evidence

Trace of the complete product-blueprint brief. Each section is **designed and documented**. None of the unbuilt product features are claimed as implemented.

## 1. Role

Work is architecture and product definition. Implementation of the platform is deferred to 2D+. Owner: this milestone, not a code rewrite.

## 2. Product vision

[CFORGE_PRODUCT_BLUEPRINT.md](../CFORGE_PRODUCT_BLUEPRINT.md) states the academy positioning, the twelve capability areas, Profiles A/B/C as **journeys only**, and the rule: never store one global beginner/intermediate/advanced label.

## 3. Repository audit

Factual summary in the blueprint § Current product maturity and below.

**Implemented:** invitation login; 51-seat cap; Monaco; Run/Submit; dedicated judge; hidden-test stripping; fail-closed `JUDGE_URL`; catalog of 5 official units / 35 topics; Unit 999 with 17 visible labels; Unit 1 lessons T1–T7; Unit 1 mind map; lesson schema tests; in-memory progress with opened ≠ mastered.

**Not implemented / not supplied:** labs; Units 2–5 lessons; 20 unread Unit 999 labels; official PDF; previous papers; persistent progress writes; diagnostics; topic hub; standalone notes/one-shots/flashcards/concepts; simulators; AI provider; git on this disk.

Do not redesign from scratch. Do not claim unfinished work exists.

## 4. Complete product — onboarding and placement

[docs/ADAPTIVE_LEARNING_ARCHITECTURE.md](ADAPTIVE_LEARNING_ARCHITECTURE.md):

- Preferences: `from_scratch`, `test_knowledge`, `theory_weak_coding`, `exam_revision`, `problem_solving`
- Optional diagnostic; all topics remain reachable
- Two-method rule before placement `DEMONSTRATED`
- States: `NOT_ASSESSED`, `NEEDS_FOUNDATION`, `NEEDS_LEARNING`, `PARTIALLY_DEMONSTRATED`, `DEMONSTRATED`, `NEEDS_REVISION`
- Placement is revisable and is not mastery

## 5. Content ecosystem

Contracts: [CONTENT_RESOURCE_MODEL.md](CONTENT_RESOURCE_MODEL.md).

| Type | Separate contract | Status |
| --- | --- | --- |
| Deep lessons | Yes (17-part bar) | Partial U1 |
| Complete notes | Yes (not embedded lesson notes) | Planned |
| One-shots | Yes (not a summary) | Planned |
| Mind maps | Data-driven | Partial U1 |
| Quick notes | Yes (short vs complete notes) | Planned |
| Concept library | Yes, reusable | Planned |
| Flashcards | Reinforce, not replace | Planned |
| Worked examples | Library contract | Partial embed |
| Visual simulators | Per-tool spec | Designed, not built — [VISUAL_SIMULATOR_CATALOG.md](VISUAL_SIMULATOR_CATALOG.md) |
| Coding practice | Reuse judge | 2 exercises |
| Revision | 2G; no cron engine yet | [REVISION_AND_ASSESSMENT.md](REVISION_AND_ASSESSMENT.md) |
| Assessments | Distinct from mastery | Designed |

## 6. Five-unit coverage

[FIVE_UNIT_RESOURCE_MATRIX.md](FIVE_UNIT_RESOURCE_MATRIX.md) — 35 official source labels. Labs `U`. `strrev()` and pass-by-value accuracy notes preserved. Unit 999 is not a sixth unit.

## 7. Personalised dashboard

[STUDENT_EXPERIENCE.md](STUDENT_EXPERIENCE.md). Recommendations from evidence, not stored Profile A/B/C.

## 8. Topic resource hub

Same file. One page; missing resources show matrix status; no fake content.

## 9. Adaptive learning engine

Prerequisite graph + next-step function in ADAPTIVE_LEARNING_ARCHITECTURE.md. Three scores: placement, mastery, readiness.

## 10. Faculty analytics

[FACULTY_ANALYTICS.md](FACULTY_ANALYTICS.md). Aggregates only. No public leaderboard. No student-to-student history.

## 11. Technical architecture

Libraries inside existing Next.js + judge. Entities and APIs: [SCHEMA.md](../SCHEMA.md), [API_CONTRACT.md](../API_CONTRACT.md). Persistent progress: [STUDENT_PROGRESS_AND_MASTERY.md](STUDENT_PROGRESS_AND_MASTERY.md).

## 12. AI — future ready, not now

[AI_TEACHING_POLICY.md](AI_TEACHING_POLICY.md) + provider interface only. No model pick. No fake tutor. Never override the judge.

## 13. UX and visual design

[STUDENT_EXPERIENCE.md](STUDENT_EXPERIENCE.md) § Design system. Inspect current UI; no redesign in 2C.

## 14. Roadmap

[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md). First build: **2D**.

## 15. Documentation deliverables

| Required | Location |
| --- | --- |
| CFORGE_PRODUCT_BLUEPRINT.md | repo root |
| PRD, ARCHITECTURE, SCHEMA, API_CONTRACT, TASKS | updated |
| Adaptive, content, progress, experience, roadmap | `docs/` |
| Coverage matrix | `docs/FIVE_UNIT_RESOURCE_MATRIX.md` |

## 16. Prioritisation

Seven-field table in IMPLEMENTATION_ROADMAP.md. No extra services.

## 17. Acceptance criteria

See blueprint § 2C acceptance evidence and the table at the end of this file.

## 18. Execution rules

2C wrote documents and consistency tests only. No new lessons, frontend rebuild, auth/judge/seat-cap changes, AI, invented labs, or PYQ.

## 19. Final report fields

Answered in the agent completion report and in the blueprint. Honesty rules: a design is not a feature; an empty matrix cell is not content; placement is not mastery; passing tests are not a production-security certificate.

## Acceptance criteria 1–20

| # | Criterion | Evidence |
| --- | --- | --- |
| 1 | Repo audited | Blueprint maturity table |
| 2 | M1 / 2A / 2B accurate | Blueprint + TASKS |
| 3 | Five-unit experience designed | Blueprint + matrix |
| 4 | Resource ecosystem specified | CONTENT_RESOURCE_MODEL |
| 5 | Separate lesson / notes / one-shot / mind-map contracts | CONTENT_RESOURCE_MODEL |
| 6 | Onboarding + diagnostic defined | ADAPTIVE_LEARNING_ARCHITECTURE |
| 7 | Skip introductions with evidence | Two-method rule |
| 8 | Placement ≠ mastery | STUDENT_PROGRESS_AND_MASTERY |
| 9 | Topic hub defined | STUDENT_EXPERIENCE |
| 10 | Prerequisite graph | ADAPTIVE_LEARNING_ARCHITECTURE |
| 11 | Persistent progress designed | STUDENT_PROGRESS_AND_MASTERY |
| 12 | Entities documented | SCHEMA proposed tables |
| 13 | APIs documented | API_CONTRACT DESIGN section |
| 14 | Privacy specified | FACULTY_ANALYTICS + SCHEMA RLS |
| 15 | UX journeys | STUDENT_EXPERIENCE |
| 16 | Five-unit matrix | FIVE_UNIT_RESOURCE_MATRIX |
| 17 | Unknown material unverified | Matrix `U` rows |
| 18 | AI and PYQ future | Roadmap + AI policy |
| 19 | M1 security preserved | No auth/judge/RLS code in 2C |
| 20 | Roadmap approved for design | IMPLEMENTATION_ROADMAP; 2D is next **implementation** gate |
