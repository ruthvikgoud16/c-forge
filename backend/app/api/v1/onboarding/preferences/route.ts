import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { requireStudent, stripClientStudentId } from "@/lib/learning/authz";
import { START_INTENTS, type StartIntent } from "@/lib/learning/types";
import { getPreference, setPreference } from "@/lib/learning/store";
import { persistPreference } from "@/lib/learning/persist";
import { LearningPersistError } from "@/lib/learning/storage-mode";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, { startIntent: getPreference(session.studentId) ?? null, notASkillLabel: true });
}

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.value as Record<string, unknown> | null;
  if (!raw) return json(400, { error: "invalid_body" });
  const body = stripClientStudentId(raw);
  const startIntent = body.startIntent;
  if (typeof startIntent !== "string" || !START_INTENTS.includes(startIntent as StartIntent)) {
    return json(400, { error: "invalid_intent" });
  }
  setPreference(session.studentId, startIntent as StartIntent);
  try {
    await persistPreference(session.studentId, startIntent);
  } catch (error) {
    const status = error instanceof LearningPersistError ? error.httpStatus : 503;
    return json(status, { error: "LEARNING_PERSIST_FAILED" });
  }
  return json(200, { startIntent, notASkillLabel: true });
}
