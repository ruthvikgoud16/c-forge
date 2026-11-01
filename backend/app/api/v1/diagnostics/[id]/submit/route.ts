import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { requireStudent, stripClientStudentId } from "@/lib/learning/authz";
import { submitDiagnostic } from "@/lib/learning/diagnostics";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await limitRequest(request, "diagnosticSubmit");
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
  const body = stripClientStudentId(raw);
  const answers = body.answers;
  if (!Array.isArray(answers)) return json(400, { error: "invalid_answers" });
  const result = await submitDiagnostic(session.studentId, id, answers as Array<{ itemId?: string; value?: unknown }>);
  if (!result.ok) {
    return json(result.status, { error: result.error, itemId: "itemId" in result ? result.itemId : undefined });
  }
  return json(200, result);
}
