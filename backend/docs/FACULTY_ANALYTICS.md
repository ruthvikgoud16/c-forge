# Faculty analytics

2F.5 implements `/faculty` and `GET /api/v1/faculty/overview`. This note remains the aggregation policy.

## Allowed aggregates (class of 55)

- Topics with the highest incorrect knowledge-check or diagnostic rate
- Concepts (concept-library ids) with repeated misses
- Common **public** compile/runtime statuses on Submit (counts of `wrong_answer`, `compile_error`) — never hidden stdin
- Count of students whose latest independent-write dimension is weak while concept dimension is strong
- Count of students with placement `NEEDS_FOUNDATION` on a topic
- Unit-level started / practised / mastered **counts**
- Count of topics in `NEEDS_REVISION`
- Assessment threshold met vs not met, per configured assessment

## Forbidden

- Another student’s source, stdin, or item-by-item stream in a student UI
- Hidden test stdin, expected stdout, or visibility
- Invitation tokens
- A public leaderboard (not justified for this academy)
- Invented marks or “class rank for the college paper”

## Authorisation

- Student session: own rows only (`current_student_id()` RLS).
- Faculty: existing `Authorization: Bearer $FACULTY_TOKEN` pattern. Live route is `GET /api/v1/faculty/overview`.
- No “classmate compare” endpoint.

## Aggregation rules

- Minimum cell size: if fewer than 3 students contribute to a slice, return `n < 3` rather than a precise identifiable rate when the slice could identify a person (for example a single roll’s unique fail pattern).
- Prefer topic-level counts over per-student tables in the first faculty view.
- Analytics payloads must pass the same hidden-test strip as public exercise DTOs.

## Relationship to students

Students see their own dashboard. They never see faculty aggregates that include named peers.
