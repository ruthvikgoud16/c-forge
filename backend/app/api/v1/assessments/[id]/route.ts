import { json } from "@/lib/academy/http";
import { requireStudent } from "@/lib/learning/authz";
import { packageForTopic, publicItem, unitAssessmentItems } from "@/lib/content/registry";
import { assertNoStudentAnswerKey } from "@/lib/curriculum/public-lesson";
import { listPracticeAttempts, publicAttempt } from "@/lib/content/assess-persist";
import { LearningPersistError, learningStorageMode } from "@/lib/learning/storage-mode";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  let attempts: ReturnType<typeof publicAttempt>[] = [];
  try {
    attempts = (await listPracticeAttempts(session.studentId, id)).map(publicAttempt);
  } catch (error) {
    if (learningStorageMode() === "postgres") {
      const status = error instanceof LearningPersistError ? error.httpStatus : 503;
      return json(status, { error: "LEARNING_PERSIST_FAILED" });
    }
  }
  if (id.startsWith("topic:")) {
    const topicId = id.slice(6);
    const pkg = packageForTopic(topicId);
    if (!pkg) return json(404, { error: "not_found" });
    const payload = {
      id,
      title: `${pkg.lesson.title} — topic assessment`,
      officialExam: false,
      items: pkg.assessment.map(publicItem),
      attempts,
      answerKeysIncluded: false,
    };
    assertNoStudentAnswerKey(payload);
    return json(200, payload);
  }
  if (id.startsWith("unit:")) {
    const unitId = id.slice(5);
    const items = unitAssessmentItems(unitId);
    if (!items.length) return json(404, { error: "not_found" });
    const payload = {
      id,
      title: `${unitId} unit assessment`,
      officialExam: false,
      items: items.map(publicItem),
      attempts,
      answerKeysIncluded: false,
    };
    assertNoStudentAnswerKey(payload);
    return json(200, payload);
  }
  return json(404, { error: "not_found" });
}
