import { readSession } from "@/lib/academy/session";
import { json } from "@/lib/academy/http";
import { getUnit, mindMapForUnit } from "@/lib/curriculum/catalog";
import { topicState } from "@/lib/curriculum/progress";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const { slug } = await context.params;
  const unit = getUnit(slug);
  if (!unit) return json(404, { error: "not_found" });
  return json(200, {
    ...unit,
    mindMap: mindMapForUnit(unit),
    topics: unit.topics.map((t) => ({
      ...t,
      state: topicState(session.studentId, t.id),
    })),
  });
}
