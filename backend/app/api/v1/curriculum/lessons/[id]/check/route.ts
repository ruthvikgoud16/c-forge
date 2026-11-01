import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { requireStudent, rejectDerivedClaims, stripClientStudentId } from "@/lib/learning/authz";
import { recordLessonCheck, type LessonCheckSlot } from "@/lib/curriculum/lesson-check";
import { eventsForStudent } from "@/lib/learning/store";
import { persistEventDurable } from "@/lib/learning/persist";
import { LearningPersistError } from "@/lib/learning/storage-mode";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

const SLOTS: LessonCheckSlot[] = ["trace", "predict", "guided", "independent", "check"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await limitRequest(request, "lessonCheck");
  if (!limited.ok) return rateLimited(limited.retryAfterSec);
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.value as Record<string, unknown> | null;
  if (!raw) return json(400, { error: "invalid_body" });
  if (rejectDerivedClaims(raw).length) return json(400, { error: "derived_state_not_writable" });
  const body = stripClientStudentId(raw);
  const slot = String(body.slot ?? "") as LessonCheckSlot;
  if (!SLOTS.includes(slot)) return json(400, { error: "invalid_slot" });
  const graded = recordLessonCheck(session.studentId, id, slot, body.value, body.itemId ? String(body.itemId) : undefined);
  if (!graded.ok) return json(graded.error === "not_found" ? 404 : 400, { error: graded.error });
  const last = eventsForStudent(session.studentId).at(-1);
  if (last) {
    try {
      await persistEventDurable(last);
    } catch (error) {
      const status = error instanceof LearningPersistError ? error.httpStatus : 503;
      return json(status, { error: "LEARNING_PERSIST_FAILED" });
    }
  }
  return json(200, {
    correct: graded.correct,
    itemId: graded.itemId,
    unscored: graded.unscored,
    answerKeysIncluded: false,
  });
}
