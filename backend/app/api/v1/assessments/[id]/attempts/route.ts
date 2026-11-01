import { json } from "@/lib/academy/http";
import { requireStudent } from "@/lib/learning/authz";
import { listPracticeAttempts, publicAttempt } from "@/lib/content/assess-persist";
import { LearningPersistError } from "@/lib/learning/storage-mode";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  try {
    const rows = await listPracticeAttempts(session.studentId, id);
    return json(200, {
      assessmentId: id,
      attempts: rows.map(publicAttempt),
      answerKeysIncluded: false,
    });
  } catch (error) {
    const status = error instanceof LearningPersistError ? error.httpStatus : 503;
    return json(status, { error: "LEARNING_PERSIST_FAILED" });
  }
}
