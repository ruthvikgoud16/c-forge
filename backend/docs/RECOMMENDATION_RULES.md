# Recommendation rules (Milestone 2D.3)

Deterministic server function `recommendNext(studentId)`. No global skill label.

## Priority

1. Placement `NEEDS_FOUNDATION` → `FOUNDATION` (foundation library + deep lesson).
2. `NEEDS_REVISION` → `QUICK_REVISION` if notes exist, else the deep lesson. Reason cites the topic.
3. Preference `theory_weak_coding` on a demonstrated/partial coding topic → `INDEPENDENT_PRACTICE` only if a judge exercise exists.
4. `PARTIALLY_DEMONSTRATED` → second method / guided practice.
5. Preference `test_knowledge` + `NOT_ASSESSED` → `DIAGNOSTIC` when Unit 1 items exist.
6. Preference `exam_revision` → deep lesson; one-shots stay **PLANNED**.
7. After `DEMONSTRATED`, recommend the next official topic that still needs learning. Skipped lessons stay linked.
8. Beginner / no preference → first available deep lesson.

## Evidence

Placement map, mastery events, preference, last `learning_events` row, resource availability from the catalog (not the architecture wishlist).

## Availability

Never recommend a type as AVAILABLE unless a file or exercise exists. Planned notes, one-shots, unit tests, and labs are labelled PLANNED / UNAVAILABLE / UNVERIFIED.

## Contract

`{ topicId, resourceType, reason, href, availability, unmetPrerequisites, startIntent, placement, mastery, readiness }`.

`reason` is a student-facing sentence. Placement ≠ mastery ≠ readiness.
