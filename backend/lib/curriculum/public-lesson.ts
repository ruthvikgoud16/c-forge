import type { LessonDocument } from "./lesson-schema";

const GRADED_OBJECT_KEYS = new Set(["trace", "predict", "independent"]);

function stripCheckItem(item: Record<string, unknown>) {
  const { answer: _answer, expected: _expected, explanation: _explanation, ...rest } = item;
  return rest;
}

function stripGradedObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const copy = { ...(value as Record<string, unknown>) };
  delete copy.answer;
  delete copy.expected;
  delete copy.explanation;
  return copy;
}

/**
 * Student-facing lesson. Teaching text stays. Graded keys do not.
 * `notes.examAnswer` is study copy, not a scored item.
 */
export function toPublicLesson(lesson: LessonDocument | (Record<string, unknown> & { id: string; topicId: string })) {
  const bodyIn = (lesson.body ?? {}) as Record<string, unknown>;
  const body: Record<string, unknown> = { ...bodyIn };
  for (const key of GRADED_OBJECT_KEYS) {
    if (key in body) body[key] = stripGradedObject(body[key]);
  }
  if (body.guided && typeof body.guided === "object" && !Array.isArray(body.guided)) {
    const guided = { ...(body.guided as Record<string, unknown>) };
    delete guided.expected;
    delete guided.answer;
    body.guided = guided;
  }
  if (Array.isArray(body.check)) {
    body.check = body.check.map((item) =>
      item && typeof item === "object" ? stripCheckItem(item as Record<string, unknown>) : item,
    );
  }
  return {
    ...lesson,
    body,
    answerKeysIncluded: false,
  };
}

export function assertNoStudentAnswerKey(payload: unknown) {
  const text = JSON.stringify(payload);
  if (text.includes("expectedStdout") || /"visibility"\s*:/.test(text)) {
    throw new Error("hidden test field leaked");
  }
  if (/"expected"\s*:/.test(text)) {
    throw new Error("assessment expected answer leaked");
  }
  if (/"answer"\s*:/.test(text)) {
    throw new Error("answer key leaked");
  }
  if (/"explanation"\s*:/.test(text) && /"review"\s*:/.test(text)) {
    throw new Error("assessment explanation leaked");
  }
}
