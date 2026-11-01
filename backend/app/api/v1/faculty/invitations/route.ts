import { mintInvitation, revokeInvitation } from "@/lib/academy/onboard";
import { json, readJsonBody } from "@/lib/academy/http";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { facultyFail } from "@/lib/faculty/http";
import { listFacultyInvitations } from "@/lib/faculty/invitations";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  try {
    return json(200, await listFacultyInvitations());
  } catch (error) {
    return facultyFail(error);
  }
}

export async function POST(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  const limited = await limitRequest(request, "inviteMint", { faculty: true });
  if (!limited.ok) return rateLimited(limited.retryAfterSec);
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.value ?? {}) as {
    ttlHours?: number;
    rollNumber?: string;
    revoke?: boolean;
  };
  if (!body.rollNumber) return json(400, { error: "missing_roll" });
  if (body.revoke) {
    const revoked = await revokeInvitation(body.rollNumber);
    if (!revoked.ok) return json(revoked.status, { error: revoked.error });
    return json(200, { rollNumber: revoked.rollNumber, revoked: true });
  }
  const minted = await mintInvitation(body.rollNumber, body.ttlHours ?? 168);
  if (!minted.ok) return json(minted.status, { error: minted.error });
  return json(201, {
    token: minted.token,
    expiresAt: minted.expiresAt,
    rollNumber: minted.rollNumber,
  });
}
