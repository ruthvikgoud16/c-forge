# Learning mastery model

Canonical narrative for **placement versus mastery versus readiness** and persistence: [STUDENT_PROGRESS_AND_MASTERY.md](STUDENT_PROGRESS_AND_MASTERY.md). This file keeps the event-kind table.

Opening or watching a lesson is **not** mastery. Placement `DEMONSTRATED` is **not** mastery.

## Event kinds

| Event | Counts as |
| --- | --- |
| `lesson_opened` | Exposure only |
| `knowledge_check` | Concept signal |
| `trace` / `predict` | Tracing / prediction signal |
| `guided_practice` | Assisted accuracy |
| `independent_submit` | Independent accuracy (judge or written) |
| `hint_used` | Assistance; does not raise independent mastery |
| `review` | Retention probe |

## Dimensions (separate scores)

- Conceptual understanding
- Code tracing
- Output prediction
- Syntax
- Independent program writing
- Debugging
- Examination readiness (only from configured exam-mode items)

## Derived states

| State | Rule |
| --- | --- |
| Started | Any event on the topic |
| Practised | Guided or independent item attempted |
| Assessment passed | Configured assessment threshold met |
| Mastered | Independent accuracy and retention probes meet thresholds **and** assessment passed |

Hint-heavy success increases **assisted** accuracy only.

Do not double-count the same underlying mistake across every dimension in one attempt: tag a primary dimension on the event.

## Privacy

Mastery rows are per-student. RLS: owner-only. Faculty aggregate views are a later milestone and must not expose hidden tests.
