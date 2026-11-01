# Security threat model — Milestone 1

## Assets

- Student passwords and session cookies
- Invitation tokens
- Hidden tests and expected outputs
- Faculty token / judge shared secret
- Judge host (GCC toolchain)

## Adversaries

- Unauthenticated internet client
- Invited student probing for hidden tests or extra seats
- Student submitting hostile C (fork bombs, infinite loops, large output, path traversal in source writes)
- Misconfigured production (missing judge URL, debug defaults)

## Controls

| Threat | Control |
| --- | --- |
| Public registration | Invitation consume only; no register route |
| >55 students | Trigger `students_seat_cap` + application pre-check |
| Hidden test leak | RLS deny + `toPublicExercise` / `toPublicSubmitResult` |
| In-lesson / assessment key leak | `toPublicLesson`, `publicItem`, `publicReview`; check and submit score on the server |
| In-process compile | `refuseInProcessCompile()`; academy has no gcc dependency |
| Missing judge in production | `assertJudgeConfigured()` → HTTP 503 |
| Secret defaults | `lib/academy/env.ts` rejects placeholder/empty secrets in production |
| Hostile programs | Time, memory, output, process limits; non-root; workspace deleted |
| Session theft | httpOnly cookie, production Secure, HMAC-SHA-256 signature, hashed password (scrypt) |
| Cross-site cookie POST | SameSite=lax plus Origin host match on mutating student routes |
| Faculty token compare | `timingSafeEqual` on Bearer secret |
| Invitation roll probe | HTTP `invalid_invitation` (no `roll_mismatch`) |
| Client mastery cheat | Progress rejects `assessment_completed` / `knowledge_check` |
| Oversized JSON | 64 KiB API / 128 KiB execute → 413 |
| Ready / error leaks | Production ready returns `not_ready` only; JSON `no-store` |

## Residual risk (not closed by this milestone)

- Judge container breakout
- Academic staff device compromise (faculty bearer token)
- Side-channel timing on login and hidden-test compare
- No WAF, no pentest, no dependency audit gate
- Local development may use weaker isolation if Docker is absent — never treat that as production

**Do not claim production security from green tests.**

## Milestone 2F.9 — Distributed rate limiting

Production counters live in `rate_limit_buckets`, consumed through `academy_rate_limit_take` (SECURITY DEFINER, `search_path = pg_catalog, public`). `cforge_app` and `cforge_faculty` have EXECUTE only. Rows store HMAC-SHA-256 subjects, not raw IPs, passwords, session cookies, or invitation tokens.

Algorithm: per `(bucket, subject_hash)` token bucket. Capacity is `max`; refill is `max / windowMs`. `SELECT … FOR UPDATE` after insert-if-absent makes concurrent takes atomic. Rows idle 24 hours are deleted on take.

`X-Forwarded-For` / `X-Real-IP` are ignored unless `CFORGE_TRUST_PROXY=1` (verified hosting proxy only). Unauthenticated subjects then use `net:direct` or a hashed roll/student/faculty identity.

If the shared store is missing in production, protected routes return **429** `{ error: "rate_limited", retryAfterSec }` and `Retry-After`. Development without `DATABASE_URL` may use in-process memory. Development with a URL but without `014` falls back to memory so local work continues; production never does.

Default limits (override with `RATE_LIMIT_*_MAX` / `RATE_LIMIT_*_WINDOW_MS`):

| Bucket | Max | Window |
| --- | --- | --- |
| login | 10 | 15 min |
| inviteAccept | 10 | 15 min |
| inviteMint | 20 | 15 min |
| lessonCheck | 60 | 60 s |
| assessmentSubmit | 20 | 60 s |
| diagnosticSubmit | 20 | 60 s |
| judgeRun | 20 | 60 s |
| judgeSubmit | 10 | 60 s |

Live `cforge` has `014` applied. `X-Forwarded-For` remains ignored unless `CFORGE_TRUST_PROXY=1`.

## Milestone 2F.11 — Application / API security

Confirmed and fixed: HMAC sessions; session claim allow-list; faculty timing-safe Bearer; invitation HTTP error collapse; progress mass-assignment of derived kinds; JSON size limits; CSRF Origin check; production `/ready` leak; login dummy hash; API cache/frame headers.

Not claimed closed: CSRF tokens for same-site browsers that omit Origin; full XSS audit of every student-authored string; production judge isolation; database medium findings from 2F.8.4; faculty device compromise.

## Milestone 2F.8.3 — SCRAM authentication

CForge runtime and migrator connections use `scram-sha-256`. Previous Postgres.app rules were `local/host all all trust` plus replication trust. The applied file is `db/pg_hba.cforge.conf`. A timestamped copy of the previous `pg_hba.conf` is stored under `$HOME/.cforge/` (mode 600), not in Git.

Administrator (`ruthvik` on this host) still uses local trust because that role has no password verifier. Rollback is: restore that backup file over `hba_file` and `SELECT pg_reload_conf()`. Do not re-enable `all/all trust`.

## Milestone 2F.8.2 — owner / runtime split

Application objects are owned by `cforge_owner` (NOLOGIN). Migrations use `MIGRATOR_DATABASE_URL` (`cforge_migrator`) and `SET ROLE cforge_owner`. `DATABASE_URL` must be `cforge_app`. Faculty stays on `FACULTY_DATABASE_URL`. Legacy `cforge` is NOLOGIN after transfer. See `docs/FACULTY_AUTHORIZATION.md`.

## Milestone 2F.8.1 — runtime accessors

Login, invitation accept, and hidden-test load run as `cforge_app` through `SECURITY DEFINER` functions (`academy_login_lookup`, `academy_accept_invitation`, `academy_exercise_tests`) with `search_path = pg_catalog, public`. `EXECUTE` is granted only to `cforge_app`. Table `SELECT` on `exercise_tests` and `invitations` is revoked from `cforge_app`. Ownership is unchanged until 2F.8.2.

## Milestone 2F.7.1 — faculty database role

`DATABASE_URL` (`cforge`) cannot authorize faculty RLS by setting `cforge.faculty`. Faculty SQL uses `FACULTY_DATABASE_URL` (`cforge_faculty`) after Bearer auth. Missing faculty credentials fail closed. `010`/`011` add faculty RLS policies on `invitations` and `students` (SELECT only). See `docs/FACULTY_AUTHORIZATION.md`.

## Milestone 2F.7 — production hardening

- Shared PostgreSQL rate limits (2F.9). In-process memory is development-only when no database is configured.
- Invitation tokens remain SHA-256 only. Faculty listings never return the raw token. Bound roll, expiry, revoke, and one-time accept stay in force.
- Session signatures are HMAC-SHA-256 of the payload (not `sha256(secret.payload)`). Compare uses `timingSafeEqual`. Production requires a strong `SESSION_SECRET`, `FACULTY_TOKEN`, and a faculty URL that is not `DATABASE_URL`. Existing cookies minted before HMAC will not verify.
- Production judge execution is **disabled** unless `JUDGE_ALLOW_PRODUCTION=1`. Shared-UID / kernel isolation is not a full sandbox (`docs/JUDGE_ISOLATION.md`).

## Milestone 2F.2 — answer keys

Student-facing lesson and assessment JSON must not include scored answers or hidden judge tests. Faculty routes and server-side banks keep the keys. Authentication is unchanged (roll + password + session).

## Academic-foundation additions

- Curriculum reads are authenticated. Mastery events are student-owner only.
- Teacher provider must not receive hidden tests, judge secrets, or invitation tokens.
- Future model adapters stay behind `lib/ai/provider.ts`. No execute-path AI.
