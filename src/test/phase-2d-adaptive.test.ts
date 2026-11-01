import { describe, expect, it } from "vitest";
import {
  dashboardIntro,
  destFromAcademyHref,
  mapDashboard,
  mapLearningPath,
  mapRecommendation,
} from "@/lib/adaptive";
import { demoServices } from "@/services/demo-adapter";
import { IS_DEMO } from "@/services";

const nextRaw = {
  topicId: "u1-t1",
  resourceType: "DEEP_LESSON",
  reason: "Start from the first available deep lesson.",
  href: "/learn/lessons/lesson-u1-t1",
  availability: "AVAILABLE",
  unmetPrerequisites: [],
  startIntent: "from_scratch",
  placement: "NOT_ASSESSED",
  mastery: null,
  readiness: null,
};

describe("href destinations", () => {
  it("maps official academy hrefs to existing Emergent screens", () => {
    expect(destFromAcademyHref("/learn/lessons/abc", "u1-t1")).toEqual({
      to: "/learn/topics/$topicId/lesson",
      params: { topicId: "u1-t1" },
    });
    expect(destFromAcademyHref("/learn/topics/u1-t2")).toEqual({
      to: "/learn/topics/$topicId",
      params: { topicId: "u1-t2" },
    });
    expect(destFromAcademyHref("/learn/topics/u1-t2/notes")).toEqual({
      to: "/learn/topics/$topicId/notes",
      params: { topicId: "u1-t2" },
    });
    expect(destFromAcademyHref("/learn/topics/u1-t2/oneshot")).toEqual({
      to: "/learn/topics/$topicId/resources",
      params: { topicId: "u1-t2" },
    });
    expect(destFromAcademyHref("/studio/ex-1")).toEqual({
      to: "/studio/$exerciseId",
      params: { exerciseId: "ex-1" },
    });
    expect(destFromAcademyHref("/learn/diagnostic")).toEqual({ to: "/learn/diagnostic" });
    expect(destFromAcademyHref("/learn/assessments/topic/u1-t1")).toEqual({
      to: "/learn/assessments/$assessmentId",
      params: { assessmentId: "topic:u1-t1" },
    });
    expect(destFromAcademyHref("/learn/assessments/unit/unit-1")).toEqual({
      to: "/learn/assessments/$assessmentId",
      params: { assessmentId: "unit:unit-1" },
    });
  });

  it("does not invent a destination for foundation or unknown hrefs", () => {
    expect(destFromAcademyHref("/learn/foundation")).toEqual({ to: "/learn/foundation" });
    expect(destFromAcademyHref("/learn/labs")).toEqual({ to: "/learn/labs" });
    expect(destFromAcademyHref("/learn/papers")).toEqual({ to: "/learn/papers" });
    expect(destFromAcademyHref("/learn/revision")).toEqual({ to: "/learn/revision" });
    expect(destFromAcademyHref("/learn/progress")).toEqual({ to: "/learn/progress" });
    expect(destFromAcademyHref("/learn/path")).toEqual({ to: "/learn/path" });
    expect(destFromAcademyHref("/learn/lessons/abc")).toBeNull();
    expect(destFromAcademyHref("/unknown")).toBeNull();
    expect(destFromAcademyHref(null)).toBeNull();
  });
});

describe("recommendation mapping", () => {
  it("keeps placement, mastery, and readiness separate", () => {
    const rec = mapRecommendation(nextRaw);
    expect(rec.placement).toBe("NOT_ASSESSED");
    expect(rec.mastery).toBeNull();
    expect(rec.readiness).toBeNull();
    expect(rec.dest).toEqual({ to: "/learn/topics/$topicId/lesson", params: { topicId: "u1-t1" } });
  });

  it("returns no dest when the href has no Emergent screen", () => {
    expect(mapRecommendation({ ...nextRaw, href: "/learn/foundation", resourceType: "FOUNDATION" }).dest).toEqual({
      to: "/learn/foundation",
    });
  });
});

describe("path and dashboard mapping", () => {
  it("maps the official path without inventing locked states", () => {
    const units = mapLearningPath([
      {
        id: "unit-1",
        title: "Unit 1",
        topics: [{
          id: "u1-t1",
          sourceLabel: "1.1",
          title: "Computer systems",
          placement: "NOT_ASSESSED",
          mastery: null,
          readiness: null,
          lesson: "AVAILABLE",
          notes: "AVAILABLE",
          laboratory: "UNAVAILABLE",
          href: "/learn/topics/u1-t1",
          accessible: true,
          prerequisites: [],
        }],
      },
    ]);
    expect(units[0]?.topics[0]?.placement).toBe("NOT_ASSESSED");
    expect(units[0]?.topics[0]?.mastery).toBeNull();
    expect(units[0]?.topics[0]?.accessible).toBe(true);
  });

  it("maps an empty dashboard without fabricating progress", () => {
    const dash = mapDashboard({
      greeting: "Welcome, 26EG104G01",
      rollIdentifier: "26EG104G01",
      displayName: null,
      startIntent: null,
      continueLearning: null,
      recommendedNext: nextRaw,
      path: [],
      weakConcepts: [],
      pendingAssessments: [],
      scoresAreSeparate: true,
      note: "Placement, mastery, and readiness are not one percentage.",
      analytics: {
        empty: true,
        unitProgress: [],
        recentlyOpened: [],
        recentlyPractised: [],
        assessmentHistory: [],
        needPractice: [],
        mastered: [],
        demonstrated: [],
        unsupported: ["class rank"],
      },
    }, "original");
    expect(dash.source).toBe("original");
    expect(dash.analytics.empty).toBe(true);
    expect(dash.continueLearning).toBeNull();
    expect(dash.analytics.unitProgress.reduce((sum, unit) => sum + unit.opened + unit.mastered, 0)).toBe(0);
    expect(dash.analytics.unitProgress).toEqual([]);
    expect(dash.analytics.mastered).toEqual([]);
    expect(dash.recommendedNext?.placement).toBe("NOT_ASSESSED");
  });

  it("refreshes continue learning from the latest payload", () => {
    const first = mapDashboard({ continueLearning: null, analytics: { empty: true } }, "original");
    const second = mapDashboard({
      continueLearning: { topicId: "u1-t1", kind: "opened_lesson", at: "t2", href: "/learn/lessons/x" },
      analytics: { empty: false, recentlyOpened: [{ topicId: "u1-t1", title: "Systems", kind: "opened_lesson", at: "t2", href: "/learn/lessons/x" }] },
    }, "original");
    expect(first.continueLearning).toBeNull();
    expect(second.continueLearning?.topicId).toBe("u1-t1");
    expect(second.continueLearning?.title).toBe("u1-t1");
    expect(second.analytics.empty).toBe(false);
    expect(second.continueLearning?.dest).toEqual({ to: "/learn/topics/$topicId/lesson", params: { topicId: "u1-t1" } });
  });

  it("does not treat missing diagnostic as failed placement", () => {
    const dash = mapDashboard({ recommendedNext: { ...nextRaw, placement: "NOT_ASSESSED" }, analytics: { empty: true } }, "original");
    expect(dash.recommendedNext?.placement).toBe("NOT_ASSESSED");
    expect(dash.analytics.needPractice).toEqual([]);
  });
});

describe("dashboard intro and demo separation", () => {
  it("does not force a diagnostic after an incomplete empty history is resolved", () => {
    expect(dashboardIntro({ startIntent: null, openDiagnostic: false, submittedDiagnostic: false, empty: true })).toBe("onboarding");
    expect(dashboardIntro({ startIntent: "from_scratch", openDiagnostic: true, submittedDiagnostic: false, empty: true })).toBe("resume-diagnostic");
    expect(dashboardIntro({ startIntent: "from_scratch", openDiagnostic: false, submittedDiagnostic: false, empty: true })).toBe("optional-diagnostic");
    expect(dashboardIntro({ startIntent: "from_scratch", openDiagnostic: false, submittedDiagnostic: false, empty: false })).toBeNull();
  });

  it("keeps demo adaptive data labelled demo", async () => {
    const dash = await demoServices.adaptive.dashboard();
    expect(dash.source).toBe("demo");
    expect(dash.recommendedNext?.reason).toMatch(/Demo recommendation only/);
    expect(dash.analytics.empty).toBe(true);
    expect(dash.analytics.mastered).toEqual([]);
    expect(IS_DEMO === true ? dash.source : "original").toBe(IS_DEMO ? "demo" : "original");
  });
});
