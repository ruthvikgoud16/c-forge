import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/bits";
import { TOOL_IDS, TOOL_META } from "@/data/tools";
import type { ToolId } from "@/domain/types";
import { SyntaxViz } from "@/components/visualizers/SyntaxViz";
import { BinaryViz } from "@/components/visualizers/BinaryViz";
import { AlgorithmViz } from "@/components/visualizers/AlgorithmViz";
import { FlowchartViz } from "@/components/visualizers/FlowchartViz";
import { ControlFlowViz } from "@/components/visualizers/ControlFlowViz";
import { ArrayStringViz } from "@/components/visualizers/ArrayStringViz";
import { RecursionViz } from "@/components/visualizers/RecursionViz";
import { SearchSortViz } from "@/components/visualizers/SearchSortViz";
import { topicHead } from "@/lib/topic-loader";

const VIZ: Record<ToolId, () => React.JSX.Element> = { syntax: SyntaxViz, binary: BinaryViz, algorithm: AlgorithmViz, flowchart: FlowchartViz, "control-flow": ControlFlowViz, "array-string": ArrayStringViz, recursion: RecursionViz, "search-sort": SearchSortViz };

export const Route = createFileRoute("/learn/tools/$tool")({
  loader: ({ params }) => {
    if (!TOOL_IDS.includes(params.tool as ToolId)) throw notFound();
    return { id: params.tool as ToolId };
  },
  head: ({ loaderData }) => topicHead(loaderData ? TOOL_META[loaderData.id].name : "Visualiser", loaderData ? TOOL_META[loaderData.id].blurb : "CForge visualiser"),
  component: ToolPage,
});

function ToolPage() {
  const { id } = Route.useLoaderData();
  const V = VIZ[id];
  return (
    <>
      <PageHeader crumbs={[{ label: "Visualisers", to: "/learn/tools" }, { label: TOOL_META[id].name }]} eyebrow="Visualiser" title={TOOL_META[id].name} lede={TOOL_META[id].blurb} />
      <div className="rounded-3xl border border-border bg-card p-4 md:p-6"><V key={id} /></div>
      <nav aria-label="Other visualisers" className="mt-8 flex flex-wrap gap-2">
        {TOOL_IDS.filter((t) => t !== id).map((t) => <Link key={t} to="/learn/tools/$tool" params={{ tool: t }} className="glass rounded-full px-3 py-1.5 text-sm hover:text-copper">{TOOL_META[t].name}</Link>)}
      </nav>
    </>
  );
}
