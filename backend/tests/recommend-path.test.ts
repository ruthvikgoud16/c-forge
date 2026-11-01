import { beforeEach, describe, expect, it } from "vitest";
import { recommendNext, dashboardPayload } from "@/lib/learning/recommend";
import { resetLearningStore, setPlacement, setPreference, addEvent } from "@/lib/learning/store";
import { resetRoster } from "@/lib/roster/store";
import { topicAvailability } from "@/lib/learning/resources";

beforeEach(() => {
  resetLearningStore();
  resetRoster();
});

describe("recommendation engine", () => {
  it("gives a beginner the first available deep lesson", () => {
    setPreference("s-begin", "from_scratch");
    const next = recommendNext("s-begin");
    expect(next.topicId).toBe("u1-t1");
    expect(next.resourceType).toBe("DEEP_LESSON");
    expect(next.availability).toBe("AVAILABLE");
    expect(next.reason.toLowerCase()).toMatch(/lesson|start|diagnostic/);
    expect(next.mastery).toBeNull();
  });

  it("asks for a second method after partial demonstration", () => {
    setPlacement("s-part", "u1-t3", "PARTIALLY_DEMONSTRATED");
    const next = recommendNext("s-part");
    expect(next.topicId).toBe("u1-t3");
    expect(next.resourceType).toMatch(/PRACTICE|DEEP_LESSON/);
    expect(next.reason).toMatch(/One method|part/i);
  });

  it("lets a demonstrated student skip the introduction and go forward", () => {
    setPlacement("s-strong", "u1-t1", "DEMONSTRATED");
    const next = recommendNext("s-strong");
    expect(next.topicId).not.toBe("u1-t1");
    expect(["u1-t2", "u1-t3", "u1-t4", "u1-t5", "u1-t6", "u1-t7"]).toContain(next.topicId);
  });

  it("sends theory-ok students to coding practice when an exercise exists", () => {
    setPreference("s-code", "theory_weak_coding");
    setPlacement("s-code", "u1-t4", "DEMONSTRATED");
    const next = recommendNext("s-code");
    expect(next.resourceType).toBe("INDEPENDENT_PRACTICE");
    expect(next.availability).toBe("AVAILABLE");
    expect(next.href).toContain("/studio/");
  });

  it("recommends revision from evidence, not from a global label", () => {
    setPlacement("s-rev", "u1-t6", "NEEDS_REVISION");
    const next = recommendNext("s-rev");
    expect(next.topicId).toBe("u1-t6");
    expect(next.reason).toMatch(/revision/i);
  });

  it("does not treat incomplete diagnostics as mastery", () => {
    setPreference("s-diag", "test_knowledge");
    const next = recommendNext("s-diag");
    expect(next.resourceType).toBe("DIAGNOSTIC");
    expect(next.mastery).toBeNull();
    expect(next.readiness).toBeNull();
  });

  it("keeps skipped lessons reachable", () => {
    setPlacement("s-skip", "u1-t1", "DEMONSTRATED");
    const dash = dashboardPayload("s-skip", "26EG104G01");
    const t1 = dash.path[0].topics.find((t) => t.id === "u1-t1");
    expect(t1?.accessible).toBe(true);
    expect(t1?.href).toBe("/learn/topics/u1-t1");
  });
});

describe("resource honesty", () => {
  it("marks teaching topics available and official labs unavailable", () => {
    expect(topicAvailability("u1-t2").lesson).toBe("AVAILABLE");
    expect(topicAvailability("u2-t1").lesson).toBe("AVAILABLE");
    expect(topicAvailability("u1-t8").laboratory).toMatch(/UNAVAILABLE|UNVERIFIED/);
    expect(topicAvailability("u5-t8").laboratory).toMatch(/UNAVAILABLE|UNVERIFIED/);
    expect(topicAvailability("u1-t2").notes).toBe("AVAILABLE");
    expect(topicAvailability("u1-t2").topicAssessment).toBe("AVAILABLE");
  });

  it("recommends a real one-shot when the student asked for revision", () => {
    setPreference("s-exam", "exam_revision");
    const next = recommendNext("s-exam");
    expect(next.availability).toBe("AVAILABLE");
    expect(["ONE_SHOT", "QUICK_REVISION", "DEEP_LESSON"]).toContain(next.resourceType);
    expect(next.reason).not.toMatch(/invented paper|PYQ frequency/i);
  });
});

describe("dashboard identity", () => {
  it("greets with the roll when the name is pending", () => {
    const dash = dashboardPayload("s-greet", "26EG104G01");
    expect(dash.greeting).toBe("Welcome, 26EG104G01");
    expect(dash.displayName).toBeNull();
    expect(JSON.stringify(dash)).not.toMatch(/beginner|intermediate|advanced/);
  });

  it("lists weak concepts only from failed diagnostic events", () => {
    addEvent({
      studentId: "s-weak",
      topicId: "u1-t3",
      kind: "diagnostic",
      dimension: "concept",
      assisted: false,
      correct: false,
    });
    const dash = dashboardPayload("s-weak", "26EG104G03");
    expect(dash.weakConcepts.map((w) => w.topicId)).toEqual(["u1-t3"]);
  });
});
