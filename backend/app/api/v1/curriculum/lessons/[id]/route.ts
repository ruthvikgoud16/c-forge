import { readSession } from "@/lib/academy/session";
import { json } from "@/lib/academy/http";
import { loadLesson } from "@/lib/curriculum/catalog";
import { assertNoStudentAnswerKey, toPublicLesson } from "@/lib/curriculum/public-lesson";
import { recordProgress, topicState } from "@/lib/curriculum/progress";
import { eventsForStudent } from "@/lib/learning/store";
import { hydrateStudent, persistEventDurable } from "@/lib/learning/persist";
import { LearningPersistError } from "@/lib/learning/storage-mode";
import { getPlacement } from "@/lib/learning/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  const lesson = loadLesson(id);
  if (!lesson) return json(404, { error: "not_found" });
  try {
    await hydrateStudent(session.studentId);
  } catch (error) {
    const status = error instanceof LearningPersistError ? error.httpStatus : 503;
    return json(status, { error: "LEARNING_PERSIST_FAILED" });
  }
  recordProgress({
    studentId: session.studentId,
    topicId: lesson.topicId,
    lessonId: lesson.id,
    kind: "lesson_opened",
    dimension: "concept",
    assisted: false,
  });
  const last = eventsForStudent(session.studentId).at(-1);
  if (last) {
    try {
      await persistEventDurable(last);
    } catch (error) {
      const status = error instanceof LearningPersistError ? error.httpStatus : 503;
      return json(status, { error: "LEARNING_PERSIST_FAILED" });
    }
  }
  const publicLesson = toPublicLesson(lesson);
  const payload = {
    lesson: publicLesson,
    topicState: topicState(session.studentId, lesson.topicId),
    placement: getPlacement(session.studentId, lesson.topicId),
    openedIsNotMastery: true,
    lessonsRemainAccessible: true,
  };
  assertNoStudentAnswerKey(payload);
  return json(200, payload);
}
