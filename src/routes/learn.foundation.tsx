import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoBadge, PageHeader } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/art/motion";
import { Ring } from "@/components/art/Ring";
import { classificationLabel } from "@/lib/foundation";
import { services } from "@/services";

export const Route = createFileRoute("/learn/foundation")({
  loader: () => services.foundation.library(),
  head: () => ({
    meta: [
      { title: "Foundation — CForge" },
      { name: "description", content: "Supporting foundation labels from the original CForge catalog." },
    ],
  }),
  component: FoundationPage,
});

function FoundationPage() {
  const library = Route.useLoaderData();
  const labelled = library.topics.length;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Supporting library"
        title={<>Foundation, not a <em className="text-copper">sixth unit</em></>}
        lede={library.sourceNote || "These are supporting labels from the original catalog. They are not official syllabus units."}
        crumbs={[
          { label: "Learn", to: "/learn" },
          { label: "Foundation" },
        ]}
        actions={library.source === "demo" ? <DemoBadge>Demo — original catalog not loaded</DemoBadge> : undefined}
      />

      <section className="glass-panel cf-rise relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-copper/20 blur-3xl cf-drift" aria-hidden />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">{library.sourceLabel || "Not an official unit"}</p>
            <h2 className="mt-2 font-display text-3xl">{library.title || "Foundation"}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {labelled} readable labels. {library.missingEntryCount} further screenshot entries were not readable and are not invented.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="hero" className="rounded-full"><Link to="/learn/units">Browse official units</Link></Button>
              <Button asChild variant="quiet" className="rounded-full"><Link to="/learn">Back to dashboard</Link></Button>
            </div>
          </div>
          <Ring value={labelled} max={Math.max(1, labelled + library.missingEntryCount)} size={132} stroke={12} label={`${labelled} labelled of ${labelled + library.missingEntryCount} screenshot entries`}>
            <span>
              <span className="block font-display text-3xl">{labelled}</span>
              <span className="text-[10px] text-muted-foreground">labelled</span>
            </span>
          </Ring>
        </div>
      </section>

      {!library.available ? (
        <p className="glass-panel rounded-3xl p-6 text-sm text-muted-foreground" data-testid="foundation-unavailable">
          {library.sourceNote}
        </p>
      ) : library.topics.length === 0 ? (
        <p className="glass-panel rounded-3xl p-6 text-sm text-muted-foreground" data-testid="foundation-empty">
          The server returned no readable foundation labels.
        </p>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {library.topics.map((topic, i) => (
            <Reveal key={topic.id} delay={i * 40} as="li">
              <article id={topic.id} className="glass-panel h-full rounded-3xl p-5" data-testid={`foundation-topic-${topic.id}`}>
                <p className="font-mono text-[11px] text-muted-foreground">{topic.id}</p>
                <h3 className="mt-1 font-display text-2xl">{topic.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {classificationLabel(topic.classification)}
                  {topic.sourceLabels.length ? ` · ${topic.sourceLabels.join(" ")}` : ""}
                </p>
                {topic.needsHumanVerification && (
                  <p className="mt-2 text-xs text-muted-foreground">Needs human verification. No extra meaning is added here.</p>
                )}
                {topic.accuracyNotes.map((note) => (
                  <p key={note} className="mt-1 text-xs text-muted-foreground">{note}</p>
                ))}
                {topic.hasLessonBody ? (
                  <Link to="/learn/foundation/$topicId" params={{ topicId: topic.id }} className="mt-3 inline-block text-sm text-copper hover:underline">
                    Open prepared notes
                  </Link>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No lesson body is prepared for this label.</p>
                )}
              </article>
            </Reveal>
          ))}
        </ol>
      )}

      {library.missingEntryCount > 0 && (
        <p className="text-sm text-muted-foreground" data-testid="foundation-missing">
          {library.missingEntryCount} additional screenshot entries remain unidentified. Titles are not invented for them.
        </p>
      )}
    </div>
  );
}
