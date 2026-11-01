import { describe, expect, it } from "vitest";
import { destFromAcademyHref } from "@/lib/adaptive";
import {
  ALREADY_INTEGRATED_KINDS,
  NEWLY_INTEGRATED_KINDS,
  ORIGINAL_TEACHING_KINDS,
  assertNoTeachingAnswerKey,
  destForTeachingKind,
  lessonCheckRequest,
  mapHubCard,
  mapLessonCheckError,
  mapLessonCheckResponse,
  mapPublicLesson,
  mapTopicHub,
  mergeTeachingPackage,
  publicCheckPayload,
  teachingContentForKind,
} from "@/lib/teaching";
import { demoServices } from "@/services/demo-adapter";
import { IS_DEMO } from "@/services";

const publicLessonRaw = {
  openedIsNotMastery: true,
  placement: { state: "NOT_ASSESSED" },
  topicState: { practised: false },
  lesson: {
    id: "u1-t1-computers-and-binary",
    topicId: "u1-t1",
    title: "Computers and binary",
    exerciseId: null,
    notes: {
      revision: ["Start place values from the right."],
      terms: [{ term: "ALU", meaning: "Does arithmetic." }],
    },
    body: {
      syntax: "bits are 0 or 1",
      revision: ["Start place values from the right."],
      examples: [{ title: "Decimal 13", problem: "Convert 13", steps: ["odd → 1", "even → 0", "read 1101"], code: null, output: "1101" }],
      trace: { prompt: "Which block does the addition?", answer: "HIDDEN" },
      predict: { prompt: "What is 00001101?", answer: "13" },
      guided: { prompt: "List the four boxes.", expected: ["cpu"], hint: "Think of the diagram." },
      independent: { prompt: "Convert 11.", answer: "1011" },
      check: [
        { id: "q1", kind: "mcq", prompt: "Which part performs addition?", choices: ["Input", "ALU"], answer: 1 },
        { id: "q2", kind: "short", prompt: "Decimal of 1010?", answer: "10" },
      ],
    },
  },
};

describe("content-kind inventory and mapping", () => {
  it("lists the original kinds and does not duplicate already-integrated pages", () => {
    expect(ORIGINAL_TEACHING_KINDS).toEqual([
      "notes", "oneshot", "mind-map", "quick", "concepts", "flashcards", "examples", "trace", "predict", "syntax", "practice",
    ]);
    expect(ALREADY_INTEGRATED_KINDS).toEqual(["notes", "oneshot", "mind-map", "flashcards"]);
    expect(NEWLY_INTEGRATED_KINDS).toEqual(["quick", "concepts", "examples", "trace", "predict", "syntax", "practice"]);
  });

  it("maps hub availability without inventing missing packages", () => {
    const hub = mapTopicHub({
      topic: { id: "u1-t1" },
      resources: [
        { type: "quick_notes", title: "Quick notes", availability: "AVAILABLE", href: "/learn/topics/u1-t1/quick" },
        { type: "code_tracing", title: "Code tracing", availability: "UNAVAILABLE", href: "/learn/topics/u1-t1/trace" },
        { type: "deep_lesson", title: "Deep lesson", availability: "AVAILABLE", href: "/learn/lessons/u1-t1-computers-and-binary" },
        { type: "laboratory", title: "Official laboratory", availability: "UNAVAILABLE", href: "/learn/labs" },
      ],
    });
    expect(hub.lessonId).toBe("u1-t1-computers-and-binary");
    expect(hub.cards.find((card) => card.kind === "quick")?.dest).toEqual({
      to: "/learn/topics/$topicId/$kind",
      params: { topicId: "u1-t1", kind: "quick" },
    });
    expect(hub.cards.find((card) => card.kind === "trace")?.dest).toBeNull();
    expect(mapHubCard({ type: "related", availability: "AVAILABLE", href: "/learn/topics/u1-t1" })?.kind).toBeNull();
  });

  it("strips keys from the public lesson and keeps only implemented fields", () => {
    const lesson = mapPublicLesson(publicLessonRaw);
    expect(lesson.trace?.prompt).toMatch(/addition/);
    expect(lesson.checks).toHaveLength(2);
    expect(lesson.checks[0]?.choices).toEqual(["Input", "ALU"]);
    expect(JSON.stringify(lesson)).not.toMatch(/"answer"/);
    expect(JSON.stringify(lesson)).not.toMatch(/"expected"/);
    assertNoTeachingAnswerKey({ checks: lesson.checks, trace: lesson.trace });
  });

  it("marks kinds missing when the package has no material", () => {
    const empty = mergeTeachingPackage({ topicId: "lab-only", source: "original" });
    expect(empty.availableKinds).toEqual([]);
    expect(empty.missingKinds).toEqual([...ORIGINAL_TEACHING_KINDS]);
    expect(teachingContentForKind(empty, "trace")).toBe(false);

    const full = mergeTeachingPackage({
      topicId: "u1-t1",
      source: "original",
      publicLesson: mapPublicLesson(publicLessonRaw),
      graphConcepts: [{ term: "ALU", definition: "Does arithmetic." }],
      alwaysPresent: ["notes", "oneshot", "mind-map", "flashcards"],
    });
    expect(full.availableKinds).toEqual(expect.arrayContaining([...NEWLY_INTEGRATED_KINDS, ...ALREADY_INTEGRATED_KINDS]));
    expect(teachingContentForKind(full, "examples")).toBe(true);
  });
});

describe("lesson-check contract", () => {
  it("builds the original POST payload and never adds a student-computed score", () => {
    const built = lessonCheckRequest({ lessonId: "u1-t1-computers-and-binary", slot: "trace", value: "ALU" });
    expect(built).toEqual({
      ok: true,
      path: "/api/v1/curriculum/lessons/u1-t1-computers-and-binary/check",
      payload: { slot: "trace", value: "ALU" },
    });
    expect(lessonCheckRequest({ lessonId: "x", slot: "check", value: 1, itemId: "q1" }).ok).toBe(true);
    expect(lessonCheckRequest({ lessonId: "x", slot: "review" as never, value: "1" })).toEqual({ ok: false, error: "invalid_slot" });
    expect(JSON.stringify(built)).not.toMatch(/correct|mastery|placement/);
  });

  it("displays only the server result fields", () => {
    const result = mapLessonCheckResponse({
      correct: true,
      itemId: "trace",
      unscored: false,
      answerKeysIncluded: false,
      answer: "ALU",
      expected: "ALU",
    });
    expect(result).toEqual({
      ok: true,
      correct: true,
      itemId: "trace",
      unscored: false,
      answerKeysIncluded: false,
      demo: false,
    });
    const publicResult = publicCheckPayload(result);
    expect(publicResult.ok).toBe(true);
    if (publicResult.ok) expect(publicResult.answerKeysIncluded).toBe(false);
  });

  it("maps invalid items, expired sessions, and persist failures", () => {
    expect(mapLessonCheckError(400, { error: "unknown_item" }).error).toBe("unknown_item");
    expect(mapLessonCheckError(400, { error: "invalid_slot" }).error).toBe("invalid_slot");
    expect(mapLessonCheckError(401, { error: "unauthorized" }).error).toBe("session_expired");
    expect(mapLessonCheckError(404, { error: "not_found" }).error).toBe("not_found");
    expect(mapLessonCheckError(503, { error: "LEARNING_PERSIST_FAILED" }).error).toBe("persist_failed");
  });

  it("does not expose answer keys when asserting public payloads", () => {
    expect(() => assertNoTeachingAnswerKey({ expected: "ALU" })).toThrow(/expected/);
    expect(() => assertNoTeachingAnswerKey({ answer: 1 })).toThrow(/answer key/);
    expect(() => assertNoTeachingAnswerKey({ answerKeysIncluded: false, correct: false })).not.toThrow();
  });
});

describe("destinations and demo versus production", () => {
  it("routes original teaching hrefs into Emergent kind pages", () => {
    expect(destFromAcademyHref("/learn/topics/u1-t1/quick")).toEqual({
      to: "/learn/topics/$topicId/$kind",
      params: { topicId: "u1-t1", kind: "quick" },
    });
    expect(destFromAcademyHref("/learn/topics/u1-t1/practice")).toEqual({
      to: "/learn/topics/$topicId/$kind",
      params: { topicId: "u1-t1", kind: "practice" },
    });
    expect(destForTeachingKind("u1-t1", "oneshot")).toEqual({
      to: "/learn/topics/$topicId/resources",
      params: { topicId: "u1-t1" },
    });
  });

  it("keeps demo teaching honest and never locally scores checks", async () => {
    const pkg = await demoServices.teaching.forTopic("computer-system");
    expect(pkg?.source).toBe("demo");
    expect(pkg?.availableKinds).toEqual(expect.arrayContaining(["concepts", "examples", "notes"]));
    expect(pkg?.trace).toBeNull();
    expect(pkg?.checks).toEqual([]);
    expect(pkg?.lessonId).toBeNull();
    const graded = await demoServices.teaching.check({ lessonId: "demo", slot: "trace", value: "ALU" });
    expect(graded).toEqual({ ok: false, error: "demo_unscored" });
    expect(await demoServices.teaching.forTopic("missing-topic")).toBeNull();
    if (IS_DEMO) expect(pkg?.source).toBe("demo");
  });
});
