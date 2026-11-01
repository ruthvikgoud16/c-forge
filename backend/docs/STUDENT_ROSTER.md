# Student roster (26EG104G01–26EG104G55)

Exactly 55 approved roll numbers. Names stay null until faculty records a verified name. **Roster presence does not activate an account.**

## Seed

- Code: `lib/roster/rolls.ts` `officialRollNumbers()`.
- Memory: `seedRoster()` — idempotent, never overwrites a name with null. Returns `{ created, updated, alreadyPresent }`.
- Postgres: `db/schema-roster.sql` seeds G01–G51. Additive `2026-10-31_007_faculty_dashboard` inserts G52–G55 `ON CONFLICT DO NOTHING`.
- Apply with `npm run migrate` when `DATABASE_URL` is set.

## Authentication mapping

1. Faculty issues an invitation bound to one official unregistered roll.
2. Student accepts with that same **normalized uppercase** roll and a password.
3. Unknown rolls → `unknown_roll`. A different roll than the invite → `roll_mismatch`. Invitation still required.
4. `students.roll_identifier` equals `student_roster.roll_number`. Same person; no second profile.
5. Seat cap 55 still applies on activation.

Login uses the roll number, never the display name.

## Name updates

`POST /api/v1/faculty/roster` with `Authorization: Bearer $FACULTY_TOKEN` and `{ "updates": [{ "rollNumber", "displayName" }] }`.

Updates the name on the existing roll. Does not change the roll, student UUID, diagnostics, or progress. Students cannot call this. Students cannot list the roster (`GET` is faculty-only).

## Privacy

`GET /api/v1/me` returns only the session student’s roll and name. RLS on `student_roster` allows a student to `SELECT` only their own roll.
