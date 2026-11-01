# Assessment coverage

- Topic assessments: one per teaching package (`GET/POST /api/v1/assessments/topic:{id}`).
- Unit assessments: items taken from that unit’s topic banks (`unit:unit-1` … `unit:unit-5`).
- At least two cognitive families per topic.
- Scoring is deterministic string-normalize compare on the server.
- Public GET has no `answer` or `explanation`.
- Submit review has marks and `correct` only — no `expected`, no item explanation.
- Client score/mastery/placement fields are rejected.
- Attempts persist in `practice_assessment_attempts` (Postgres + RLS). Memory only when not production and no DATABASE_URL.
- These are CForge practice assessments, not university examinations.
- No invented weightage.
