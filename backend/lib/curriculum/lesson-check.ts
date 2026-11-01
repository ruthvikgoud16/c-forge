import { loadLesson } from "./catalog";
import { recordProgress } from "./progress";

export type LessonCheckSlot = "trace" | "predict" | "guided" | "independent" | "check";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[.]+$/, "")
    .replace(/\s+/g, " ");
}

function expectedFor(
  lesson: NonNullable<ReturnType<typeof loadLesson>>,
  slot: LessonCheckSlot,
  itemId?: string,
): { expected: string; kind: "mcq" | "short"; dimension: string; itemId: string } | null {
  const body = (lesson.body ?? {}) as Record<string, unknown>;
  if (slot === "check") {
    const checks = (body.check as Array<Record<string, unknown>>) ?? [];
    const item = itemId ? checks.find((c) => String(c.id) === itemId) : undefined;
    if (!item || item.answer === undefined) return null;
    return {
      expected: String(item.answer),
      kind: item.kind === "mcq" ? "mcq" : "short",
      dimension: String(item.dimension ?? "concept"),
      itemId: String(item.id),
    };
  }
  if (slot === "guided") {
    const guided = body.guided as { expected?: string[]; hint?: string } | undefined;
    const expected = (guided?.expected ?? []).join(" ");
    if (!expected.trim()) return { expected: "", kind: "short", dimension: "concept", itemId: "guided" };
    return { expected, kind: "short", dimension: "concept", itemId: "guided" };
  }
  const block = body[slot] as { answer?: string; dimension?: string } | undefined;
  if (!block || block.answer === undefined) return null;
  return {
    expected: String(block.answer),
    kind: "short",
    dimension: String(block.dimension ?? slot),
    itemId: slot,
  };
}

export function gradeLessonCheck(
  lessonId: string,
  slot: LessonCheckSlot,
  value: unknown,
  itemId?: string,
) {
  const lesson = loadLesson(lessonId);
  if (!lesson) return { ok: false as const, error: "not_found" };
  const found = expectedFor(lesson, slot, itemId);
  if (!found) return { ok: false as const, error: "unknown_item" };
  if (!found.expected.trim()) {
    return {
      ok: true as const,
      correct: false,
      itemId: found.itemId,
      dimension: found.dimension,
      topicId: lesson.topicId,
      unscored: true,
    };
  }
  const correct =
    found.kind === "mcq"
      ? Number(value) === Number(found.expected)
      : normalize(value) === normalize(found.expected);
  return {
    ok: true as const,
    correct,
    itemId: found.itemId,
    dimension: found.dimension,
    topicId: lesson.topicId,
    unscored: false,
  };
}

export function recordLessonCheck(
  studentId: string,
  lessonId: string,
  slot: LessonCheckSlot,
  value: unknown,
  itemId?: string,
) {
  const graded = gradeLessonCheck(lessonId, slot, value, itemId);
  if (!graded.ok) return graded;
  const kind =
    slot === "guided" ? "guided" : slot === "independent" ? "independent" : "knowledge_check";
  recordProgress({
    studentId,
    topicId: graded.topicId,
    lessonId,
    kind,
    dimension: graded.dimension,
    assisted: slot === "guided",
    correct: graded.unscored ? undefined : graded.correct,
  });
  return graded;
}
