import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";
import { parseAppearance, parseDateOfBirth, writeStudentProfile } from "@/lib/academy/profile";
import { requireStudent } from "@/lib/learning/authz";

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.value ?? {}) as Record<string, unknown>;
  if ("rollIdentifier" in body || "rollNumber" in body || "displayName" in body || "name" in body) {
    return json(400, { error: "roster_fields_are_read_only" });
  }
  const dob = "dateOfBirth" in body ? parseDateOfBirth(body.dateOfBirth) : { ok: true as const, value: undefined };
  const appearance = "appearance" in body ? parseAppearance(body.appearance) : { ok: true as const, value: undefined };
  if (!dob.ok) return json(400, { error: dob.error });
  if (!appearance.ok) return json(400, { error: appearance.error });
  const patch: { dateOfBirth?: string | null; appearance?: "light" | "dark" | null } = {};
  if (dob.value !== undefined) patch.dateOfBirth = dob.value;
  if (appearance.ok && (appearance.value === null || appearance.value === "light" || appearance.value === "dark")) {
    patch.appearance = appearance.value;
  }
  const saved = await writeStudentProfile(session.studentId, patch);
  return json(200, {
    dateOfBirth: saved.dateOfBirth,
    appearance: saved.appearance,
    rollUnchanged: true,
    rosterNameUnchanged: true,
  });
}
