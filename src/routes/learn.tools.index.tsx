import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/bits";
import { services } from "@/services";
import { ToolPreview, TOOL_TINT } from "@/components/art/ToolPreview";

export const Route = createFileRoute("/learn/tools/")({
  loader: () => services.visualizers.list(),
  head: () => ({ meta: [{ title: "Visualisers — CForge" }, { name: "description", content: "Eight interactive C programming visualisers." }, { property: "og:title", content: "Visualisers — CForge" }, { property: "og:description", content: "See C concepts move." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => {
    const tools = Route.useLoaderData();
    return (
      <>
        <PageHeader eyebrow="Visualisers" title="See it move" lede="Eight interactive tools with real state, step controls and reset." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t, i) => (
            <Link key={t.id} to="/learn/tools/$tool" params={{ tool: t.id }} className="lift press glass-panel group flex flex-col rounded-3xl p-4" data-testid={`tool-card-${t.id}`}>
              <ToolPreview id={t.id} ms={950 + i * 110} className="min-h-32" />
              <div className="mt-4 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl font-mono text-pearl transition-transform group-hover:rotate-6" style={{ background: TOOL_TINT[t.id] }}>{t.glyph}</span>
                <div><h2 className="font-display text-lg">{t.name}</h2><p className="mt-0.5 text-sm text-muted-foreground">{t.blurb}</p></div>
              </div>
            </Link>
          ))}
        </div>
      </>
    );
  },
});
