import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { requireStudent, rejectDerivedClaims, stripClientStudentId } from "@/lib/learning/authz";
import { packageForTopic, publicReview, scoreResponses, unitAssessmentItems } from "@/lib/content/registry";
import { assertNoStudentAnswerKey } from "@/lib/curriculum/public-lesson";
import { persistPracticeAttempt, publicAttempt } from "@/lib/content/assess-persist";
import { recordProgress } from "@/lib/curriculum/progress";
import { persistEventDurable } from "@/lib/learning/persist";
import { eventsForStudent } from "@/lib/learning/store";
import { LearningPersistError } from "@/lib/learning/storage-mode";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

const FORBIDDEN_SCORE_FIELDS = ["earned", "total", "score", "attempt", "attempt_no", "itemResults"];

function rejectedClientScoreFields(raw: Record<string, unknown>) {
  return FORBIDDEN_SCORE_FIELDS.filter((field) => Object.hasOwn(raw, field));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await limitRequest(request, "assessmentSubmit");
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
  const scoreFields = rejectedClientScoreFields(raw);
  if (scoreFields.length) {
    return json(400, { error: "derived_state_not_writable", fields: scoreFields });
  }
  const body = stripClientStudentId(raw);
  const responses = (body.responses ?? {}) as Record<string, string>;
  const items = id.startsWith("topic:")
    ? packageForTopic(id.slice(6))?.assessment
    : id.startsWith("unit:")
      ? unitAssessmentItems(id.slice(5))
      : null;
  if (!items?.length) return json(404, { error: "not_found" });
  const scored = scoreResponses(items, responses);
  const topicId = id.startsWith("topic:") ? id.slice(6) : items[0].topicId;
  const passed = scored.earned * 2 >= scored.total;
  const startedAt = new Date().toISOString();
  const itemResults = scored.review.map(({ id: itemId, topicId: tid, family, correct, marks, max }) => ({
    id: itemId,
    topicId: tid,
    family,
    correct,
    marks,
    max,
  }));
  let attempt;
  try {
    attempt = await persistPracticeAttempt({
      studentId: session.studentId,
      assessmentId: id,
      earned: scored.earned,
      total: scored.total,
      byTopic: scored.byTopic,
      responses,
      itemResults,
      startedAt,
      completedAt: new Date().toISOString(),
      idempotencyKey: request.headers.get("idempotency-key")?.trim() || undefined,
    });
  } catch (error) {
    const status = error instanceof LearningPersistError ? error.httpStatus : 503;
    return json(status, { error: "LEARNING_PERSIST_FAILED" });
  }
  recordProgress({
    studentId: session.studentId,
    topicId,
    kind: "assessment_completed",
    dimension: "assessment",
    assisted: false,
    correct: passed,
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
  const payload = {
    attempt: attempt.attempt,
    earned: scored.earned,
    total: scored.total,
    review: publicReview(scored.review),
    byTopic: scored.byTopic,
    officialExam: false,
    clientScoreIgnored: true,
    stored: publicAttempt(attempt),
    answerKeysIncluded: false,
  };
  assertNoStudentAnswerKey(payload);
  return json(200, payload);
}
