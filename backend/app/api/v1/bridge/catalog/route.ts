import { json } from "@/lib/academy/http";
import { publicCatalog } from "@/lib/integration/emergent-bridge";

export async function GET() {
  return json(200, publicCatalog());
}
