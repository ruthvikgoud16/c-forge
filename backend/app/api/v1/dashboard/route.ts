import { json } from "@/lib/academy/http";
import { requireStudent } from "@/lib/learning/authz";
import { hydrateStudent } from "@/lib/learning/persist";
import { dashboardPayload } from "@/lib/learning/recommend";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  await hydrateStudent(session.studentId);
  return json(200, dashboardPayload(session.studentId, session.rollIdentifier));
}
