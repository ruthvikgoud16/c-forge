import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DemoBadge, PageHeader } from "@/components/common/bits";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/art/motion";
import { MEMORY_NOTE, matchesQuery } from "@/lib/resources";
import { IS_DEMO, services } from "@/services";

export const Route = createFileRoute("/learn/papers")({
  loader: () => services.resources.papers(),
  head: () => ({ meta: [{ title: "Papers — CForge" }, { name: "description", content: "Faculty-recorded papers." }] }),
  component: PapersPage,
});

function PapersPage() {
  const collection = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const papers = useMemo(
    () => collection.papers.filter((paper) => matchesQuery(`${paper.academicYear} ${paper.semester} ${paper.examType} ${paper.sourceRef}`, query)),
    [collection.papers, query],
  );
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Papers"
        title={<>Faculty-recorded <em className="text-copper">papers</em></>}
        lede="Previous-year questions appear only after faculty ingest them. This is not a generated paper bank."
        crumbs={[{ label: "Learn", to: "/learn" }, { label: "Papers" }]}
        actions={collection.source === "demo" || IS_DEMO ? <DemoBadge>Demo session only</DemoBadge> : undefined}
      />
      <p className="text-sm text-muted-foreground">{collection.source === "demo" ? "Demo papers stay in this browser session. They are not stored on the CForge backend." : MEMORY_NOTE}</p>
      {collection.papers.length > 0 && (
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by year, exam type, or source" aria-label="Filter papers" />
      )}
      {collection.papers.length === 0 ? (
        <section className="glass-panel rounded-[1.75rem] p-8 text-center" data-testid="papers-empty">
          <p className="font-display text-2xl">No papers have been added yet</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Faculty can ingest recorded questions. CForge will not invent a previous-year set.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/learn" className="text-copper hover:underline">Dashboard</Link>
            <Link to="/learn/labs" className="text-copper hover:underline">Labs</Link>
            <Link to="/learn/revision" className="text-copper hover:underline">Revision</Link>
          </div>
        </section>
      ) : papers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recorded paper matches that filter.</p>
      ) : (
        <ol className="space-y-4">
          {papers.map((paper, i) => (
            <Reveal key={paper.id} delay={i * 40} as="li">
              <article className="glass-panel rounded-3xl p-5" data-testid={`paper-${paper.id}`}>
                <p className="eyebrow">{paper.academicYear}{paper.semester ? ` · ${paper.semester}` : ""}{paper.examType ? ` · ${paper.examType}` : ""}</p>
                <h2 className="mt-1 font-display text-2xl">{paper.sourceRef}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  {paper.verified ? "Faculty marked this record as verified." : "Not marked verified."} Question kind is taken from the server.
                </p>
                {paper.sourceHref && (
                  <a href={paper.sourceHref} className="mt-2 inline-block text-sm text-copper hover:underline" rel="noreferrer">Open source reference</a>
                )}
                <ol className="mt-4 space-y-2 text-sm">
                  {paper.questions.map((q) => (
                    <li key={q.id || q.text} className="rounded-2xl bg-white/40 px-3 py-2">
                      <p>{q.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {q.kind.replaceAll("_", " ")}
                        {q.marks != null ? ` · ${q.marks} marks` : ""}
                        {q.pageRef ? ` · ${q.pageRef}` : ""}
                      </p>
                      {q.topicId ? <Link to="/learn/topics/$topicId" params={{ topicId: q.topicId }} className="mt-1 inline-block text-xs text-copper hover:underline">{q.topicId}</Link> : null}
                    </li>
                  ))}
                </ol>
              </article>
            </Reveal>
          ))}
        </ol>
      )}
    </div>
  );
}
