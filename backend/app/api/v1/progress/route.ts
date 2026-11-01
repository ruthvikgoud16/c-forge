import { readSession } from "@/lib/academy/session";
import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { recordProgress, topicState } from "@/lib/curriculum/progress";
import { eventsForStudent } from "@/lib/learning/store";
import { hydrateStudent, persistEventDurable } from "@/lib/learning/persist";
import { getPlacement } from "@/lib/learning/store";
import { rejectDerivedClaims, stripClientStudentId } from "@/lib/learning/authz";
import { LearningPersistError } from "@/lib/learning/storage-mode";

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.value as Record<string, unknown> | null;
  if (!raw) return json(400, { error: "invalid_body" });
  const derived = rejectDerivedClaims(raw);
  if (derived.length) {
    return json(400, { error: "derived_state_not_writable", fields: derived });
  }
  const body = stripClientStudentId(raw);
  if (!body.topicId || !body.kind || !body.dimension) {
    return json(400, { error: "invalid_body" });
  }
  if (["assessment_completed", "knowledge_check"].includes(String(body.kind))) {
    return json(400, { error: "derived_state_not_writable", fields: ["kind"] });
  }
  if (
    ![
      "lesson_opened",
      "knowledge_check",
      "guided",
      "independent",
      "review",
      "notes_viewed",
      "oneshot_completed",
      "flashcards_reviewed",
      "simulator_used",
      "assessment_completed",
      "revision_completed",
    ].includes(String(body.kind))
  ) {
    return json(400, { error: "invalid_kind" });
  }
  try {
    await hydrateStudent(session.studentId);
  } catch (error) {
    const status = error instanceof LearningPersistError ? error.httpStatus : 503;
    return json(status, { error: "LEARNING_PERSIST_FAILED" });
  }
  recordProgress({
    studentId: session.studentId,
    topicId: String(body.topicId),
    lessonId: body.lessonId ? String(body.lessonId) : undefined,
    kind: String(body.kind),
    dimension: String(body.dimension),
    assisted: Boolean(body.assisted),
    correct: undefined,
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
  return json(200, {
    state: topicState(session.studentId, String(body.topicId)),
    placement: getPlacement(session.studentId, String(body.topicId)),
    placementIsNotMastery: true,
  });
}
