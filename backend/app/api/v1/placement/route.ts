import { json } from "@/lib/academy/http";
import { officialTopics } from "@/lib/curriculum/catalog";
import { topicState } from "@/lib/curriculum/progress";
import { requireStudent } from "@/lib/learning/authz";
import { getPlacement } from "@/lib/learning/store";
import { PLACEMENT_RULES_VERSION } from "@/lib/learning/types";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  return json(200, {
    rubricVersion: PLACEMENT_RULES_VERSION,
    placementIsNotMastery: true,
    topics: officialTopics().map((t) => ({
      id: t.id,
      sourceLabel: t.sourceLabel,
      placement: getPlacement(session.studentId, t.id),
      mastery: topicState(session.studentId, t.id),
      readiness: null,
    })),
  });
}
