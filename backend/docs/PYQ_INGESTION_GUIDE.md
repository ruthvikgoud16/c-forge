# Previous-year paper ingestion

Faculty only: `POST /api/v1/faculty/papers` with bearer `FACULTY_TOKEN`.

Body: `{ academicYear, semester, examType, sourceRef, questions: [{ text, topicId, marks, pageRef }] }`.

Each question is stored as `faculty_extracted` and keeps `sourceRef` / `pageRef`.

Students see `/learn/papers`. Empty bank: unavailable, no invented trends.

Frequency analysis stays off until at least three verified papers exist (`frequencyClaimsAllowed`).
