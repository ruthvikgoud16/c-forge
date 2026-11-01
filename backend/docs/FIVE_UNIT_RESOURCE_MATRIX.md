# Five-unit resource coverage matrix

Source of truth for “did we forget a resource?” Milestone 2C design. Update a cell when a resource is planned, implemented, verified, or still pending. Do not mark a topic complete because a page renders.

Official topic identifiers and source labels are copied from [content/curriculum/catalog.json](../content/curriculum/catalog.json). Do not invent labels.

## Status codes

| Code | Meaning |
| --- | --- |
| `V` | Implemented and verified (schema and/or automated tests) |
| `I` | Implemented in the repository; may be incomplete versus the standalone contract |
| `P` | Planned in the product blueprint; not built |
| `U` | Pending unknown official source — do not invent content |

When a cell contains two codes (`I / P`), the first is embedded-in-lesson material and the second is the standalone resource (complete notes, example library, topic test, interactive simulator). Embedded notes do **not** complete the standalone notes contract. See [CONTENT_RESOURCE_MODEL.md](CONTENT_RESOURCE_MODEL.md).

Columns:

- **Lesson** — deep lesson JSON
- **Notes** — complete notes resource
- **MindMap** — data-driven mind map
- **OneShot** — one-shot session
- **Examples** — worked-example library
- **Practice** — progressive practice / judge exercises
- **Visual** — structured visual or interactive simulator
- **Assess** — topic/unit assessment (not only in-lesson checks)

## UNIT 1 — Introduction, C Preliminaries and Operators

| TopicId | SourceLabel | Lesson | Notes | MindMap | OneShot | Examples | Practice | Visual | Assess |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| u1-t1 | Introduction: Block diagram of a computer and its components, Binary System. | I | I / P | I | P | I / P | P | I / P | I / P |
| u1-t2 | Algorithms and Flowcharts. | V | I / P | I | P | I / P | P | I / P | I / P |
| u1-t3 | C Preliminaries: Keywords, Identifiers, Constants, and Variables. | V | I / P | I | P | I / P | P | I / P | I / P |
| u1-t4 | C Preliminaries: Data Types, Formatted Input/Output Statements. | V | I / P | I | P | I / P | I / P | I / P | I / P |
| u1-t5 | C Preliminaries: Structure of a C Program — Examples. | V | I / P | I | P | I / P | I / P | I / P | I / P |
| u1-t6 | Operators: Arithmetic, Assignment, Relational and Logical Operators. | V | I / P | I | P | I / P | P | I / P | I / P |
| u1-t7 | Operators: Increment and Decrement, Bitwise, Ternary and Special Operators. | V | I / P | I | P | I / P | P | I / P | I / P |
| u1-t8 | Experiments / Laboratory for Unit I. | U | U | I | U | U | U | U | U |

Notes:

- `u1-t1` is the Milestone 2A lesson. It is **not** verified against `validateCompleteLesson`.
- `u1-t2`–`u1-t7` pass `validateCompleteLesson` (`tests/unit1-lessons.test.ts`).
- Unit 1 mind map exists from catalog topics via `mindMapForUnit`. Topic 8 is a listed node only.
- `u1-t4` practice `I` is `add-two-integers`. `u1-t5` practice `I` is Hello CForge. Neither is a full progressive ladder.
- `u1-t8` laboratory experiments were not supplied.

## UNIT 2 — Conditional / Decision Statements and Control Structures

| TopicId | SourceLabel | Lesson | Notes | MindMap | OneShot | Examples | Practice | Visual | Assess |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| u2-t1 | Precedence and Associativity, Type Conversion with Examples. | P | P | P | P | P | P | P | P |
| u2-t2 | Conditional Statements: if, if-else, nested if-else and Examples. | P | P | P | P | P | P | P | P |
| u2-t3 | Conditional Statements: else-if ladder and switch statements with Examples. | P | P | P | P | P | P | P | P |
| u2-t4 | Unconditional Statements: break, continue and goto. | P | P | P | P | P | P | P | P |
| u2-t5 | Control Structures: while, do-while. | P | P | P | P | P | P | P | P |
| u2-t6 | Control Structures: for and its examples. | P | P | P | P | P | P | P | P |
| u2-t7 | Experiments / Laboratory for Unit II. | U | U | P | U | U | U | U | U |

Catalog topic nodes exist. That is not a Unit 2 mind-map experience. Laboratory list unknown.

## UNIT 3 — Arrays and Strings

| TopicId | SourceLabel | Lesson | Notes | MindMap | OneShot | Examples | Practice | Visual | Assess |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| u3-t1 | Arrays: Introduction, One-Dimensional. | P | P | P | P | P | P | P | P |
| u3-t2 | Multi-Dimensional Array with suitable examples. | P | P | P | P | P | P | P | P |
| u3-t3 | Strings: Introduction, String I/O, Unformatted I/O. | P | P | P | P | P | P | P | P |
| u3-t4 | String operations with built-in functions: strlen(), strcmp(), strcat(), strcpy(), and strrev(). | P | P | P | P | P | P | P | P |
| u3-t5 | String operations without built-in functions. | P | P | P | P | P | P | P | P |
| u3-t6 | Experiments / Laboratory for Unit III. | U | U | P | U | U | U | U | U |

`strrev()` must be labelled non-standard when the lesson is written. Laboratory list unknown.

## UNIT 4 — Storage Classes and Functions

| TopicId | SourceLabel | Lesson | Notes | MindMap | OneShot | Examples | Practice | Visual | Assess |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| u4-t1 | Storage Classes: auto, static, register and extern with suitable examples. | P | P | P | P | P | P | P | P |
| u4-t2 | Functions: Introduction to Functions, Working with functions, Benefits and Types of Functions, return(), exit(). | P | P | P | P | P | P | P | P |
| u4-t3 | Parameter Passing Mechanisms: Call by Value and Call by Reference. | P | P | P | P | P | P | P | P |
| u4-t4 | Passing Arrays to Functions. | P | P | P | P | P | P | P | P |
| u4-t5 | Recursion with suitable illustrative programs. | P | P | P | P | P | P | P | P |
| u4-t6 | Experiments / Laboratory for Unit IV. | U | U | P | U | U | U | U | U |

Teach C pass-by-value accurately. Preserve the college phrase “Call by Reference” and explain pointer arguments. Laboratory list unknown.

## UNIT 5 — Searching and Sorting

| TopicId | SourceLabel | Lesson | Notes | MindMap | OneShot | Examples | Practice | Visual | Assess |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| u5-t1 | Searching: Linear Search. | P | P | P | P | P | P | P | P |
| u5-t2 | Searching: Binary Search. | P | P | P | P | P | P | P | P |
| u5-t3 | Sorting: Bubble Sort. | P | P | P | P | P | P | P | P |
| u5-t4 | Sorting: Insertion Sort. | P | P | P | P | P | P | P | P |
| u5-t5 | Sorting: Selection Sort. | P | P | P | P | P | P | P | P |
| u5-t6 | Sorting: Quick Sort. | P | P | P | P | P | P | P | P |
| u5-t7 | Sorting: Merge Sort. | P | P | P | P | P | P | P | P |
| u5-t8 | Competitive Programming Practice Problems using global coding platforms, Experiments / Laboratory for Unit V. | U | U | P | U | U | U | U | U |

No named platforms or problems were supplied. Do not invent a competitive set. Do not invent examination weightage.

## Unit 999 — Foundation (not an official unit)

Not counted in the 35 official rows. Status reminder only.

| Group | Count | Lesson | Notes | MindMap | OneShot | Examples | Practice | Visual | Assess |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible verified labels | 17 | P | P | P | P | P | P | P | P |
| Unread claimed entries | 20 | U | U | U | U | U | U | U | U |

PIC, mid-question-paper discussion, and Grand Test 1 are `LEGACY_UNVERIFIED`. No papers were supplied.

## Quick notes, concepts, flashcards

These types apply across topics. They are **P** for every official topic until a concept library exists. They are not extra matrix columns so the eight requested resources stay scannable. Track them in [CONTENT_RESOURCE_MODEL.md](CONTENT_RESOURCE_MODEL.md) when the first entries ship.

## Counts (official topics only)

- Official topics: 35
- Deep lessons verified: 6 (`u1-t2`–`u1-t7`)
- Deep lessons implemented but not full-schema: 1 (`u1-t1`)
- Laboratory / unknown-source topics: 5 (`u1-t8`, `u2-t7`, `u3-t6`, `u4-t6`, `u5-t8`)
- Remaining teaching topics planned only: 23
