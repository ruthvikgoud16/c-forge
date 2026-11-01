# Student experience

Owns navigation, dashboard, topic hub, and design direction. No visual redesign ships in Milestone 2C.

## Current UI (honest)

Routes: `/` (home), `/login`, `/join`, `/learn`, `/learn/units/[slug]`, `/learn/topics/[id]`, `/learn/lessons/[id]`, `/learn/foundation`, `/studio/[id]`.

The learn dashboard (`/learn`) greets `Welcome, <name or roll>`, shows Continue Learning, a server-computed next step, unit-wise progress (Units 1–5 teaching topics), recent opened/practised topics, assessment history (marks and dates only), topics that need practice, demonstrated vs mastered lists, path, weak concepts from real misses, and honest pending assessments. Empty accounts see empty lists, not invented progress. `/learn/path` and `/learn/diagnostic` are live. Topic pages label AVAILABLE / PLANNED / UNAVAILABLE resources. Progress is hydrated from Postgres when `DATABASE_URL` is set. Opening a lesson is not mastery. No exam-readiness percentage or leaderboard.

## Intended primary navigation

1. Dashboard
2. Learn
3. Study Materials
4. Practice
5. Revision
6. Assessments
7. Laboratory
8. My Progress

**Previous Papers** stays hidden until real papers are supplied (Milestone 4).

Resources remain discoverable from the topic hub so students are not forced through a second sitemap to find the same concept.

## Dashboard (2D)

Server-computed. Components:

- Continue learning (last resource)
- Recommended next step (from the adaptive engine)
- Current path (preference + unmet prerequisites)
- Unit progress (started / practised / mastered — labelled separately from placement)
- Weak concepts (from events, when enough data exists)
- Pending assessments
- Revision recommendations
- Recently accessed
- Coding practice progress (Run vs Submit history without hidden tests)

Recommendations use stored evidence. Do not store Profile A/B/C.

Empty states must tell the truth: “No diagnostic yet”, “Laboratory list not supplied”, “One-shot not written”.

## Topic resource hub (2D)

One page per official topic. Replaces the current single-link page.

1. Official `sourceLabel` and classification
2. Placement, mastery, and readiness — three lines, not one bar
3. Prerequisites (links)
4. Mind map excerpt
5. Cards for: deep lesson, complete notes, one-shot, quick notes, concepts, worked examples, visualisation, flashcards, coding practice, knowledge check, revision, assessment, laboratory

A missing resource is a disabled card with status from the matrix (`P` or `U`). Never fill the card with generated fake notes.

Accuracy notes from the catalog (for example `strrev()`, call-by-reference) stay visible on the hub.

## Design system (direction only — inspect current CSS first)

Current UI already uses a small set of classes (`brand`, `meta`, `card`, `row`, `grow`) and `system-ui`. Keep that until a dedicated visual pass.

| Token | Direction |
| --- | --- |
| Type | System UI; lesson body at a comfortable reading size; headings state the task, not the brand |
| Colour | Neutral page; classification chips; one accent for primary actions (Run vs Submit already distinct) |
| Cards | Same resource-card shape on hub, dashboard, and study materials |
| Progress | Three labelled lines (placement / mastery / readiness). No single gamified percentage |
| Diagrams | Structured SVG/data visuals from lesson JSON; not stock clip-art |
| Layout | Desktop: nav + main. Narrow: stacked nav, no horizontal squeeze of code |
| Access | Labels on icon buttons; keyboard to primary actions; do not rely on colour alone for pass/fail |

Priorities: readable lessons, clear hierarchy, honest empty states. Do not restyle in 2C.

## Faculty (future)

Class aggregates only. Rules: [FACULTY_ANALYTICS.md](FACULTY_ANALYTICS.md). No public leaderboard unless separately justified.
