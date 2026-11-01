# Implementation roadmap

Owns sequence, priorities, and dependencies. Product vision stays in [CFORGE_PRODUCT_BLUEPRINT.md](../CFORGE_PRODUCT_BLUEPRINT.md).

## Priority framework

Score each feature by educational value, student value for 51 seats, engineering complexity, technical dependencies, and content effort. Prefer learning outcomes over infrastructure.

Do not add microservices, multi-agent orchestration, Redis queues, or analytics pipelines for this class size.

| Feature | Edu value | Student value | Eng. complexity | Tech dependencies | Content effort | Phase | Essential for 51? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coverage matrix + contracts | High | High (stops forgotten types) | Low | Catalog | Low | 2C (done, design) | Yes (design) |
| Persistent progress | High | High (survives restart) | Medium | Postgres, RLS, existing progress API | None | 2D MVP | Yes |
| Topic resource hub | High | High (one place per topic) | Medium | Catalog, matrix statuses | Low copy | 2D MVP | Yes |
| Dashboard + next step | High | High | Medium | Placement + progress | Low | 2D MVP | Yes |
| Diagnostic + placement | High | High (skip or remediate) | Medium | Item bank, two-method rule | Medium items | 2D MVP | Yes |
| Upgrade u1-t1 + Unit 1 notes/one-shots/concepts | High | High | Medium | 2D hub | High | 2E next | Yes |
| First Unit 1 simulators (flowchart, operators) | High | High | High | Visualisation payload | Low | 2E | Helpful |
| Units 2–5 deep packages | High | High | High | Hub + lesson schema | Very high | 2F | Yes |
| Remaining simulators | High | Medium | High | Unit lessons | Low | 2F | Helpful |
| Revision + exam mode | High | High | Medium | Assessments, no PYQ | Medium | 2G | Yes |
| Lab sheets | High | High | Low | Real lab manual | Blocked | When supplied | Yes when source exists |
| AI teacher | High later | High later | High | Provider, grounding | Medium | M3 future | No |
| Previous papers | High later | High later | Medium | Real papers | Blocked | M4 future | When supplied |
| Faculty aggregates | Medium | Faculty | Medium | Persistent events, faculty token | None | After 2D | Helpful |
| Pilot | Required | Required | — | Stable 2D/2E | — | After 2D/2E | Yes |

## Milestones

### 2C — Product blueprint (this milestone)

Documents and the coverage matrix. No platform build.

### 2D — Learning platform core (recommended next implementation)

Personalised dashboard, topic resource hubs (honest empty states), learning-path API, diagnostic and placement, Postgres-backed `mastery_events` and placements.

Depends on: this blueprint, existing catalog, existing auth.

Does **not** require Units 2–5 lessons to exist.

### 2E — Complete Unit 1 experience

Bring `u1-t1` to the full lesson standard. Standalone notes, mind maps, one-shots, quick notes, concept library, worked-example library, first visuals, practice ladder, integrated checks. Laboratory remains pending unless a real sheet arrives.

Depends on: 2D hub so resources have a home.

### 2F — Units 2–5

Same content standard as Unit 1. Accuracy notes: `strrev()`, pass-by-value, binary search needs sorted input. Labs stay `U` until source exists. `u5-t8` does not invent platform problems.

### 2G — Revision and examination readiness

Unit revision, one-shots, assessments, exam mode. No invented previous-year bank.

### Milestone 3 — AI teaching assistant

Grounded explanations, progressive hints. Provider stays model-agnostic.

### Milestone 4 — Previous paper intelligence

Only when actual papers are supplied.

### Milestone 5 — Pilot and improvement

Pilot with mixed skill levels as soon as 2D/2E is stable. Do not wait for every 2F lesson.

## Dependencies

```
2C docs → 2D platform → 2E Unit 1 pack → 2F Units 2–5
                 ↘ 2G revision (can start after 2E)
PDF pages ── optional overlay on official screenshot units
Lab manuals ── required before lab sheets
Papers ── required before M4
DATABASE_URL ── required for persistent 2D
Git/Xcode ── required for a real branch
Docker/GCC ── required to verify isolate
```

## Recommended first implementation

**Milestone 2D.** It turns the matrix empty states into a usable academy without generating hundreds of lesson files.
