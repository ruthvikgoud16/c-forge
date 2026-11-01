# Curriculum architecture

Programming education is the primary product experience. The judge and invitation slice from Milestone 1 stay the execution and access foundation.

## Teaching sequence

```
UNDERSTAND → VISUALISE → LEARN → TRACE → PREDICT
  → PRACTISE (guided) → SOLVE INDEPENDENTLY → ASSESS → MASTER
```

A student must be able to explain a concept before they are asked to memorise a program. Lessons may be conceptual, visual, or coding. Not every lesson is a judge problem.

## Hierarchy

```
Curriculum version
  └── Unit
       └── Topic
            └── Subtopic
                 └── Lesson
                      ├── Resources (notes, visuals, mind-map nodes, examples)
                      ├── Practice items
                      └── Assessments
```

- A unit contains many topics.
- A topic has prerequisites (other topics or foundation lessons) and learning outcomes.
- A subtopic groups lessons.
- A lesson has a typed body; resources are reusable and referenced, not copied.
- An exercise from Milestone 1 may be linked to a lesson as independent practice. Hidden tests stay on the server.

## Classification (required on every topic and lesson)

| Class | Meaning |
| --- | --- |
| `OFFICIAL` | Present in the verified official source. Today that source is the teacher lesson-plan screenshots. PDF page numbers are still pending. |
| `SUPPORTING` | Prerequisite or remediation needed to understand official topics. |
| `EXTENSION` | Useful beyond the supplied syllabus. Must be labelled as such in the UI. |

**Official source (current):** teacher lesson-plan screenshots in `content/curriculum/catalog.json`. Those five units and 35 topic wordings are stored as `OFFICIAL`.

**Pending:** college PDF page numbers. Do not invent pages, marks, or unread Unit 999 rows. A future PDF ingest may add `pdf_page` without rewriting source labels.

`content/curriculum/mapping.pending.json` remains for PDF ingest, not for denying screenshot official status.

## Progression

- Default path: sequential by unit order → topic order → lesson order.
- Diagnostic placement may recommend a later topic; it must still expose unmet prerequisites.
- Remediation links only to classified `SUPPORTING` or earlier `OFFICIAL` lessons, never to unrelated extension material.

## Versioning

Curriculum rows carry `curriculum_version`. Content edits create a new version; student mastery records point at the version they were assessed against.

## Unit 1 mind map

Generated from official topics in `catalog.json` via `mindMapForUnit`. Topics 1–7 link to lessons. Topic 8 remains a listed laboratory heading.

## Judge impact (none to isolation)

Lesson coding tasks call the existing `/api/v1/execute` path. GCC does not move into Next.js. Hidden tests remain server-side. No change to judge limits or fail-closed `JUDGE_URL` behaviour.
