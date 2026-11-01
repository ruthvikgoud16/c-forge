import { json } from "@/lib/academy/http";
import { getTopic } from "@/lib/curriculum/catalog";
import { topicState } from "@/lib/curriculum/progress";
import { requireStudent } from "@/lib/learning/authz";
import { getPlacement } from "@/lib/learning/store";
import { hubCards } from "@/lib/learning/resources";
import { recommendNext } from "@/lib/learning/recommend";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  const found = getTopic(id);
  if (!found) return json(404, { error: "not_found" });
  const { unit, topic } = found;
  return json(200, {
    unit: { id: unit.id, title: unit.title, sourceLabel: unit.sourceLabel },
    topic: {
      id: topic.id,
      title: topic.title,
      sourceLabel: topic.sourceLabel ?? topic.sourceLabels,
      classification: topic.classification,
      accuracyNotes: topic.accuracyNotes ?? [],
    },
    placement: getPlacement(session.studentId, topic.id),
    mastery: topicState(session.studentId, topic.id),
    readiness: null,
    lessonsRemainAccessible: true,
    recommendedNext: recommendNext(session.studentId),
    resources: hubCards(topic.id),
  });
}
