import { describe, expect, it } from "vitest";
import { assertNoAnswerKey, buildDiagnosticAnswers, firstRunPath, PLACEMENT_COPY } from "@/lib/diagnostic";
import { isStartIntent, START_INTENTS } from "@/lib/onboarding";
import type { DiagnosticItem } from "@/domain/types";

const item: DiagnosticItem = {
  id: "u1-t1:check:1",
  topicId: "u1-t1",
  method: "mcq",
  kind: "mcq",
  prompt: "Which unit is the CPU in?",
  choices: ["Input", "ALU", "Printer"],
  dimension: "concept",
};

describe("onboarding intents", () => {
  it("uses only official START_INTENTS", () => {
    expect([...START_INTENTS]).toEqual([
      "from_scratch",
      "test_knowledge",
      "theory_weak_coding",
      "exam_revision",
      "problem_solving",
    ]);
    expect(isStartIntent("from_scratch")).toBe(true);
    expect(isStartIntent("advanced")).toBe(false);
  });
});

describe("first-run routing", () => {
  it("sends students without a preference to onboarding", () => {
    expect(firstRunPath({ startIntent: null, sessions: [] })).toBe("/learn/onboarding");
  });

  it("resumes an open diagnostic and does not force completed students", () => {
    expect(firstRunPath({
      startIntent: "from_scratch",
      sessions: [{ id: "s1", status: "open", rubricVersion: "2d1-placement-v1", createdAt: "t" }],
    })).toBe("/learn/diagnostic");
    expect(firstRunPath({
      startIntent: "from_scratch",
      sessions: [{ id: "s1", status: "submitted", rubricVersion: "2d1-placement-v1", createdAt: "t" }],
    })).toBe("/learn");
  });
});

describe("diagnostic answers and keys", () => {
  it("builds server answers without scoring", () => {
    expect(buildDiagnosticAnswers([item], { [item.id]: "1" })).toEqual([{ itemId: item.id, value: 1 }]);
    expect(buildDiagnosticAnswers([{ ...item, kind: "short" }], { [item.id]: "ALU" })).toEqual([{ itemId: item.id, value: "ALU" }]);
  });

  it("rejects leaked answer keys on public items", () => {
    expect(() => assertNoAnswerKey(item)).not.toThrow();
    expect(() => assertNoAnswerKey({ ...item, answer: "1" } as DiagnosticItem)).toThrow(/answer/);
  });
});

describe("placement copy", () => {
  it("explains official states without inventing new ones", () => {
    expect(PLACEMENT_COPY.DEMONSTRATED.lede).toMatch(/not mastery/i);
    expect(Object.keys(PLACEMENT_COPY).sort()).toEqual([
      "DEMONSTRATED",
      "NEEDS_FOUNDATION",
      "NEEDS_LEARNING",
      "NEEDS_REVISION",
      "NOT_ASSESSED",
      "PARTIALLY_DEMONSTRATED",
    ].sort());
  });
});
