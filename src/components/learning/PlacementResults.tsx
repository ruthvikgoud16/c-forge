import { Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/art/motion";
import { Ring } from "@/components/art/Ring";
import { destFromAcademyHref } from "@/lib/adaptive";
import { AdaptiveLink } from "@/components/learning/AdaptiveLink";
import { PLACEMENT_COPY } from "@/lib/diagnostic";
import type { DiagnosticSubmitResult, PlacementSnapshot, PlacementState } from "@/domain/types";

function label(state: PlacementState | null) {
  if (!state) return PLACEMENT_COPY.NOT_ASSESSED;
  return PLACEMENT_COPY[state];
}

export function PlacementResults({
  snapshot,
  submit,
}: {
  snapshot: PlacementSnapshot;
  submit?: DiagnosticSubmitResult;
}) {
  const assessed = snapshot.topics.filter((topic) => topic.placement && topic.placement !== "NOT_ASSESSED");
  const demonstrated = assessed.filter((topic) => topic.placement === "DEMONSTRATED").length;
  const gradedCorrect = submit?.graded.filter((row) => row.correct).length;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Placement"
        title={<>A starting map, not a <em className="text-copper">grade</em></>}
        lede="Placement is separate from mastery and from finishing a topic. The server scored your answers. This page does not include answer keys."
      />
      <p className="text-sm text-muted-foreground" data-testid="placement-not-mastery">
        {snapshot.placementIsNotMastery ? "Placement is not mastery." : null} Rubric {snapshot.rubricVersion}.
      </p>
      <section className="grid gap-4 md:grid-cols-[auto_1fr]">
        {assessed.length > 0 && (
          <div className="glass-panel grid place-items-center rounded-[2rem] p-6">
            <Ring value={demonstrated} max={assessed.length} size={140} stroke={12} label={`${demonstrated} of ${assessed.length} assessed topics demonstrated`}>
              <span>
                <span className="block font-display text-3xl">{demonstrated}</span>
                <span className="text-[10px] text-muted-foreground">demonstrated</span>
              </span>
            </Ring>
          </div>
        )}
        <Panel>
          <p className="eyebrow">What the server recorded</p>
          {submit ? (
            <p className="mt-2 text-sm text-muted-foreground" data-testid="placement-graded">
              {gradedCorrect} of {submit.graded.length} diagnostic items marked correct. {submit.placements.length} topics received a placement update.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">These states come from GET /api/v1/placement. Empty topics have not been assessed.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero"><Link to="/learn">Go to dashboard</Link></Button>
            <Button asChild variant="quiet"><Link to="/learn/units">Browse official units</Link></Button>
            <Button asChild variant="quiet"><Link to="/learn/path">Open learning path</Link></Button>
            <Button asChild variant="quiet"><Link to="/learn/foundation">Foundation labels</Link></Button>
          </div>
        </Panel>
      </section>
      <div className="space-y-3">
        {snapshot.topics.filter((topic) => topic.placement && topic.placement !== "NOT_ASSESSED").map((topic) => {
          const copy = label(topic.placement);
          return (
            <Reveal key={topic.id}>
              <article className="glass-panel rounded-3xl p-5" data-testid={`placement-${topic.id}`}>
                <p className="font-mono text-xs text-muted-foreground">{topic.id}</p>
                <h2 className="mt-1 font-display text-xl">{topic.sourceLabel || topic.id}</h2>
                <p className="mt-2 font-medium text-copper">{copy.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{copy.lede}</p>
                {topic.mastery ? <p className="mt-2 text-xs text-muted-foreground">Mastery state (separate): {topic.mastery}</p> : null}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <AdaptiveLink dest={destFromAcademyHref(`/learn/topics/${topic.id}`, topic.id)} className="text-copper hover:underline">Open topic</AdaptiveLink>
                  {topic.placement === "NEEDS_FOUNDATION" ? <Link to="/learn/foundation" className="text-copper hover:underline">Foundation library</Link> : null}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
