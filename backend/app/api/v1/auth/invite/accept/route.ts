import { acceptInvite } from "@/lib/academy/onboard";
import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { writeSession } from "@/lib/academy/session";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value as {
    token?: string;
    rollIdentifier?: string;
    password?: string;
  } | null;
  const limited = await limitRequest(request, "inviteAccept", { subject: body?.rollIdentifier });
  if (!limited.ok) return rateLimited(limited.retryAfterSec);
  if (!body?.token || !body.rollIdentifier || !body.password) {
    return json(400, { error: "missing_fields" });
  }
  const result = await acceptInvite({
    token: body.token,
    rollIdentifier: body.rollIdentifier,
    password: body.password,
  });
  if (!result.ok) {
    const error = result.error === "roll_mismatch" ? "invalid_invitation" : result.error;
    return json(result.status, { error });
  }
  await writeSession({
    studentId: result.student.id,
    rollIdentifier: result.student.rollIdentifier,
  });
  return json(201, { ok: true, rollIdentifier: result.student.rollIdentifier });
}
