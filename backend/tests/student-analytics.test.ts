import { beforeEach, describe, expect, it } from "vitest";
import { dashboardPayload, recommendNext } from "@/lib/learning/recommend";
import { studentLearningAnalytics } from "@/lib/learning/analytics";
import { addEvent, resetLearningStore, setPlacement } from "@/lib/learning/store";
import { recordAttempt, resetAssessments } from "@/lib/content/assess-store";
import { resetRoster } from "@/lib/roster/store";
import { resetHydration } from "@/lib/learning/persist";

beforeEach(() => {
  resetLearningStore();
  resetAssessments();
  resetRoster();
  resetHydration();
});

function open(studentId: string, topicId: string) {
  addEvent({
    studentId,
    topicId,
    kind: "lesson_opened",
    dimension: "concept",
    assisted: false,
  });
}

function practise(studentId: string, topicId: string) {
  addEvent({
    studentId,
    topicId,
    kind: "knowledge_check",
    dimension: "concept",
    assisted: false,
    correct: true,
  });
}

function master(studentId: string, topicId: string) {
  open(studentId, topicId);
  practise(studentId, topicId);
  addEvent({
    studentId,
    topicId,
    kind: "independent",
    dimension: "independent_write",
    assisted: false,
    correct: true,
  });
  addEvent({
    studentId,
    topicId,
    kind: "assessment_completed",
    dimension: "exam",
    assisted: false,
    correct: true,
  });
}

describe("student learning analytics", () => {
  it("shows honest empty state and still recommends a first lesson", () => {
    const dash = dashboardPayload("empty", "26EG104G01");
    expect(dash.analytics.empty).toBe(true);
    expect(dash.analytics.recentlyOpened).toEqual([]);
    expect(dash.analytics.recentlyPractised).toEqual([]);
    expect(dash.analytics.assessmentHistory).toEqual([]);
    expect(dash.analytics.needPractice).toEqual([]);
    expect(dash.analytics.mastered).toEqual([]);
    expect(dash.analytics.demonstrated).toEqual([]);
    expect(dash.analytics.unitProgress).toHaveLength(5);
    expect(dash.analytics.unitProgress.every((unit) => unit.opened === 0 && unit.mastered === 0)).toBe(true);
    expect(dash.continueLearning).toBeNull();
    const next = recommendNext("empty");
    expect(next.topicId).toBe("u1-t1");
    expect(next.mastery).toBeNull();
    expect(dash.analytics.unsupported).toContain("examination readiness");
    expect(JSON.stringify(dash)).not.toMatch(/leaderboard|global beginner/i);
  });

  it("does not treat opening a lesson as mastery", () => {
    open("partial", "u1-t1");
    const dash = dashboardPayload("partial", "26EG104G02");
    expect(dash.analytics.empty).toBe(false);
    const unit1 = dash.analytics.unitProgress.find((unit) => unit.id === "unit-1");
    expect(unit1?.opened).toBe(1);
    expect(unit1?.practised).toBe(0);
    expect(unit1?.mastered).toBe(0);
    expect(dash.analytics.recentlyOpened[0]?.topicId).toBe("u1-t1");
    expect(dash.analytics.mastered).toEqual([]);
    expect(dash.analytics.recentlyPractised).toEqual([]);
  });

  it("lists assessment history with marks and dates only", () => {
    recordAttempt({
      studentId: "scored",
      assessmentId: "unit:unit-1",
      earned: 4,
      total: 6,
      byTopic: { "u1-t1": { earned: 4, max: 6 } },
      startedAt: "2026-10-31T10:00:00.000Z",
      completedAt: "2026-10-31T10:05:00.000Z",
      responses: { q1: "secret-answer" },
      itemResults: [{ id: "q1", topicId: "u1-t1", family: "mcq", correct: true, marks: 2, max: 2 }],
    });
    const dash = dashboardPayload("scored", "26EG104G03");
    expect(dash.analytics.assessmentHistory).toEqual([
      expect.objectContaining({
        assessmentId: "unit:unit-1",
        earned: 4,
        total: 6,
        attempt: 1,
        href: "/learn/assessments/unit/unit-1",
      }),
    ]);
    const blob = JSON.stringify(dash.analytics.assessmentHistory);
    expect(blob).not.toContain("secret-answer");
    expect(blob).not.toContain("itemResults");
    expect(blob).not.toContain("responses");
  });

  it("keeps two students isolated and persists in-process after hydration reset", () => {
    open("alpha", "u1-t2");
    practise("alpha", "u1-t2");
    setPlacement("alpha", "u1-t2", "DEMONSTRATED");
    master("alpha", "u1-t3");
    recordAttempt({
      studentId: "alpha",
      assessmentId: "topic:u1-t3",
      earned: 3,
      total: 3,
      byTopic: {},
      startedAt: "2026-10-31T11:00:00.000Z",
      completedAt: "2026-10-31T11:02:00.000Z",
    });
    open("beta", "u2-t1");
    setPlacement("beta", "u2-t1", "NEEDS_FOUNDATION");
    addEvent({
      studentId: "beta",
      topicId: "u2-t1",
      kind: "diagnostic",
      dimension: "concept",
      assisted: false,
      correct: false,
    });

    resetHydration();
    const a = dashboardPayload("alpha", "26EG104G04");
    const b = dashboardPayload("beta", "26EG104G05");
    expect(a.analytics.recentlyOpened.map((row) => row.topicId)).toContain("u1-t2");
    expect(a.analytics.recentlyOpened.map((row) => row.topicId)).not.toContain("u2-t1");
    expect(a.analytics.mastered.map((row) => row.topicId)).toContain("u1-t3");
    expect(a.analytics.demonstrated.map((row) => row.topicId)).toContain("u1-t2");
    expect(a.analytics.assessmentHistory[0]?.assessmentId).toBe("topic:u1-t3");
    expect(JSON.stringify(a.analytics)).not.toContain("u2-t1");
    expect(b.analytics.needPractice.map((row) => row.topicId)).toEqual(["u2-t1"]);
    expect(b.analytics.assessmentHistory).toEqual([]);
    expect(b.analytics.mastered).toEqual([]);
    expect(recommendNext("beta").topicId).toBe("u2-t1");
    expect(recommendNext("alpha").topicId).not.toBe("u2-t1");
  });

  it("uses the existing recommendation engine for the continue target", () => {
    setPlacement("rec", "u1-t1", "DEMONSTRATED");
    const next = recommendNext("rec");
    const dash = dashboardPayload("rec", "26EG104G06");
    expect(dash.recommendedNext.topicId).toBe(next.topicId);
    expect(dash.recommendedNext.href).toBe(next.href);
    expect(studentLearningAnalytics("rec").demonstrated[0]?.topicId).toBe("u1-t1");
  });
});
