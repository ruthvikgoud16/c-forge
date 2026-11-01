import { json } from "@/lib/academy/http";
import { learnGraph } from "@/lib/integration/emergent-bridge";
import { hydrateStudent } from "@/lib/learning/persist";
import { requireStudent } from "@/lib/learning/authz";
import { seedRoster } from "@/lib/roster/store";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  seedRoster();
  await hydrateStudent(session.studentId);
  const graph = learnGraph(session.studentId, session.rollIdentifier);
  const encoded = JSON.stringify(graph);
  if (/"answer"\s*:/.test(encoded) || encoded.includes("expectedStdout")) {
    return json(500, { error: "bridge_leak" });
  }
  return json(200, graph);
}
