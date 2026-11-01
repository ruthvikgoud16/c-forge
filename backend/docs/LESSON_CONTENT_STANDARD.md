# Lesson content standard

A lesson body is structured JSON (`lesson_documents.body`). Sections are optional in length, not optional in intent: skip a section only when it does not apply (for example, no syntax block in a purely conceptual lesson).

## Sections

1. `objectives` — what the student should be able to do after the lesson
2. `explanation` — beginner-friendly, simple English; define terms on first use
3. `analogy` — optional real-world analogy
4. `syntax` — C terms and rules when the lesson is about language
5. `examples` — worked examples with steps
6. `visual` — flowchart, memory sketch, or structured diagram data (not a decorative image)
7. `execution` — step-by-step execution
8. `trace` — code tracing prompt
9. `predict` — output prediction prompt
10. `mistakes` — common misconceptions
11. `guided` — scaffolded practice
12. `independent` — solo work; may link a Milestone 1 exercise id
13. `check` — knowledge check items
14. `revision` — short recap prompts

## Modes

- `learning` — hints allowed; no penalty
- `exam` — hints restricted if configured; scoring disclosed; no hidden penalties

## Unit 1 status

Topics 1–7 have complete lesson JSON under `content/curriculum/lessons/`. Topic 8 (laboratory) is catalogued only; no experiment list was supplied.

Validate with `validateCompleteLesson` in `lib/curriculum/lesson-schema.ts`.

## Accuracy

- Do not teach non-standard functions as portable C without a label.
- Preserve official syllabus wording when classifying `OFFICIAL`.
- Supporting explanations must be marked `SUPPORTING`.
