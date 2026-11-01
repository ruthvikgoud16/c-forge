# Resource coverage (implemented)

Runtime source: `compileDraft` → `allPackages()` in `lib/content/registry.ts`. No second package pipeline.

## Units 2–5 teaching topics (24)

Compiled IDs: `u2-t1`–`u2-t6`, `u3-t1`–`u3-t5`, `u4-t1`–`u4-t5`, `u5-t1`–`u5-t8`.

Each of these has a registry package. `packageForTopic` and `loadLesson(pkg.lesson.id)` both resolve. Catalog `sourceLabel` is the official wording copied onto the compiled lesson.

AVAILABLE teaching resources (real hub hrefs, Open only when AVAILABLE):

| Type | Route shape |
| --- | --- |
| Deep lesson | `/learn/lessons/{lessonId}` |
| Complete notes | `/learn/topics/{id}/notes` |
| One-shot / revision | `/learn/topics/{id}/oneshot` |
| Mind map | `/learn/topics/{id}/mind-map` |
| Quick notes | `/learn/topics/{id}/quick` |
| Concept library | `/learn/topics/{id}/concepts` |
| Flashcards | `/learn/topics/{id}/flashcards` |
| Worked examples (problem, steps, code, output) | `/learn/topics/{id}/examples` |
| Code tracing / output prediction | `/learn/topics/{id}/trace`, `/predict` |
| Syntax reference | `/learn/topics/{id}/syntax` |
| Visualiser | `/learn/tools/{visualizerId}?topic={id}` |
| Guided / independent practice text | `/learn/topics/{id}/practice` |
| Topic assessment | `/learn/assessments/topic/{id}` |

`u5-t8` provenance is `supplementary`, `officialLab` is false. Teaching resources above are AVAILABLE. It is not an official lab sheet.

## Official laboratories

`u1-t8`, `u2-t7`, `u3-t6`, `u4-t6`: no teaching package; lesson UNAVAILABLE; laboratory UNAVAILABLE or UNVERIFIED.

`u5-t8` laboratory card: UNAVAILABLE or UNVERIFIED (catalog `needsHumanVerification`). No invented experiment list.

## Unit 1 teaching (already packaged)

`u1-t1`–`u1-t7` use existing lesson JSON via `packageFromExistingLesson`. Same hub card types as above.

## Not invented

Judge-backed coding stays Hello CForge (`u1-t5`) and add-two (`u1-t4`). Other independent practice is written work labelled supplementary unless an exercise id exists.

PYQ: UNAVAILABLE until faculty posts a paper with a source reference.

See also the older design matrix in FIVE_UNIT_RESOURCE_MATRIX.md — this file is the runtime truth.
