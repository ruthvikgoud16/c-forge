import { clearSession } from "@/lib/academy/session";
import { json, rejectCrossOrigin } from "@/lib/academy/http";

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  await clearSession();
  return json(200, { ok: true });
}
