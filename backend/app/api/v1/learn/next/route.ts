import { json } from "@/lib/academy/http";
import { requireStudent } from "@/lib/learning/authz";
import { recommendNext } from "@/lib/learning/recommend";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, recommendNext(session.studentId));
}
