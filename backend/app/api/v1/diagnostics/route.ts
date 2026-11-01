import { json } from "@/lib/academy/http";
import { requireStudent } from "@/lib/learning/authz";
import { listDiagnostics, startDiagnostic } from "@/lib/learning/diagnostics";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, { sessions: listDiagnostics(session.studentId) });
}

export async function POST() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const started = await startDiagnostic(session.studentId);
  if (!started.ok) return json(started.status, { error: started.error });
  return json(201, started.session);
}
