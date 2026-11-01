import { describe, expect, it } from "vitest";
import { loadLesson } from "@/lib/curriculum/catalog";
import { assertNoStudentAnswerKey, toPublicLesson } from "@/lib/curriculum/public-lesson";
import { gradeLessonCheck } from "@/lib/curriculum/lesson-check";
import { packageForTopic, publicItem, publicReview, scoreResponses } from "@/lib/content/registry";
import { publicItem as publicDiagnosticItem, loadDiagnosticBank } from "@/lib/learning/bank";
import { toPublicExercise, toPublicSubmitResult, assertNoHiddenLeak } from "@/lib/academy/public-dto";
import { helloCforge } from "@/lib/academy/exercise-data";

describe("lesson student payload", () => {
  it("keeps teaching text and strips graded keys", () => {
    const raw = loadLesson("u1-t1-computers-and-binary");
    expect(raw).toBeTruthy();
    const body = raw!.body as {
      trace: { prompt: string; answer: string };
      predict: { prompt: string; answer: string };
      check: Array<{ answer?: string }>;
      explanation: string;
    };
    expect(body.trace.answer.length).toBeGreaterThan(0);
    expect(body.predict.answer.length).toBeGreaterThan(0);
    expect(body.check.some((c) => c.answer !== undefined)).toBe(true);

    const pub = toPublicLesson(raw!);
    const pubBody = pub.body as {
      trace: { prompt?: string; answer?: string };
      predict: { prompt?: string; answer?: string };
      independent: { answer?: string };
      guided: { expected?: string[]; hint?: string };
      check: Array<{ prompt?: string; answer?: string }>;
      explanation: string;
      examples: unknown[];
    };
    expect(pubBody.trace.prompt).toBe(body.trace.prompt);
    expect(pubBody.trace.answer).toBeUndefined();
    expect(pubBody.predict.answer).toBeUndefined();
    expect(pubBody.independent.answer).toBeUndefined();
    expect(pubBody.guided.expected).toBeUndefined();
    expect(pubBody.check.every((c) => c.answer === undefined)).toBe(true);
    expect(pubBody.explanation.length).toBeGreaterThan(100);
    expect(pubBody.examples.length).toBeGreaterThan(0);
    expect((pub as { notes?: { examAnswer?: string } }).notes?.examAnswer).toBeTruthy();
    expect(() => assertNoStudentAnswerKey({ lesson: pub })).not.toThrow();
  });

  it("grades in-lesson checks on the server without returning the key", () => {
    const raw = loadLesson("u1-t1-computers-and-binary")!;
    const expected = (raw.body as { trace: { answer: string } }).trace.answer;
    const right = gradeLessonCheck("u1-t1-computers-and-binary", "trace", expected);
    expect(right.ok).toBe(true);
    if (right.ok) expect(right.correct).toBe(true);
    const wrong = gradeLessonCheck("u1-t1-computers-and-binary", "trace", "not-the-key");
    expect(wrong.ok && wrong.correct).toBe(false);
    expect(JSON.stringify(right)).not.toMatch(/"answer"|"expected"/);
  });
});

describe("assessment student payload", () => {
  it("omits answers on GET items and after scoring", () => {
    const pkg = packageForTopic("u1-t1");
    expect(pkg).toBeTruthy();
    const items = pkg!.assessment.map(publicItem);
    expect(items.every((i) => !("answer" in i) && !("explanation" in i))).toBe(true);
    const right: Record<string, string> = {};
    for (const item of pkg!.assessment) right[item.id] = item.answer;
    const scored = scoreResponses(pkg!.assessment, right);
    expect(scored.earned).toBe(scored.total);
    const review = publicReview(scored.review);
    expect(review.every((r) => r.correct && r.marks === r.max)).toBe(true);
    expect(() => assertNoStudentAnswerKey({ items, review })).not.toThrow();
    expect(JSON.stringify(review)).not.toMatch(/"expected"|"explanation"|"answer"/);
  });
});

describe("diagnostics and judge", () => {
  it("keeps diagnostic bank keys off the public item", () => {
    const bank = loadDiagnosticBank();
    expect(bank.some((i) => String(i.answer).length > 0)).toBe(true);
    const pub = publicDiagnosticItem(bank[0]);
    expect(pub).not.toHaveProperty("answer");
    expect(JSON.stringify(pub)).not.toMatch(/"answer"/);
  });

  it("still hides hidden judge tests", () => {
    const dto = toPublicExercise(helloCforge);
    assertNoHiddenLeak(dto);
    assertNoHiddenLeak(
      toPublicSubmitResult({
        verdict: "accepted",
        passed: 1,
        total: 1,
        tests: [{ ordinal: 1, passed: true, visibility: "hidden", expected: "secret" }],
      }),
    );
  });
});
