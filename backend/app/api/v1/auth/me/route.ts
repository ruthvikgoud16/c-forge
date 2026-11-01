import { readSession } from "@/lib/academy/session";
import { json } from "@/lib/academy/http";

export async function GET() {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, { rollIdentifier: session.rollIdentifier });
}
