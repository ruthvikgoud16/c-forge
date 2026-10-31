import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge } from "@/components/common/bits";
import { Input } from "@/components/ui/input";
import { services } from "@/services";

export const Route = createFileRoute("/learn/assessments/")({
  loader: async () => ({ list: await services.assessments.list(), units: await services.curriculum.units() }),
  head: () => ({ meta: [{ title: "Assessments — CForge" }, { name: "description", content: "Topic and unit assessments." }, { property: "og:title", content: "Assessments — CForge" }, { property: "og:description", content: "31 topic assessments and 5 unit assessments." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AssessList,
});

function AssessList() {
  const { list } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const unitA = list.filter((a) => a.kind === "unit");
  const topicA = list.filter((a) => a.kind === "topic" && a.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="Assessments" title="Check your understanding" lede={`${unitA.length} unit assessments and ${list.length - unitA.length} topic assessments.`} actions={<DemoBadge>Preview scoring only</DemoBadge>} />
      <h2 className="mb-3 font-display text-2xl">Unit assessments</h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {unitA.map((a) => (
          <Link key={a.id} to="/learn/assessments/$assessmentId" params={{ assessmentId: a.id }} className="surface-ink rounded-lg p-4 hover:ring-2 hover:ring-ember">
            <span className="font-mono text-xs text-ember">{a.questionCount} questions</span>
            <span className="mt-1 block font-display text-lg leading-snug">{a.title}</span>
          </Link>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl">Topic assessments</h2>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics…" aria-label="Search topic assessments" className="max-w-xs bg-card" />
      </div>
      {topicA.length ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {topicA.map((a) => (
            <li key={a.id}><Link to="/learn/assessments/$assessmentId" params={{ assessmentId: a.id }} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-copper"><span>{a.title}</span><span className="font-mono text-xs text-muted-foreground">{a.questionCount} Q</span></Link></li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">No topics match “{q}”.</p>}
    </>
  );
}
