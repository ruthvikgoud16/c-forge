import { json } from "@/lib/academy/http";
import { listLabs } from "@/lib/content/ingest";
import { readSession } from "@/lib/academy/session";

export async function GET() {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, { labs: listLabs(), fabricated: false });
}
