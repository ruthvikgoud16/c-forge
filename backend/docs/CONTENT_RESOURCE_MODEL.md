# Content resource model

Owns resource **types and contracts**. Topic-by-topic status lives in [FIVE_UNIT_RESOURCE_MATRIX.md](FIVE_UNIT_RESOURCE_MATRIX.md). Lesson section rules for deep lessons remain in [LESSON_CONTENT_STANDARD.md](LESSON_CONTENT_STANDARD.md).

## Abstraction

Prefer one logical `content_resources` row:

- `id`, `type`, `classification`, `curriculum_version`, `title`, `payload` (typed JSON), `status` (`draft` / `published` / `pending_source`)
- `resource_topic_links` many-to-many so one concept or example can appear on several topics

Do not create a database table per simulator widget.

Embedded lesson fields (`lesson.notes`, `lesson.body.examples`) are teaching material inside a deep lesson. They do **not** satisfy the standalone notes, one-shot, or example-library contracts.

## Type contracts

### `deep_lesson`

Teaching from absolute zero. Required parts (2B completeness bar):

Learning objectives, prerequisite explanations, beginner explanation, formal definitions, terminology, syntax and rules where applicable, mind map, visual, worked examples, tracing, output prediction, misconceptions, guided practice, independent practice, knowledge checks, revision notes, completion criteria.

Depth: DEEP. Language: simple English. Accuracy: do not sacrifice correctness. Mode: `learning` or `exam`.

Current files: `content/curriculum/lessons/u1-t*.json`. Topic 1 is below this bar until Milestone 2E.

### `complete_notes`

Long-form study notes for conceptual learning **and** formal answers.

Must include: introduction, definitions, explanation, syntax, rules, diagrams, examples, comparisons, differences, common mistakes, applications, short-answer preparation, long-answer preparation, quick revision points.

Uses official `sourceLabel`. Must not invent marks.

### `one_shot`

A consolidated session for a topic or unit. Not a short summary.

Must include: overview, concept sequence, important definitions, major rules and syntax, connected explanations, diagrams, representative worked examples, code walkthroughs, common mistakes, comparisons, key takeaways, end-of-session assessment.

Must link back to the deep lesson. Narration or video is a later optional payload field (`mediaHint`). Video production is not a current dependency.

### `mind_map`

Structured nodes and edges: label, classification, optional `href`, optional `prerequisiteOf`. Generated from catalog data (see `mindMapForUnit`). Not a decorative image.

Scopes: syllabus, unit, topic, subtopic where useful.

### `quick_notes`

Short cheat sheet: syntax, definitions, rules, function lists, operator tables, patterns, common mistakes. Distinct from complete notes.

### `concept`

One question-sized misunderstanding. Fields: prompt, simple explanation, formal term, optional tiny example, related topic ids, related lesson ids. Searchable and reusable.

Examples of entries (to write later, not now): what is a compiler; what `#include` does; why `main`; header files; `=` vs `==`; declaration vs initialisation; `%d`; zero-based index; recursion; parameter; why binary search needs sorted input.

### `flashcard` / `flashcard_deck`

Front/back for definitions, syntax, rules, comparisons. Topic-wise and unit-wise decks. Reinforce understanding; do not replace lessons.

### `worked_example`

Problem statement, required concepts, thought process, algorithm, code, line-by-line explanation, dry run, expected output, complexity only when relevant to the syllabus treatment, common mistakes.

### `visualisation`

Definition of a future interactive tool. Fields: learning objective, student interactions, inputs, visual feedback, educational benefit, dependencies, unit.

Priority (not an implementation list for 2C):

| Unit | First simulators | Why | Cost |
| --- | --- | --- | --- |
| 1 | Operator evaluator; flowchart builder | Highest daily use in Unit 1 | Medium |
| 2 | If/switch path; loop stepper | Decisions and repetition | Medium |
| 3 | Array and string memory | Index errors | Medium |
| 4 | Call stack; recursion tree | Invisible without a picture | High |
| 5 | Search + sort stepper | Compare algorithms | High |

Unit 1 also planned later: block-diagram explorer, binary converter, data-type explorer.

### `practice_set`

Progressive items: recognition, fill-in, predict, trace, identify error, complete code, algorithm, independent write, debug, challenge.

Coding items reuse Milestone 1 `exercises` and `/api/v1/execute`. Run ≠ Submit. Hidden tests stay server-side. Academy never compiles C.

### `assessment`

Diagnostic, topic checkpoint, unit test, coding assessment, revision, exam mode.

Answer keys stay on the server. Item types: MCQ, definition, explain, predict, trace, identify-error, complete-code, algorithm, flowchart, independent write, explain-why.

### `lab_sheet`

Only when a real laboratory list exists. Until then the official laboratory topic remains `U` in the matrix.

Simulator field list and build order: [VISUAL_SIMULATOR_CATALOG.md](VISUAL_SIMULATOR_CATALOG.md). Revision and assessment kinds: [REVISION_AND_ASSESSMENT.md](REVISION_AND_ASSESSMENT.md).

## Versioning

Student results store `curriculum_version` and resource id. Publishing a new payload does not rewrite historical attempt meaning.

## Classification

Every resource has `OFFICIAL`, `SUPPORTING`, `EXTENSION`, or `LEGACY_UNVERIFIED`. Official source wording stays on official resources.
