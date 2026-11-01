import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoBadge, PageHeader, Panel } from "@/components/common/bits";
import { Meter } from "@/components/art/Ring";
import { Reveal } from "@/components/art/motion";
import { AdaptiveLink } from "@/components/learning/AdaptiveLink";
import { StudentJourney } from "@/components/learning/StudentJourney";
import { masteryLabel } from "@/lib/adaptive";
import { placementText } from "@/lib/diagnostic";
import { IS_DEMO, services } from "@/services";

export const Route = createFileRoute("/learn/progress")({
  loader: async () => {
    const [dashboard, path] = await Promise.all([services.adaptive.dashboard(), services.adaptive.path()]);
    return { dashboard, path };
  },
  head: () => ({ meta: [{ title: "Progress — CForge" }, { name: "description", content: "Recorded activity and demonstrated placement." }, { property: "og:title", content: "Progress — CForge" }, { property: "og:description", content: "Recorded activity and demonstrated placement." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { dashboard, path } = Route.useLoaderData();
  const analytics = dashboard.analytics;
  return (
    <>
      <StudentJourney />
      <PageHeader
        eyebrow="Progress"
        title="Where you stand"
        lede="Opened lessons, practice, placement, and mastery are separate. A missing event is not zero knowledge. Diagnostic placement is not completed learning."
        actions={dashboard.source === "demo" || IS_DEMO ? <DemoBadge>Demo progress — not saved</DemoBadge> : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {path.units.length === 0 && <p className="text-sm text-muted-foreground">No path units were returned.</p>}
          {path.units.map((unit) => {
            const counts = analytics.unitProgress.find((row) => row.id === unit.id);
            return (
              <Reveal key={unit.id}>
                <Panel className="glass-panel rounded-[1.75rem]">
                  <h2 className="font-display text-xl">{unit.id === "unit-1" || unit.id === "unit-2" || unit.id === "unit-3" || unit.id === "unit-4" || unit.id === "unit-5" ? <Link to="/learn/units/$unitId" params={{ unitId: unit.id }} className="hover:text-copper">{unit.title}</Link> : unit.title}</h2>
                  {counts ? (
                    <>
                      <Meter value={counts.opened} max={Math.max(1, counts.teachingTopics)} color="var(--color-copper)" className="mt-3" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {counts.opened} opened · {counts.practised} practised · {counts.demonstrated} placed · {counts.mastered} mastered
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No recorded counts for this unit.</p>
                  )}
                  <ul className="mt-3 divide-y divide-border text-sm">
                    {unit.topics.map((topic) => (
                      <li key={topic.id} className="flex flex-wrap items-center justify-between gap-2 py-2" data-testid={`progress-topic-${topic.id}`}>
                        <AdaptiveLink dest={topic.dest} className="hover:text-copper">{topic.title}</AdaptiveLink>
                        <span className="text-right text-xs text-muted-foreground">
                          <span className="block">{placementText(topic.placement).title}</span>
                          <span>{masteryLabel(topic.mastery)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </Reveal>
            );
          })}
        </div>
        <aside className="space-y-4">
          <Panel className="glass-panel sticky top-32 rounded-[1.75rem]">
            <h2 className="font-display text-xl">Recent recorded activity</h2>
            {analytics.recentlyOpened.length ? (
              <ul className="mt-3 divide-y divide-border text-sm">
                {analytics.recentlyOpened.slice(0, 6).map((row) => (
                  <li key={`${row.topicId}-${row.at}`} className="py-2">
                    <AdaptiveLink dest={row.dest} className="hover:text-copper">{row.title}</AdaptiveLink>
                    <p className="text-xs text-muted-foreground">{row.kind} · {row.at}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No recorded opens yet.</p>
            )}
            <Link to="/learn/revision" className="mt-4 inline-block text-sm text-copper hover:underline">Open revision</Link>
          </Panel>
          <Panel className="glass-panel rounded-[1.75rem]">
            <h2 className="font-display text-xl">Assessment history</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.source === "demo" ? "Fictional preview attempts." : "Recorded assessment attempts for this account."}
            </p>
            {analytics.assessmentHistory.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {dashboard.source === "demo" ? "No preview attempts in this session." : "No assessment attempts recorded yet."}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border text-sm">
                {analytics.assessmentHistory.map((row) => (
                  <li key={`${row.assessmentId}-${row.attempt}`} className="flex justify-between gap-2 py-2">
                    <AdaptiveLink dest={row.dest} className="hover:text-copper">
                      {row.label}
                      <span className="block text-xs text-muted-foreground">{row.completedAt}</span>
                    </AdaptiveLink>
                    <span className="font-mono">{row.earned}/{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel className="glass-panel rounded-[1.75rem]">
            <h2 className="font-display text-xl">What this does not show</h2>
            {analytics.unsupported.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {analytics.unsupported.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No extra fabricated metrics are shown.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
