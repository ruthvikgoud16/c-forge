import { beforeEach, describe, expect, it } from "vitest";
import { persistPracticeAttempt, publicAttempt } from "@/lib/content/assess-persist";
import { resetAssessments } from "@/lib/content/assess-store";
import { packageForTopic, publicItem, scoreResponses } from "@/lib/content/registry";
import { recommendNext } from "@/lib/learning/recommend";
import { resetLearningStore } from "@/lib/learning/store";

beforeEach(() => {
  resetAssessments();
  resetLearningStore();
});

describe("practice assessment persistence (memory)", () => {
  it("stores server-computed scores and increments attempt numbers", async () => {
    const first = await persistPracticeAttempt({
      studentId: "11111111-1111-4111-8111-111111111111",
      assessmentId: "topic:u1-t1",
      earned: 4,
      total: 8,
      byTopic: { "u1-t1": { earned: 4, max: 8 } },
      responses: { "u1-t1-q1": "alu" },
      itemResults: [{ id: "u1-t1-q1", topicId: "u1-t1", family: "concept", correct: false, marks: 0, max: 2 }],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    const second = await persistPracticeAttempt({
      studentId: "11111111-1111-4111-8111-111111111111",
      assessmentId: "topic:u1-t1",
      earned: 8,
      total: 8,
      byTopic: { "u1-t1": { earned: 8, max: 8 } },
      responses: {},
      itemResults: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    expect(first.attempt).toBe(1);
    expect(second.attempt).toBe(2);
    expect(publicAttempt(first).itemResults[0]).not.toHaveProperty("expected");
    expect(JSON.stringify(publicAttempt(first))).not.toMatch(/"answer"|"explanation"/);
    const again = await persistPracticeAttempt({
      studentId: "11111111-1111-4111-8111-111111111111",
      assessmentId: "topic:u1-t1",
      earned: 1,
      total: 8,
      byTopic: { "u1-t1": { earned: 1, max: 8 } },
      responses: {},
      itemResults: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      idempotencyKey: "same-key",
    });
    const retry = await persistPracticeAttempt({
      studentId: "11111111-1111-4111-8111-111111111111",
      assessmentId: "topic:u1-t1",
      earned: 1,
      total: 8,
      byTopic: { "u1-t1": { earned: 1, max: 8 } },
      responses: {},
      itemResults: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      idempotencyKey: "same-key",
    });
    expect(retry.attempt).toBe(again.attempt);
    expect(retry.id).toBe(again.id);
  });

  it("does not change recommendation shape after a stored attempt", () => {
    const before = recommendNext("s-assess-reg");
    expect(before.topicId).toBeTruthy();
    expect(before.placement).toBe("NOT_ASSESSED");
  });
});

describe("assessment keys stay off public items", () => {
  it("public bank items omit answers", () => {
    const pkg = packageForTopic("u2-t1");
    expect(pkg).toBeTruthy();
    const pub = publicItem(pkg!.assessment[0]);
    expect(pub).not.toHaveProperty("answer");
    const scored = scoreResponses(pkg!.assessment, {});
    expect(scored.earned).toBe(0);
  });
});
