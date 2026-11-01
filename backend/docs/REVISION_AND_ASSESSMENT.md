# Revision and assessments

Design for Milestone 2G. Not implemented. Do not invent previous-year papers or marks.

## Revision surfaces

| Surface | Source | When it appears |
| --- | --- | --- |
| Topic revision | Hub card → notes, one-shot, flashcards, failed items | Resource exists |
| Unit revision | Unit page + unit one-shot | 2E/2F/2G |
| One-shot access | `one_shot` resource | After written |
| Flashcard review | Deck for topic or unit | After written |
| Quick notes | Cheat sheet | After written |
| Weak-topic queue | Placement `NEEDS_REVISION` or failed independent write | 2D+ events |
| Previously failed exercises | Student’s own Submit history, public verdict only | 2D persist |
| Periodic knowledge checks | Short `review` events | 2G |

## Spaced review (optional, late)

Educational benefit: a student who passed once still forgets operators and string termination.

**2G assumption:** a simple queue — if the last successful retention probe on a topic is older than 14 days **and** the student used the academy in the last week, show one review card. No Redis, no cron farm, no multi-armed bandit.

If that rule is too noisy in the pilot, drop to manual “Revise weak topics” only.

## Assessment kinds

| Kind | Purpose | Score bucket |
| --- | --- | --- |
| Onboarding diagnostic | Placement | Placement only |
| Topic checkpoint | End of a topic pack | Mastery + readiness for that topic |
| Unit assessment | End of a unit pack | Readiness for that unit |
| Coding assessment | Independent write via judge | `independent_write` |
| Revision assessment | Retention | Retention / `review` |
| Exam mode | Formal readiness | `exam` dimension only |
| Integrated syllabus assessment | Later, after units exist | Readiness; still no invented PYQ |

Conceptual understanding, programming proficiency, and examination readiness stay separate.

Exam mode uses configured items only. Hints restricted if configured. No hidden penalties. No college mark scheme unless a real scheme is supplied.

## Item types

MCQ, explanation, definition, predict, trace, identify-error, complete-code, algorithm, flowchart, independent write, explain-why.

Answer keys stay on the server. One method never grants placement exemption.
