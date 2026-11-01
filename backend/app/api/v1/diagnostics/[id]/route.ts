import { json } from "@/lib/academy/http";
import { requireStudent } from "@/lib/learning/authz";
import { getDiagnosticPublic } from "@/lib/learning/diagnostics";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  const found = getDiagnosticPublic(session.studentId, id);
  if (!found.ok) return json(found.status, { error: found.error });
  return json(200, found.session);
}
