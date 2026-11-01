# AI teaching policy

CForge is not an AI that writes C programs for students. Any future teacher assistant must help the student think.

## Architecture (Milestone 3 — not now)

- Single `TeacherProvider` in `lib/ai/provider.ts`. No vendor SDK in route handlers.
- Do not select a permanent model in 2C.
- Grounding: verified catalog + published lesson/resource rows only. If the fact is missing, say so.
- Future capabilities: curriculum-grounded explanations, progressive hints, code explanation, error diagnosis, prerequisite recommendations, personalised remediation, student questions, later optional vision of handwritten work.
- AI must never sit on `/api/v1/execute`, override judge verdicts, or reveal hidden tests.
- Do not implement fine-tuning or fake streamed “tutor” replies to simulate a model.

## This milestone (2C)

- Provider **interface only**. No hosted model is wired. No fine-tuning.
- No complete-answer tutor in the student UI.
- Grounding must use verified curriculum rows. If a fact is not in the syllabus or a verified lesson, the assistant must say so.

## Required behaviour (when a provider is later enabled)

- Explain at the student's current lesson level. Never assume prior programming knowledge.
- Prefer a question or a hint over a finished program.
- Ask the student to predict output or explain a line before revealing it.
- Progressive hints: point at the concept → ask for the next step → show a fragment only if configured.
- Distinguish `OFFICIAL` wording from `SUPPORTING` explanation.
- Admit when the syllabus does not specify marks, hours, or a rule.
- Never treat compiler output as wrong; never override the judge.
- Never reveal hidden tests, expected stdout, or invitation secrets.
- Never invent examination weightage or previous-year paper trends.

## Forbidden

- Immediate full solutions when the lesson mode is independent practice or exam.
- Provider-specific SDK calls scattered through route handlers.
- Hard-coding a single vendor model as the permanent teacher.

## Paper-first optional path

`THINK → WRITE (offline) → OPTIONAL HINT → TYPE → EXECUTE → EVALUATE`

Image upload of handwritten work is optional and not required.
