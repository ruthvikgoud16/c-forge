import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoBadge, PageHeader } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { UnitArt } from "@/components/art/UnitArt";
import { Reveal } from "@/components/art/motion";
import { AdaptiveLink } from "@/components/learning/AdaptiveLink";
import { StudentJourney } from "@/components/learning/StudentJourney";
import { masteryLabel, nextActionLabel } from "@/lib/adaptive";
import { placementText } from "@/lib/diagnostic";
import { services } from "@/services";

export const Route = createFileRoute("/learn/path")({
  loader: () => services.adaptive.path(),
  head: () => ({ meta: [{ title: "Learning Path — CForge" }, { name: "description", content: "The CForge recommended learning sequence." }, { property: "og:title", content: "Learning Path — CForge" }, { property: "og:description", content: "Your sequential C learning path." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PathPage,
});

function PathPage() {
  const path = Route.useLoaderData();
  const next = path.recommendedNext;
  return (
    <div className="space-y-10">
      <StudentJourney />
      <PageHeader
        eyebrow="Learning path"
        title={<>The sequence CForge <em className="text-copper">recommends</em></>}
        lede="This is the official unit order with your placement and mastery from the server. Placement is not mastery. Guidance only — topics stay open to browse."
        actions={path.source === "demo" ? <DemoBadge>Simulated path</DemoBadge> : undefined}
      />

      {next && (
        <Reveal className="glass-dark relative overflow-hidden rounded-[1.75rem] p-6 md:p-8" data-testid="path-next">
          <p className="eyebrow !text-ember">Recommended next</p>
          <h2 className="mt-2 font-display text-3xl">{path.units.flatMap((unit) => unit.topics).find((topic) => topic.id === next.topicId)?.title ?? next.topicId}</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75">{next.reason}</p>
          <p className="mt-2 text-xs text-white/60">
            {placementText(next.placement).title} · {masteryLabel(next.mastery)} · {next.availability}
          </p>
          {next.dest && next.availability === "AVAILABLE" ? (
            <Button asChild variant="hero" className="mt-5 rounded-full">
              <AdaptiveLink dest={next.dest} testId="path-start-next">{nextActionLabel(next.resourceType)}</AdaptiveLink>
            </Button>
          ) : (
            <p className="mt-5 text-sm text-white/70">No matching screen is available for this recommendation yet.</p>
          )}
        </Reveal>
      )}

      {path.units.length === 0 ? (
        <p className="text-sm text-muted-foreground">The server returned no learning-path units.</p>
      ) : (
        path.units.map((unit, i) => (
          <Reveal key={unit.id} delay={i * 40} className="space-y-4">
            <div className="flex items-center gap-4">
              <UnitArt unitId={unit.id} label={false} className="h-16 w-24 shrink-0" />
              <h2 className="font-display text-2xl">{officialUnitLink(unit.id, unit.title)}</h2>
            </div>
            <ol className="relative ml-3 space-y-3 border-l-2 border-copper/25">
              {unit.topics.map((topic) => {
                const isNext = next?.topicId === topic.id;
                return (
                  <li key={topic.id} className="relative pl-6" data-testid={`path-topic-${topic.id}`}>
                    <span className={`absolute -left-[9px] top-5 size-4 rounded-full border-2 border-background ${dot(topic.placement, topic.mastery)}`} aria-hidden />
                    <div className={`glass-panel rounded-3xl p-4 ${isNext ? "ring-2 ring-copper" : ""}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] text-muted-foreground">{topic.sourceLabel || topic.id}</p>
                          <h3 className="font-display text-xl">{topic.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{placementText(topic.placement).lede}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Mastery: {masteryLabel(topic.mastery)}. Lesson {topic.lesson.toLowerCase()}.
                            {topic.prerequisites.length > 0 ? ` Unmet prerequisites: ${topic.prerequisites.map((p) => p.id).join(", ")}.` : ""}
                          </p>
                        </div>
                        <AdaptiveLink dest={topic.dest} className="text-sm text-copper hover:underline">
                          {topic.dest ? "Open topic" : "No destination"}
                        </AdaptiveLink>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        ))
      )}
    </div>
  );
}

function officialUnitLink(id: string, title: string) {
  if (id === "unit-1" || id === "unit-2" || id === "unit-3" || id === "unit-4" || id === "unit-5") {
    return <Link to="/learn/units/$unitId" params={{ unitId: id }} className="hover:text-copper">{title}</Link>;
  }
  return title;
}

function dot(placement: string, mastery: string | null) {
  if (mastery === "mastered") return "bg-success";
  if (placement === "DEMONSTRATED") return "bg-gold";
  if (placement === "NEEDS_REVISION" || placement === "NEEDS_FOUNDATION") return "bg-copper";
  if (mastery === "started" || mastery === "practised") return "bg-info";
  return "bg-stone";
}
