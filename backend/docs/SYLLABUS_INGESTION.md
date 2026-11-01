# Syllabus ingestion

**Current official source:** teacher lesson-plan screenshots transcribed in the Milestone 2A brief.

**PDF status: not provided.** No PDF page numbers are recorded.

`OFFICIAL` rows in `content/curriculum/catalog.json` match the five units and their listed topics only.

Do not invent hours, marks, examination weightage, or unread Unit 999 entries.

## Workflow

1. Faculty or operator places the PDF under `content/syllabus/source/` (git-ignored binaries are fine; record SHA-256).
2. Extractor produces `content/curriculum/mapping.json` with one record per extracted heading.
3. Every record stores:
   - `sourceLabel` — wording as printed
   - `normalizedTitle` — display title (optional)
   - `pdfPage` — page number from the PDF, or `null` if unknown
   - `kind` — unit | topic | practical | exam_note | other
   - `classification` — `OFFICIAL` when the line is in the current official source (today: lesson-plan screenshots; later: PDF headings that match)
   - `extractionConfidence` — high | medium | low
   - `needsHumanVerification` — true when OCR, crop, or wording is ambiguous
4. A human reviews low-confidence and unverified rows.
5. Only after review does a migration promote rows into `curriculum_units` / `curriculum_topics` as `OFFICIAL`.

## Extraction rules

- Preserve original topic wording in `sourceLabel`.
- Record stated marks, hours, and exam notes only if the PDF states them.
- Flag missing pages or unreadable lines. Never invent a page number.
- Practical / laboratory lines are first-class records, not filler topics.
- Informal lists from chat or memory stay `LEGACY_UNVERIFIED`. The teacher lesson-plan screenshots already transcribed in `catalog.json` are the current official source. Additional unread screenshot lines must not be invented. PDF ingest adds page numbers; it does not invent new official topics.

## Current mapping

See `content/curriculum/catalog.json`. Official unit count: **5**. Official topics: **35**. PDF mapping remains pending.
