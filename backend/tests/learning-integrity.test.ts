import { beforeEach, describe, expect, it } from "vitest";
import { rejectDerivedClaims, publicAnswerFieldsOnly } from "@/lib/learning/authz";
import { startDiagnostic, submitDiagnostic } from "@/lib/learning/diagnostics";
import { loadDiagnosticBank } from "@/lib/learning/bank";
import { getPlacement, resetLearningStore } from "@/lib/learning/store";
import { topicState } from "@/lib/curriculum/progress";
import { recordProgress } from "@/lib/curriculum/progress";

beforeEach(() => {
  resetLearningStore();
});

describe("client tampering", () => {
  it("rejects browser-set placement, mastery, and readiness on progress bodies", () => {
    expect(
      rejectDerivedClaims({
        topicId: "u1-t2",
        kind: "lesson_opened",
        dimension: "concept",
        placement: "DEMONSTRATED",
        mastery: "mastered",
        readiness: "ready",
      }),
    ).toEqual(["placement", "mastery", "readiness"]);
  });

  it("ignores client topic, method, and correct flags on diagnostic answers", async () => {
    const started = await startDiagnostic("s-tamper");
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const item = started.session.items.find((i) => i.topicId === "u1-t3") ?? started.session.items[0];
    const bank = loadDiagnosticBank().find((b) => b.id === item.id)!;
    const wrong = bank.kind === "mcq" ? (Number(bank.answer) === 0 ? 1 : 0) : "not-the-key";
    const result = await submitDiagnostic("s-tamper", started.session.id, [
      {
        itemId: item.id,
        value: wrong,
        topicId: "u5-t1",
        method: "independent_write",
        correct: true,
        placement: "DEMONSTRATED",
      } as { itemId: string; value: unknown },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const graded = result.graded.find((g) => g.itemId === item.id);
    expect(graded?.correct).toBe(false);
    expect(graded?.topicId).toBe(item.topicId);
    expect(getPlacement("s-tamper", "u5-t1")).toBe("NOT_ASSESSED");
    expect(result.graded.every((g) => !("answer" in g))).toBe(true);
  });

  it("only forwards itemId and value from a tampered answer row", () => {
    expect(
      publicAnswerFieldsOnly({
        itemId: "x",
        value: 1,
        topicId: "u5-t1",
        correct: true,
        method: "mcq",
      }),
    ).toEqual({ itemId: "x", value: 1 });
  });

  it("opening a lesson is progress started, not placement or mastery", () => {
    recordProgress({
      studentId: "s-open-2",
      topicId: "u1-t4",
      kind: "lesson_opened",
      dimension: "concept",
      assisted: false,
    });
    expect(topicState("s-open-2", "u1-t4")).toBe("started");
    expect(getPlacement("s-open-2", "u1-t4")).toBe("NOT_ASSESSED");
  });
});
