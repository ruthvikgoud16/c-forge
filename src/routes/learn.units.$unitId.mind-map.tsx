import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/bits";
import { MindMapView } from "@/components/learning/MindMapView";
import { topicHead } from "@/lib/topic-loader";
import { services } from "@/services";

export const Route = createFileRoute("/learn/units/$unitId/mind-map")({
  loader: async ({ params }) => {
    const unit = await services.curriculum.unit(params.unitId);
    const map = await services.curriculum.unitMindMap(params.unitId);
    if (!unit || !map) throw notFound();
    return { unit, map };
  },
  head: ({ loaderData }) => topicHead(`Unit mind map: ${loaderData?.unit.title ?? "Unit"}`, "Interactive concept map of the whole unit."),
  component: Page,
});

function Page() {
  const { unit, map } = Route.useLoaderData();
  return (
    <>
      <PageHeader crumbs={[{ label: "Units", to: "/learn/units" }, { label: `Unit ${unit.number}`, to: "/learn/units/$unitId", params: { unitId: unit.id } }, { label: "Mind map" }]} eyebrow={`Unit ${unit.number} mind map`} title={unit.title} />
      <MindMapView key={map.id} map={map} />
    </>
  );
}
