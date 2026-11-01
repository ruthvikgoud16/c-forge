import { json } from "@/lib/academy/http";
import { listPapers } from "@/lib/content/ingest";
import { readSession } from "@/lib/academy/session";

export async function GET() {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, { papers: listPapers(), fabricated: false });
}