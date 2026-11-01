import { describe, expect, it } from "vitest";
import { destFromAcademyHref } from "@/lib/adaptive";
import {
  assertNoAssessmentAnswerKey,
  assessmentSubmitRequest,
  mapAssessmentSubmit,
  mapGraphQuestions,
  mapPublicAssessment,
  mapPublicAssessmentItem,
  questionTypeFor,
  resolveAssessmentId,
  topicAssessmentId,
  unitAssessmentId,
} from "@/lib/assessment";
import { mapOfficialCurriculum } from "@/lib/curriculum-official";
import { mapExecuteResponse, unavailableJudgeResult } from "@/lib/judge";
import { teachingProgressRequest } from "@/lib/progress-events";
import { ALREADY_INTEGRATED_KINDS, NEWLY_INTEGRATED_KINDS, ORIGINAL_TEACHING_KINDS } from "@/lib/teaching";
import { demoServices } from "@/services/demo-adapter";

describe("curriculum catalog mapping", () => {
  it("reads official unit and topic counts without adding a sixth unit", () => {
    const official = mapOfficialCurriculum({
      officialUnitCount: 5,
      officialTopicCount: 35,
      units: [
        { id: "unit-1", title: "Introduction, C Preliminaries and Operators", sourceLabel: "UNIT 1 — Introduction, C Preliminaries and Operators", topicCount: 8 },
        { id: "unit-2", title: "Conditional / Decision Statements and Control Structures", sourceLabel: "UNIT 2", topicCount: 7 },
        { id: "unit-3", title: "Arrays and Strings", sourceLabel: "UNIT 3", topicCount: 6 },
        { id: "unit-4", title: "Storage Classes and Functions", sourceLabel: "UNIT 4", topicCount: 6 },
        { id: "unit-5", title: "Searching and Sorting", sourceLabel: "UNIT 5", topicCount: 8 },
      ],
      foundation: { notAnOfficialUnit: true },
    });
    expect(official?.officialUnitCount).toBe(5);
    expect(official?.officialTopicCount).toBe(35);
    expect(official?.units.map((unit) => unit.id)).toEqual(["unit-1", "unit-2", "unit-3", "unit-4", "unit-5"]);
    expect(official?.foundationIsOfficialUnit).toBe(false);
    expect(official?.units[0]?.title).toBe("Introduction, C Preliminaries and Operators");
  });
});

describe("teaching package reachability", () => {
  it("keeps every original teaching kind in the Emergent dest map", () => {
    expect([...ORIGINAL_TEACHING_KINDS].sort()).toEqual([...ALREADY_INTEGRATED_KINDS, ...NEWLY_INTEGRATED_KINDS].sort());
    expect(destFromAcademyHref("/learn/topics/u1-t1/notes")?.to).toBe("/learn/topics/$topicId/notes");
    expect(destFromAcademyHref("/learn/topics/u1-t1/oneshot")?.to).toBe("/learn/topics/$topicId/resources");
    expect(destFromAcademyHref("/learn/topics/u1-t1/practice")).toEqual({
      to: "/learn/topics/$topicId/$kind",
      params: { topicId: "u1-t1", kind: "practice" },
    });
  });
});

describe("assessments", () => {
  it("uses original topic: and unit: identifiers", () => {
    expect(topicAssessmentId("u1-t1")).toBe("topic:u1-t1");
    expect(unitAssessmentId("unit-1")).toBe("unit:unit-1");
    expect(resolveAssessmentId("ta-u1-t1")).toBe("topic:u1-t1");
    expect(destFromAcademyHref("/learn/assessments/topic/u1-t1")).toEqual({
      to: "/learn/assessments/$assessmentId",
      params: { assessmentId: "topic:u1-t1" },
    });
    expect(destFromAcademyHref("/learn/assessments/topic:u1-t1")).toEqual({
      to: "/learn/assessments/$assessmentId",
      params: { assessmentId: "topic:u1-t1" },
    });
    expect(destFromAcademyHref("/learn/assessments/ta-u1-t1")).toEqual({
      to: "/learn/assessments/$assessmentId",
      params: { assessmentId: "topic:u1-t1" },
    });
  });

  it("maps short-answer and choice items without keys", () => {
    expect(questionTypeFor("short_answer", [])).toBe("short-answer");
    expect(questionTypeFor("predict", ["1", "2", "3"])).toBe("predict-output");
    const item = mapPublicAssessmentItem({
      id: "u1-t1-q1",
      family: "short_answer",
      method: "definition",
      prompt: "Why binary?",
      marks: 2,
      topicId: "u1-t1",
    });
    expect(item?.type).toBe("short-answer");
    expect(item?.options).toEqual([]);
    expect(() => mapPublicAssessmentItem({ id: "x", prompt: "q", answer: "hidden" })).toThrow(/answer key/);
    expect(mapGraphQuestions([{
      id: "q1",
      type: "single-choice",
      prompt: "Why binary?",
      options: [],
      family: "short_answer",
    }])[0]?.type).toBe("short-answer");
  });

  it("submits responses and displays only the server score", () => {
    const request = assessmentSubmitRequest("topic:u1-t1", { "u1-t1-q1": "two stable hardware states" });
    expect(request.path).toBe("/api/v1/assessments/topic%3Au1-t1/submit");
    expect(request.payload).toEqual({ responses: { "u1-t1-q1": "two stable hardware states" } });
    const result = mapAssessmentSubmit("topic:u1-t1", {
      earned: 2,
      total: 8,
      review: [{ id: "u1-t1-q1", correct: true, expected: "no" }],
      answerKeysIncluded: false,
    });
    expect(result.correct).toBe(2);
    expect(result.total).toBe(8);
    expect(result.isPreview).toBe(false);
    expect(result.perQuestion[0]?.correctOptionId).toBeUndefined();
    expect(() => assertNoAssessmentAnswerKey(result)).not.toThrow();
  });

  it("maps a public assessment GET payload", () => {
    const assessment = mapPublicAssessment({
      id: "topic:u1-t1",
      title: "Computers — topic assessment",
      officialExam: false,
      items: [
        { id: "q1", family: "concept", prompt: "Name the ALU partner.", choices: ["control unit", "disk"] },
        { id: "q2", family: "short_answer", prompt: "Why binary?" },
      ],
      answerKeysIncluded: false,
    });
    expect(assessment?.questions).toHaveLength(2);
    expect(assessment?.questions[0]?.type).toBe("single-choice");
    expect(assessment?.questions[1]?.type).toBe("short-answer");
  });
});

describe("flashcards and progress events", () => {
  it("posts only supported teaching events and never a client score", () => {
    const built = teachingProgressRequest("u1-t1", "flashcards_reviewed");
    expect(built).toEqual({
      ok: true,
      path: "/api/v1/progress",
      payload: { topicId: "u1-t1", kind: "flashcards_reviewed", dimension: "concept", assisted: false },
    });
    expect(JSON.stringify(built)).not.toMatch(/correct|srs|interval/);
    expect(teachingProgressRequest("", "notes_viewed").ok).toBe(false);
  });
});

describe("judge execute mapping", () => {
  it("never turns an unavailable judge into a successful compile", () => {
    expect(mapExecuteResponse("run", 503, { error: "JUDGE_UNAVAILABLE" })).toEqual(unavailableJudgeResult("run"));
    expect(mapExecuteResponse("submit", 200, { verdict: "accepted", compiler: "", stdout: "1\n", tests: [{ ordinal: 1, passed: true }] }).verdict).toBe("accepted");
  });

  it("keeps demo execution honest", async () => {
    const run = await demoServices.judge.run("ex", "int main(){return 0;}", "");
    expect(run.verdict).toBe("unavailable");
    expect(run.compilerOutput).toMatch(/not compiled or executed|not connected/i);
  });
});
