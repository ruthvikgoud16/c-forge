# Content verification

Automated: `assertDraftQuality` on every package (lesson schema, 6 flashcards, 4 assessment items, two families, notes length). `tests/content-packages.test.ts` passed after Unit 1 topic 1 gained a second example and completion criteria.

C examples in drafts are standard C11-shaped teaching programs. They were not batch-run through the Docker judge in this environment (local GCC isolate tests still skip).

Accuracy checks in tests: `strrev` non-standard; C pass-by-value; no PYQ frequency strings; official labs not AVAILABLE.
