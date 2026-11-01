import { readSession } from "@/lib/academy/session";
import { json } from "@/lib/academy/http";
import { loadCatalog, officialTopics, officialUnits, mindMapForUnit } from "@/lib/curriculum/catalog";
import { topicState, unitProgress } from "@/lib/curriculum/progress";

export async function GET() {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const catalog = loadCatalog();
  const units = officialUnits().map((unit) => ({
    id: unit.id,
    slug: unit.slug,
    title: unit.title,
    sourceLabel: unit.sourceLabel,
    classification: unit.classification,
    topicCount: unit.topics.length,
    progress: unitProgress(
      session.studentId,
      unit.topics.map((t) => t.id),
    ),
    mindMap: mindMapForUnit(unit),
  }));
  return json(200, {
    status: catalog.status,
    source: catalog.source,
    officialUnitCount: officialUnits().length,
    officialTopicCount: officialTopics().length,
    units,
    foundation: {
      id: catalog.foundation.id,
      title: catalog.foundation.title,
      notAnOfficialUnit: true,
      topicCount: catalog.foundation.topics.length,
      missingEntryCount: catalog.foundation.missingEntryCount,
      flagged: catalog.foundation.topics.filter((t) => t.classification === "LEGACY_UNVERIFIED" || t.needsHumanVerification),
    },
    topicStates: officialTopics().map((t) => ({
      id: t.id,
      state: topicState(session.studentId, t.id),
    })),
  });
}
