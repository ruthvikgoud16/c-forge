import { loginStudent } from "@/lib/academy/onboard";
import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { writeSession } from "@/lib/academy/session";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value as {
    rollIdentifier?: string;
    password?: string;
  } | null;
  const limited = await limitRequest(request, "login", { subject: body?.rollIdentifier });
  if (!limited.ok) return rateLimited(limited.retryAfterSec);
  if (!body?.rollIdentifier || !body.password) {
    return json(400, { error: "missing_fields" });
  }
  const student = await loginStudent(body.rollIdentifier, body.password);
  if (!student) {
    return json(401, { error: "unauthorized" });
  }
  await writeSession({ studentId: student.id, rollIdentifier: student.rollIdentifier });
  return json(200, { ok: true, rollIdentifier: student.rollIdentifier });
}
