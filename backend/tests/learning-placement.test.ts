import { describe, expect, it } from "vitest";
import { evaluatePlacement, demonstratedRequiresTwoMethods } from "@/lib/learning/placement";
import { topicState } from "@/lib/curriculum/progress";
import { addEvent, resetLearningStore } from "@/lib/learning/store";

describe("placement engine", () => {
  it("stays NOT_ASSESSED without attempts", () => {
    expect(
      evaluatePlacement({ topicId: "u1-t3", methodsPassed: [], methodsAttempted: [] }),
    ).toBe("NOT_ASSESSED");
  });

  it("does not grant DEMONSTRATED for two identical methods", () => {
    const evidence = {
      topicId: "u1-t3",
      methodsPassed: ["mcq", "mcq"] as const,
      methodsAttempted: ["mcq", "mcq"] as const,
    };
    expect(demonstratedRequiresTwoMethods({ ...evidence, methodsPassed: ["mcq"] })).toBe(false);
    expect(evaluatePlacement({ topicId: "u1-t3", methodsPassed: ["mcq"], methodsAttempted: ["mcq"] })).toBe(
      "PARTIALLY_DEMONSTRATED",
    );
  });

  it("requires two different methods for DEMONSTRATED", () => {
    expect(
      evaluatePlacement({
        topicId: "u1-t6",
        methodsPassed: ["predict", "trace"],
        methodsAttempted: ["predict", "trace"],
      }),
    ).toBe("DEMONSTRATED");
  });

  it("marks foundation topic fails as NEEDS_FOUNDATION", () => {
    expect(
      evaluatePlacement({
        topicId: "u1-t1",
        methodsPassed: [],
        methodsAttempted: ["mcq"],
      }),
    ).toBe("NEEDS_FOUNDATION");
  });

  it("revises a prior demonstration after weaker evidence", () => {
    expect(
      evaluatePlacement({
        topicId: "u1-t6",
        methodsPassed: ["mcq"],
        methodsAttempted: ["mcq", "trace"],
        previousState: "DEMONSTRATED",
      }),
    ).toBe("NEEDS_REVISION");
  });

  it("does not treat opening a lesson as mastery or placement", () => {
    resetLearningStore();
    addEvent({
      studentId: "s-open",
      topicId: "u1-t2",
      kind: "lesson_opened",
      dimension: "concept",
      assisted: false,
    });
    expect(topicState("s-open", "u1-t2")).toBe("started");
    expect(evaluatePlacement({ topicId: "u1-t2", methodsPassed: [], methodsAttempted: [] })).toBe(
      "NOT_ASSESSED",
    );
  });
});
