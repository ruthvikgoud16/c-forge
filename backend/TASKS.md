# CForge Tasks

## Milestone 0 — Research

- [x] PRD, architecture, schema, API contract
- [x] Technical research notes
- [x] Security threat model

## Milestone 1 — Vertical slice (protected)

- [x] Invitation, 51-seat cap, judge, Hello CForge, hidden tests, fail-closed judge URL
- [x] Vitest + Playwright from Milestone 1 kept

## Milestone 2A — Academic foundation and first lesson

- [x] Catalog of 5 official units and 35 supplied topic wordings
- [x] Foundation library (Unit 999 visible 17; 20 missing flagged; not a sixth unit)
- [x] Docs: curriculum, ingestion, lesson standard, notes/mind-map, AI policy, mastery, source inventory
- [x] Data-driven catalog (server-loaded JSON, not a frontend array of the syllabus)
- [x] Learn navigation: dashboard, units, topics, lessons, foundation
- [x] First complete Unit 1 topic 1 lesson (computers + binary)
- [x] Unit 1 topics 2–7 complete lessons (2B)
- [x] Unit 1 mind map from catalog topics 1–8
- [x] add-two-integers judge exercise (hidden tests stay server-side)
- [x] Lesson schema tests for all seven Unit 1 teaching topics
- [x] Progress states distinguish opened vs practised vs mastered
- [x] TeacherProvider remains unconfigured (no vendor model)

## Milestone 2C — Product blueprint (design only)

- [x] Repository audit recorded in CFORGE_PRODUCT_BLUEPRINT.md
- [x] Five-unit resource coverage matrix (35 official topics)
- [x] Adaptive placement architecture (placement ≠ mastery ≠ readiness)
- [x] Content resource contracts (lessons, notes, one-shots, mind maps, and others)
- [x] Student experience (dashboard, topic hub, nav) documented, not built
- [x] Proposed data model and API contracts marked DESIGN
- [x] Implementation roadmap; first build milestone is 2D
- [x] Five core engineering documents reconciled
- [x] Documentation consistency tests
- [x] Git feature branch recorded as blocked (no .git / Xcode CLI)
- [x] Sections 1–19 traced in docs/M2C_SECTION_TRACE.md
- [x] Simulator catalog, faculty analytics, revision/assessment design (docs only)

## Milestone 2D.1 / 2D.2 — Persistent state and placement

- [x] Learning-state SQL (`db/schema-learning.sql`) and migrate hook
- [x] Preferences, diagnostics, placements, learning events (memory + optional Postgres)
- [x] Diagnostic bank from existing Unit 1 lesson items only
- [x] Placement engine `2d1-placement-v1` (two different methods; ≠ mastery)
- [x] APIs: preferences, diagnostics, submit, placement, learn/next, dashboard, topic hub
- [x] Session identity only; client studentId stripped
- [x] Tests for isolation, placement, diagnostics, schema SQL
- [x] 2D.2 review: FORCE RLS, transaction-local identity, production fail-closed persist
- [x] Diagnostic tamper + method-family tests
- [x] Security verification report (`docs/LEARNING_STATE_SECURITY.md`)
- [x] Live Postgres isolation as `cforge_app` (embedded Postgres in CI/local; DATABASE_URL if set)

## Milestone 2D.3 — Adaptive path and roster identity

- [x] Official 51-roll roster 26EG104G01–G51 (names null, idempotent seed)
- [x] Invitation accept rejects unknown rolls; invitation still required
- [x] Prerequisite graph with cycle/missing checks
- [x] Recommendation engine from evidence + honest availability
- [x] Dashboard, path, diagnostic, onboarding UI
- [x] Faculty name update (no new accounts)
- [x] Tests for roster, graph, recommendations, privacy (included in the 13:24 IST Vitest run)
- [x] Seed reports created / updated / alreadyPresent
- [x] Playwright greeting + unknown_roll

## Academy completion (hub, Units 2–5, tools, assessments)

- [x] Topic Resource Hub with honest availability and working resource routes
- [x] Unit 1 topics 1–7 standalone notes, one-shots, flashcards, assessments (topic 1 upgraded)
- [x] Units 2–5 teaching packages
- [x] Units 2–5 drafts compile only through `lib/content/registry.ts` (`u2-t1`–`u2-t6`, `u3-t1`–`u3-t5`, `u4-t1`–`u4-t5`, `u5-t1`–`u5-t8`)
- [x] Hub cards, `loadLesson(pkg.lesson.id)`, and public assessment items (no answer/explanation on GET)
- [x] `u5-t8` supplementary, `officialLab` false; official labs stay unpublished
- [x] Eight interactive visualisers
- [x] Topic + five unit practice assessments (server scored)
- [x] PYQ and lab faculty ingest without fabricated data
- [x] Content package tests (all 24 unit 2–5 topic IDs)

## Milestone 2F.1 — Persistent assessment engine

- [x] `practice_assessment_attempts` + FORCE RLS + indexes
- [x] Server-side scoring unchanged; client scores rejected
- [x] Session identity only; idempotent resubmit via Idempotency-Key
- [x] Production persist fail-closed
- [x] Isolation tests for two students

## Milestone 2F.2 — Answer-key and assessment security

- [x] Student lesson DTO strips graded keys; teaching text stays
- [x] In-lesson checks scored on the server (`POST .../lessons/:id/check`)
- [x] Assessment GET/submit omit answers and explanations
- [x] Hidden judge tests remain off public exercise/submit DTOs
- [x] Tests for stripped payloads and server-side scoring

## Milestone 2F.3 — Judge exercise bank

- [x] Ten new isolated-C exercises (Units 1–5 teaching topics)
- [x] Sample + hidden tests; public DTO unchanged
- [x] Topic mapping; labs and `u5-t8` unmapped
- [x] Tests for retrieval, run/submit, hidden-test strip, topic links
- [x] Second batch of ten exercises (Units 1–5; unique official teaching topics)
- [x] Additive ledger `2026-10-31_006_exercise_bank_2f3b` (does not rewrite 001–005 or `seed.sql`)
- [x] Existing twelve exercises and student rows left in place

## Milestone 2F.1A — Safe first database migration

- [x] Admin role provisioning script (`db/provision-roles.sql`)
- [x] Ordered `schema_migrations` ledger via Node `postgres` client
- [x] First-apply sequence: schema, learning, roster, assessments, seed (no curriculum)
- [x] Repeatable seed; faculty roster writes via transaction-local `cforge.faculty` GUC (no BYPASSRLS)

## Milestone 2F.1B — Backup and restore

- [x] `pg_dump` custom-format backups under `$HOME/.cforge/backups` (700/600, SHA-256)
- [x] Restore procedure and off-box verification database (original `cforge` untouched)

## Milestone 2F.1C — Persistence across logout and restart

- [x] Isolated verify-DB workflow: login, lesson, check, assessment, logout, server restart, restore
- [x] Original `cforge` unchanged; student isolation; postgres not memory

## Milestone 2F.1D.1 — Judge execution isolation

- [x] Per-submission workspace, process-group kill, Landlock + seccomp + rlimits (`confine`)
- [x] Include allow-list; judge secret stripped from pid 1 environ
- [x] Docker isolation tests: loop, memory, processes, files, network, concurrency, cleanup
- [x] Existing 22 exercises / 88 tests unchanged; Run vs Submit unchanged

## Milestone 2F.1D.2 — Judge network exposure

- [x] Production compose: no host mapping for 7080; `cforge_internal` + `http://judge:7080`
- [x] Local override: `127.0.0.1:7080:7080` only; host `npm run judge` binds loopback
- [x] Compose tests reject all-interface publish; health stays on-container

## Emergent frontend — adapter, welcome, login, dashboard

`emergent-source/` stays the visual reference and still has `IS_DEMO = true`. Production routes do not import it.

- [x] `lib/integration/student-dashboard.ts` loads `/learn` through `hydrateStudent` and `dashboardPayload`
- [x] `/` and `/login` use the Emergent public layout. Login posts to `POST /api/v1/auth/login`
- [x] `/learn` uses that layout and the existing dashboard payload. Faculty and studio themes were not changed
- [ ] Lessons, notes, flashcards, assessments, visualiser pages, faculty, and studio are still the previous UI
- [ ] No cohort field, no client preview scoring, no judge methods on this adapter
- [x] `JUDGE_ALLOW_PRODUCTION` stays 0

## Visual identity lab

- [x] Three isolated directions on `/design-system`: Forge Editorial, Colorfield Academy, Contemporary Campus
- [x] Each shows login, student, lesson, units, mind map, visualiser, faculty and studio samples, desktop and mobile
- [x] Styles live in `app/design-system/lab.css` only. Production tokens, globals and layouts unchanged
- [ ] No direction applied to the product. Waiting for a choice

## Milestone UI.1 — Product design system (foundation only)

- [x] Plain-CSS tokens in `app/styles/tokens.css`: primitive scales on `:root`, semantic tokens per `[data-theme]`
- [x] Themes: `student` White Glass, `staff` Dark Glass, `code` Premium Dark; neutral base for public routes
- [x] Themes applied only by `ThemeScope` in `app/learn`, `app/faculty`, `app/studio` layouts — never on `body`
- [x] Shared primitives (`app/styles/primitives.css`, `components/ui/*`): button, field/input/select/textarea, card/glass panel, dialog, dropdown, nav, badge/status, page container, section header, loading/error/empty
- [x] Legacy classes kept and token-backed; no page, lesson, editor, faculty or admin redesign
- [x] Reduced motion, reduced transparency, `@supports` blur fallback, visible focus ring, 640/960/1280 breakpoints
- [x] Dev-only `/design-system` preview (404 in production)
- [x] Tests: token parity + WCAG AA contrast (Vitest); theme separation, keyboard, dialog, reduced motion (Playwright)
- [x] No new dependencies; routes, APIs, auth and DB unchanged
- [ ] Monaco editor theme still `vs-dark` (not token-driven)
- [ ] Pages not yet migrated to `components/ui` primitives (UI.2+)

## Milestone UI.3 — Learning experience

- [x] Study links on lesson, notes, topic resources, topic assessments, and topic-scoped visualisers (unit, topic, materials, all applicable tools, previous/next lesson)
- [x] Lesson reading layout: objectives, section jumps, prose sections, existing checks and examples kept
- [x] Notes keep their content and embedded visualiser; reading width applied
- [x] Flashcards stay interactive: reveal, next, deck progress, review tracking, keyboard
- [x] Assessments still submit to the server. Question position is shown. Choice buttons only fill the same answer string
- [x] Mind maps keep every node and link, drawn as a root plus connected nodes
- [x] Eight visualisers unchanged in behaviour; touch-sized controls
- [x] Dashboard, faculty, and coding workspace not redesigned
- [ ] Apparent duplication: topic hubs and study links both list the same resources. Both kept

## Visual identity calibration

- [x] Public routes: warm ivory field `#efe4d4`, pearl cards, charcoal accent. Not the student theme.
- [x] Student: ivory ground `#e7dfd2`, pearl and raised surfaces, sage accent `#245643`, card elevation. No large gradient.
- [x] Faculty dark glass and coding graphite tokens unchanged
- [x] Feature recovery (units, mind maps, eight visualisers, assessments, studio, faculty) left in place

## Student experience recovery — feature preservation

Audit compared the working tree with committed routes, `docs/STUDENT_EXPERIENCE.md`, the curriculum catalog, and Playwright. No git reset, stash, or commit.

- [x] Dashboard still server-derived: welcome, continue, recommendation, five unit cards with opened/practised/demonstrated/mastered, recent activity, practice, demonstrated vs mastered, assessment history, full path (`#official-units`), weak concepts, pending assessments
- [x] Topic mind-map route renders the existing `MindMap` component (it was a bare list)
- [x] Topic hubs with more than one visualiser list every tool, not only the first
- [x] Tool index no longer imports client-module data into the server page (that threw on `/learn/tools/[id]`)
- [x] Hub resources use student-theme cards; lesson, note, flashcard, and assessment behaviour unchanged
- [x] Eight visualisers, five units, studio Run/Submit, and staff theme verified in `tests/e2e/student-access.spec.ts`
- [x] Auth, recommendation engine, API contracts, migrations, and faculty/coding themes not rewritten
- [ ] Intended nav labels (Learn, Study Materials, Practice, Revision, Assessments, My Progress) were never built; current eight links are the original set
- [ ] Coding Run/Submit history on the dashboard was specified in docs and was not implemented
- [ ] Monaco stays `vs-dark` (not this milestone)

## Milestone 2F.11 — Application / API security hardening

- [x] HMAC-SHA-256 session signatures; decode accepts only UUID + roll; extra claims dropped
- [x] Faculty Bearer compared with `timingSafeEqual`; labs/papers use `facultyAuthorized`
- [x] Cookie-mutating student POSTs reject mismatched `Origin`; missing Origin still allowed
- [x] JSON bodies capped (64 KiB API, 128 KiB execute); 413 `payload_too_large`
- [x] Invite HTTP maps `roll_mismatch` → `invalid_invitation`; login always verifies a hash
- [x] Progress rejects client `assessment_completed` / `knowledge_check`; ready production errors stay generic
- [x] API JSON is `Cache-Control: no-store` plus nosniff / DENY / same-origin referrer
- [x] Regression: two students, faculty, unauthenticated, CSRF, oversized/malformed bodies
- [x] Production judge remains disabled; migrations 001–014 unchanged

## Milestone 2F.10 — Firecracker host runtime

- [x] Linux host supervisor: Jailer-required lifecycle, unique UID/GID/CID, cgroup v2, UDS API/vsock, admission queue
- [x] Guest image build: GCC 13, vsock PID 1, no NIC/SSH; per-job disposable /work
- [x] Job API `POST /v1/jobs`, `POST /v1/jobs/:id/run` (+ `/stdin` alias), `DELETE /v1/jobs/:id`
- [x] Compile-once, stdin stream, academy-side compare; secrets never enter the guest
- [x] Pinned Firecracker/Jailer v1.12.0 with official SHA-256; provision + systemd + stale recovery
- [x] I1–I12 suite exists; skipped unless `CFORGE_FC_LIVE=1` on a ready Linux/KVM host
- [x] This development host is macOS — no `/dev/kvm`; **not** isolation evidence
- [x] `JUDGE_ALLOW_PRODUCTION` remains 0; Docker judge stays the local backend

## Milestone 2F.10.1 — Firecracker judge integration contract

- [x] Typed job API: create (source only) → run stdin → academy compares → destroy
- [x] Mock adapter for tests; Docker `/execute` remains the local default
- [x] Hidden expected outputs never enter the guest payload
- [x] Production execution stays off (`JUDGE_ALLOW_PRODUCTION` unset)
- [x] No Firecracker install on macOS; mock tests do not claim VM isolation

## Milestone 2F.9 — Distributed rate limiting

- [x] Shared PostgreSQL token bucket (`014`); atomic `academy_rate_limit_take`
- [x] Production uses the shared store only; unavailable store fails closed with 429 `rate_limited`
- [x] Hashed subjects; `X-Forwarded-For` only when `CFORGE_TRUST_PROXY=1`
- [x] Separate buckets: login, invite mint/accept, lesson check, assessment, diagnostic, judge run/submit
- [x] Verified on a restore database, then activated on live `cforge` (backup + `014` via `cforge_migrator`)
- [x] Live: owner/RLS/EXECUTE-only grants; concurrent take; login 429; 16 students / 55 seats unchanged

## Milestone 2F.8.3 — PostgreSQL SCRAM authentication

- [x] CForge LOGIN roles use SCRAM-SHA-256 passwords; owner/student/`cforge` stay NOLOGIN
- [x] pg_hba requires scram for `cforge_app` / `cforge_faculty` / `cforge_migrator` on socket, IPv4, IPv6
- [x] Broad `all/all trust` removed; administrator keeps local trust (no verifier)
- [x] Wrong passwords rejected; backup/restore-verify still work as admin

## Milestone 2F.8.2 — Separate database ownership from runtime

- [x] `cforge_owner` NOLOGIN owns application objects; `cforge_migrator` assumes owner for migrate only
- [x] `DATABASE_URL` is `cforge_app`; faculty URL stays separate; no runtime owner membership
- [x] Additive `013` plus `transfer-ownership.sql`; 001–012 unchanged
- [x] Restore-verify DB transferred and tested before live
- [x] Runtime cannot SET ROLE owner/migrator, ALTER schema, or write `schema_migrations`

## Milestone 2F.8.1 — Replace runtime owner bypass

- [x] Login uses `academy_login_lookup` as `cforge_app`; password verify stays in the app
- [x] Invite accept uses `academy_accept_invitation`; seat cap 55, one-time, roll bind
- [x] Hidden tests loaded only via `academy_exercise_tests`; no `exercise_tests` SELECT for `cforge_app`
- [x] Additive ledger `012`; no ownership change; no SUPERUSER / BYPASSRLS
- [x] Student APIs still omit hashes and expected stdout

## Milestone 2F.7.1 — Secure faculty database authorization

- [x] Separate `cforge_faculty` login; `current_faculty()` is `current_user = 'cforge_faculty'`
- [x] Ordinary `DATABASE_URL` cannot assume the faculty role or gain faculty RLS by setting the GUC
- [x] Faculty routes use `FACULTY_DATABASE_URL` after Bearer auth; missing credentials fail closed
- [x] Additive ledger `009`–`011`; no SUPERUSER / BYPASSRLS; student accept/analytics unchanged
- [x] Tests: GUC escalation denied, student 401, missing faculty URL 503, faculty role writes, isolation

## Milestone 2F.7 — Production security hardening

- [x] Faculty DB privilege boundary (2F.7.1)
- [x] In-process rate limits: login, invite mint/accept, lesson check, assessment/diagnostic submit, judge run/submit
- [x] Invitation tokens stay hashed; listings omit raw tokens; expire/revoke/one-time accept preserved
- [x] Session compare is timing-safe; production requires faculty DB URL + token; judge execution disabled unless `JUDGE_ALLOW_PRODUCTION=1`
- [x] Judge isolation residuals documented; no full-sandbox claim

## Milestone 2F.5.1 — Roll-bound invitations

- [x] Faculty mint requires an approved, unregistered roll
- [x] Invitation permanently bound to that roll; accept must match
- [x] Unapproved rolls rejected; one active invite per roll
- [x] Expiry, revoke, and repeat accept handled; accept stays transactional
- [x] Listing never includes raw tokens; Bearer + `withFacultyTx` unchanged
- [x] Additive ledger `008`; capacity 55 and roster identity unchanged
- [x] Tests: match, mismatch, duplicate invite, expired, revoked, re-accept, unauthorized, G56

## Milestone 2F.5 — Faculty dashboard v1

- [x] Faculty landing `/faculty` with existing design components
- [x] Bearer faculty auth; students 401 on faculty APIs
- [x] Overview: approved rolls, active accounts, pending invitations, capacity 55, available seats
- [x] Unit aggregates, assessment buckets, revisit topics, engagement from recorded data only
- [x] Roster search, name updates, invitation mint/list (no raw token on GET)
- [x] Official rolls G01–G55; CSV addendum Rishika, Laasya, Akshaya, Simran
- [x] Additive ledger `007` (roster rows, seat cap 55, faculty SELECT policies). No BYPASSRLS
- [x] Tests: faculty auth, student reject, roster update, 55-seat calc, aggregates, Playwright

## Milestone 2F.4 — Student learning analytics v1

- [x] Extended `/learn` dashboard (no second dashboard or schema)
- [x] Unit progress, recent activity, assessment history, practice/mastery lists, Continue + recommend
- [x] Session identity, server-derived scores, honest empty states
- [x] Tests: empty, partial, scored, two-student isolation, recommendation reuse

## Remaining

- [ ] Live Postgres + RLS verification when DATABASE_URL exists
- [ ] Official college PDF ingestion with real page numbers
- [ ] Remaining 20 unread Unit 999 labels
- [ ] Unit 1–5 official laboratory sheets (external)
- [ ] Verified previous-year papers (external)
- [ ] More judge-backed exercises beyond the 2F.3 set of twenty-two
- [ ] Full AI tutor (Milestone 3)
- [ ] Previous papers when supplied (Milestone 4)
- [ ] Per-submission user namespace / netns (needs capabilities this image does not have)
- [ ] Git commits (Xcode CLI missing; no repository on disk)
- [ ] Production security review
