import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getUnit, loadLesson, officialUnits } from "@/lib/curriculum/catalog";
import { validateCompleteLesson, type LessonDocument } from "@/lib/curriculum/lesson-schema";
import { recordProgress, topicState } from "@/lib/curriculum/progress";
import { toPublicExercise } from "@/lib/academy/public-dto";
import { addTwoIntegers } from "@/lib/academy/exercise-data";

const UNIT1_IMPLEMENTED = [
  { topicId: "u1-t1", lessonId: "u1-t1-computers-and-binary", requireCompletion: false },
  { topicId: "u1-t2", lessonId: "u1-t2-algorithms-flowcharts", requireCompletion: true },
  { topicId: "u1-t3", lessonId: "u1-t3-keywords-identifiers", requireCompletion: true },
  { topicId: "u1-t4", lessonId: "u1-t4-types-io", requireCompletion: true },
  { topicId: "u1-t5", lessonId: "u1-t5-c-program-structure", requireCompletion: true },
  { topicId: "u1-t6", lessonId: "u1-t6-basic-operators", requireCompletion: true },
  { topicId: "u1-t7", lessonId: "u1-t7-more-operators", requireCompletion: true },
];

describe("Unit 1 topic-to-lesson mapping", () => {
  it("maps topics 1–7 to lesson files and leaves laboratory without a fabricated lab sheet", () => {
    const unit = getUnit("unit-1");
    expect(unit?.topics).toHaveLength(8);
    for (const row of UNIT1_IMPLEMENTED) {
      const topic = unit!.topics.find((t) => t.id === row.topicId);
      expect(topic?.lessonId, row.topicId).toBe(row.lessonId);
    }
    expect(unit!.topics.find((t) => t.id === "u1-t8")?.lessonId).toBeUndefined();
  });

  it("preserves topic 1 source wording and lesson id from 2A", () => {
    const raw = readFileSync("content/curriculum/lessons/u1-t1-computers-and-binary.json", "utf8");
    const lesson = JSON.parse(raw);
    expect(lesson.id).toBe("u1-t1-computers-and-binary");
    expect(lesson.sourceLabel).toBe(
      "Introduction: Block diagram of a computer and its components, Binary System.",
    );
    expect(lesson.body.visual.type).toBe("block-diagram");
  });
});

describe("Unit 1 complete lessons", () => {
  it.each(UNIT1_IMPLEMENTED.filter((row) => row.topicId !== "u1-t1"))(
    "$lessonId matches catalog source label and schema",
    (row) => {
    const unit = getUnit("unit-1");
    const topic = unit!.topics.find((t) => t.id === row.topicId)!;
    const lesson = loadLesson(row.lessonId) as LessonDocument;
    expect(lesson).toBeTruthy();
    expect(lesson.sourceLabel).toBe(topic.sourceLabel);
    expect(lesson.topicId).toBe(row.topicId);
    const errors = validateCompleteLesson(lesson, { requireCompletion: row.requireCompletion });
    expect(errors, errors.join("; ")).toEqual([]);
    const trace = lesson.body.trace as { answer: string };
    const predict = lesson.body.predict as { answer: string };
    expect(trace.answer.length).toBeGreaterThan(0);
    expect(predict.answer.length).toBeGreaterThan(0);
    },
  );

  it("does not invent exam weightage or previous-year papers", () => {
    for (const row of UNIT1_IMPLEMENTED) {
      const text = JSON.stringify(loadLesson(row.lessonId));
      expect(text).not.toMatch(/previous-year|PYQ frequency|weightage \d+%/i);
    }
  });

  it("keeps five official units unchanged in count", () => {
    expect(officialUnits()).toHaveLength(5);
  });
});

describe("Unit 1 lesson progress", () => {
  it("records opened as started for every new topic", () => {
    for (const row of UNIT1_IMPLEMENTED.slice(1)) {
      const studentId = `s-${row.topicId}`;
      recordProgress({
        studentId,
        topicId: row.topicId,
        lessonId: row.lessonId,
        kind: "lesson_opened",
        dimension: "concept",
        assisted: false,
      });
      expect(topicState(studentId, row.topicId)).toBe("started");
    }
  });
});

describe("linked Unit 1 coding exercise", () => {
  it("hides hidden stdin of add-two-integers", () => {
    const dto = toPublicExercise(addTwoIntegers);
    expect(JSON.stringify(dto)).not.toContain("-2 9");
    expect(dto.sample.stdout).toBe("5\n");
  });
});
