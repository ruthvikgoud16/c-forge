# Faculty dashboard (2F.5)

`/faculty` is the faculty landing page. APIs stay on the existing Bearer token `Authorization: Bearer $FACULTY_TOKEN`. Postgres writes and roster reads use `withFacultyTx` (`SET LOCAL` `cforge.faculty='1'`). No `BYPASSRLS`. No `SUPERUSER`.

## Cohort

- Official rolls: `26EG104G01`–`26EG104G55`.
- Capacity: **55** active student accounts (`SEAT_CAP` and `students_enforce_seat_cap()`).
- Approved roster count is the official roll list. Names stay empty until faculty import or a name update.
- Available seats = `55 − active accounts`. Unused rolls are not invented students.

Verified CSV `db/cforge_verified_roster_2026-10-31.csv` (local, gitignored) holds transcribed names plus G52–G55: Rishika, Laasya, Akshaya, Simran. Faculty can apply those names with `POST /api/v1/faculty/roster/import`. Import updates display names only.

## APIs

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/faculty/overview` | Capacity, roster counts, unit aggregates, assessment buckets, revisit topics |
| GET | `/api/v1/faculty/roster` | All official rolls + account status |
| POST | `/api/v1/faculty/roster` | `{ updates: [{ rollNumber, displayName }] }` — identity unchanged |
| POST | `/api/v1/faculty/roster/import` | Apply verified CSV names |
| GET | `/api/v1/faculty/invitations` | Pending/consumed/revoked by roll; no raw tokens |
| POST | `/api/v1/faculty/invitations` | Mint or revoke for one official unregistered roll; token shown once |

Students receive **401** on every faculty route. Student `/learn` never lists peer rolls.

## Aggregates

Built from recorded `learning_events`, placements, and practice attempts. Score distributions with fewer than three contributing students are omitted (`n < 3`). Payloads do not include answer keys, hidden tests, or diagnostic item values.

## SQL

Additive ledger `2026-10-31_007_faculty_dashboard` checksum `8f38e1fcd0536696fc856e99bdbc6dd8bd1064439c10d3f2c83c392cee4c47b4`: SET faculty GUC, INSERT G52–G55 `ON CONFLICT DO NOTHING`, replace seat-cap function to 55, faculty `SELECT` policies on `learning_events`, `student_topic_placements`, and `practice_assessment_attempts` via `current_faculty()`.

Additive ledger `2026-10-31_008_roll_invitations` checksum `d99daa032389582b66070bd41640dde3eaee647c411434d5ce6d31e574b0520d`: `invitations.roll_number` + `revoked_at`, roster FK, immutable roll, one active invite per roll. Unused unbound invites were revoked.
