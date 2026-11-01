import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DemoBadge, PageHeader } from "@/components/common/bits";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/art/motion";
import { MEMORY_NOTE, matchesQuery } from "@/lib/resources";
import { IS_DEMO, services } from "@/services";

export const Route = createFileRoute("/learn/labs")({
  loader: () => services.resources.labs(),
  head: () => ({ meta: [{ title: "Labs — CForge" }, { name: "description", content: "Faculty-recorded lab resources." }] }),
  component: LabsPage,
});

function LabsPage() {
  const collection = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const labs = useMemo(
    () => collection.labs.filter((lab) => matchesQuery(`${lab.title} ${lab.unitId} ${lab.sourceRef} ${lab.objective ?? ""}`, query)),
    [collection.labs, query],
  );
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Labs"
        title={<>Faculty-recorded <em className="text-copper">labs</em></>}
        lede="Nothing is listed until faculty ingest a lab. CForge does not invent experiments or lab sheets."
        crumbs={[{ label: "Learn", to: "/learn" }, { label: "Labs" }]}
        actions={collection.source === "demo" || IS_DEMO ? <DemoBadge>Demo session only</DemoBadge> : undefined}
      />
      <p className="text-sm text-muted-foreground">{collection.source === "demo" ? "Demo labs stay in this browser session. They are not stored on the CForge backend." : MEMORY_NOTE}</p>
      {collection.labs.length > 0 && (
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by title, unit id, or source" aria-label="Filter labs" />
      )}
      {collection.labs.length === 0 ? (
        <section className="glass-panel rounded-[1.75rem] p-8 text-center" data-testid="labs-empty">
          <p className="font-display text-2xl">No labs have been added yet</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Faculty can ingest a lab through the faculty portal. This page will not invent a laboratory list.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/learn" className="text-copper hover:underline">Dashboard</Link>
            <Link to="/learn/units" className="text-copper hover:underline">Units</Link>
            <Link to="/learn/papers" className="text-copper hover:underline">Papers</Link>
          </div>
        </section>
      ) : labs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recorded lab matches that filter.</p>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {labs.map((lab, i) => (
            <Reveal key={lab.id} delay={i * 40} as="li">
              <article className="glass-panel h-full rounded-3xl p-5" data-testid={`lab-${lab.id}`}>
                <p className="font-mono text-[11px] text-muted-foreground">{lab.unitId || "No unit id"}</p>
                <h2 className="mt-1 font-display text-2xl">{lab.title}</h2>
                {lab.objective && <p className="mt-2 text-sm text-muted-foreground">{lab.objective}</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  {lab.verified ? "Faculty marked this as verified." : "Not marked verified."} Not an invented official list.
                </p>
                {lab.sourceHref ? (
                  <a href={lab.sourceHref} className="mt-3 inline-block text-sm text-copper hover:underline" rel="noreferrer">Open source reference</a>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Source: {lab.sourceRef || "None recorded"}</p>
                )}
                {["unit-1", "unit-2", "unit-3", "unit-4", "unit-5"].includes(lab.unitId) ? (
                  <Link to="/learn/units/$unitId" params={{ unitId: lab.unitId as "unit-1" }} className="mt-3 block text-sm text-copper hover:underline">Open related unit</Link>
                ) : null}
              </article>
            </Reveal>
          ))}
        </ol>
      )}
    </div>
  );
}
