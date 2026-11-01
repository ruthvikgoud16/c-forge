# Adaptive learning architecture

Owns diagnostics, placement, prerequisite graph, and next-step recommendations. Mastery formulas live in [STUDENT_PROGRESS_AND_MASTERY.md](STUDENT_PROGRESS_AND_MASTERY.md).

Runtime (2D.3): `lib/curriculum/prerequisites.ts` and `lib/learning/recommend.ts`. The graph is recommended, not a lock. Recommendation rules: [RECOMMENDATION_RULES.md](RECOMMENDATION_RULES.md).

## Three separate concepts

1. **Placement** — what should the student study now?
2. **Mastery** — what has the student demonstrated over time?
3. **Readiness** — how prepared is the student for a configured assessment or exam-mode set?

Do not combine these into one percentage. A student may skip an introduction (placement `DEMONSTRATED`) and still lack mastery or later need revision.

## Onboarding preferences

Stored, revisable, never a permanent track:

| `startIntent` | Meaning |
| --- | --- |
| `from_scratch` | Begin at foundations / Unit 1 topic 1 |
| `test_knowledge` | Offer diagnostic first |
| `theory_weak_coding` | Bias next steps toward tracing and independent write |
| `exam_revision` | Bias toward one-shots and exam-mode items when they exist |
| `problem_solving` | Bias toward algorithm construction and challenges |

Skipping onboarding leaves `startIntent` unset. All topics stay reachable.

## Diagnostic workflow

1. Student selects a preference (optional).
2. CForge offers a short diagnostic. It is optional.
3. Items map to official topic ids and a mastery dimension.
4. Next item adapts: after a clear fail, stop drilling that topic and offer SUPPORTING material; after a clear pass, try a second method on the same or the next topic.
5. Placement updates. Recommendations change.
6. The student may retake, request the full lesson, or ignore the recommendation.

Do not force every student through a beginner course.

## Item types

Multiple-choice, concept explanation, definition, predict output, code tracing, identify the error, complete missing code, algorithm construction, flowchart interpretation, independent program writing, explain why an answer works.

## Placement states

| State | Meaning |
| --- | --- |
| `NOT_ASSESSED` | No diagnostic or challenge evidence |
| `NEEDS_FOUNDATION` | Missing prerequisite or foundation concept |
| `NEEDS_LEARNING` | Topic not demonstrated; teach from the deep lesson |
| `PARTIALLY_DEMONSTRATED` | One method passed, or mixed results |
| `DEMONSTRATED` | Enough evidence to skip introductory instruction |
| `NEEDS_REVISION` | Earlier demonstration, later failure or stale retention |

Placement is revisable. `DEMONSTRATED` is not a permanent exemption and is not mastery.

## Exemption rule

A topic may become placement `DEMONSTRATED` only after **at least two different methods** succeed (for example predict + trace, or MCQ + explain-why). One easy MCQ is never enough.

Independent program writing may count as one method when the judge returns `accepted` on submit. Hidden tests stay hidden.

## Prerequisite graph

Initial instructional graph from the verified catalog. Edges are recommendations, not hard locks. Laboratory topics have no invented edges.

```
f-basic-computer → u1-t1 → u1-t2 → u1-t3 → u1-t4 → u1-t5 → u1-t6 → u1-t7
u1-t6 → u2-t1
u1-t5 → u2-t2
u2-t1 → u2-t2 → u2-t3
u2-t2 → u2-t5
u2-t4 → u2-t5 → u2-t6
u2-t6 → u3-t1 → u3-t2
u3-t1 → u3-t3 → u3-t4
u3-t3 → u3-t5
u1-t5 → u4-t2 → u4-t1
u4-t2 → u4-t3 → u4-t4
u4-t2 → u4-t5
u3-t1 → u4-t4
u2-t6 → u5-t1
u3-t1 → u5-t1 → u5-t2
u5-t1 → u5-t3, u5-t4, u5-t5, u5-t6, u5-t7
u4-t5 → u5-t6, u5-t7
```

Foundation Linux topics stay `EXTENSION`. PIC, mid-paper, and Grand Test 1 stay `LEGACY_UNVERIFIED` and are never used as required prerequisites.

When a later topic is recommended, unmet prerequisites must still be shown.

## Next-step function (design)

Inputs: `startIntent`, placements, mastery states, readiness, unmet prerequisites, available published resources.

Output: `{ topicId, resourceType, reason }` plus alternatives.

Examples of reasons (computed, not labels):

- “Start with variables. First understand what a variable is.”
- “You traced declarations. Write a program that uses input and output.”
- “You demonstrated basic operators. Try the operator evaluation challenge.”
- “Revise Unit 2 using the one-shot, then take the checkpoint.” (only when those resources exist)

## Privacy

Diagnostic answers are the student’s. Faculty later see aggregates, not another student’s raw item stream.
