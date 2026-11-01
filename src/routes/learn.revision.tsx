import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyState, DemoBadge } from "@/components/common/bits";
import { StudentJourney } from "@/components/learning/StudentJourney";
import { AdaptiveLink } from "@/components/learning/AdaptiveLink";
import { IS_DEMO, services } from "@/services";
import { topicAssessmentId } from "@/lib/assessment";

export const Route = createFileRoute("/learn/revision")({
  loader: async () => ({
    dashboard: await services.adaptive.dashboard(),
    teachingIds: new Set(await services.curriculum.teachingTopicIds()),
  }),
  head: () => ({ meta: [{ title: "Revision — CForge" }, { name: "description", content: "Revise the topics that need more practice." }, { property: "og:title", content: "Revision — CForge" }, { property: "og:description", content: "Targeted revision with one-shot sheets and flashcards." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Revision,
});

function Revision() {
  const { dashboard, teachingIds } = Route.useLoaderData();
  const needs = dashboard.analytics.needPractice.length ? dashboard.analytics.needPractice : dashboard.weakConcepts;
  const demonstrated = dashboard.analytics.demonstrated;
  const Row = ({ topicId, title, evidence }: { topicId: string; title: string; evidence?: string }) => (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/learn/topics/$topicId" params={{ topicId }} className="font-medium hover:text-copper">{title}</Link>
        {teachingIds.has(topicId) ? (
          <span className="flex flex-wrap gap-3 text-sm">
            <Link to="/learn/topics/$topicId/resources" params={{ topicId }} className="text-copper hover:underline">One-shot</Link>
            <Link to="/learn/topics/$topicId/flashcards" params={{ topicId }} className="text-copper hover:underline">Flashcards</Link>
            <Link to="/learn/topics/$topicId/mind-map" params={{ topicId }} className="text-copper hover:underline">Mind map</Link>
            <Link to="/learn/assessments/$assessmentId" params={{ assessmentId: topicAssessmentId(topicId) }} className="text-copper hover:underline">Re-check</Link>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Catalog topic only</span>
        )}
      </div>
      {evidence ? <p className="mt-1 text-xs text-muted-foreground">{evidence}</p> : null}
    </li>
  );
  return (
    <>
      <StudentJourney />
      <PageHeader eyebrow="Revision" title="Revise deliberately" lede="Lists come from recorded server flags. Nothing is invented when the server has not flagged a topic." actions={dashboard.source === "demo" || IS_DEMO ? <DemoBadge>Demo progress</DemoBadge> : undefined} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="glass-panel rounded-[1.75rem] border-copper/40 bg-accent/30">
          <h2 className="font-display text-xl">Needs more practice</h2>
          {needs.length ? <ul className="divide-y divide-border">{needs.map((row) => <Row key={row.topicId} topicId={row.topicId} title={row.title} evidence={row.evidence} />)}</ul> : <EmptyState title="Nothing flagged" body="The server has not marked any topic as needing practice." />}
        </Panel>
        <Panel className="glass-panel rounded-[1.75rem]">
          <h2 className="font-display text-xl">Consolidate — demonstrated</h2>
          {demonstrated.length ? <ul className="divide-y divide-border">{demonstrated.map((row) => <Row key={row.topicId} topicId={row.topicId} title={row.title} evidence={row.evidence} />)}</ul> : <EmptyState title="No demonstrated topics yet" body="Diagnostic demonstration appears here after the server records it." />}
        </Panel>
      </div>
      {dashboard.analytics.recentlyPractised.length ? (
        <Panel className="glass-panel mt-6 rounded-[1.75rem]">
          <h2 className="font-display text-xl">Recently practised</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {dashboard.analytics.recentlyPractised.map((row) => (
              <li key={`${row.topicId}-${row.at}`} className="flex justify-between gap-2 py-2">
                <AdaptiveLink dest={row.dest} className="hover:text-copper">{row.title}</AdaptiveLink>
                <span className="text-xs text-muted-foreground">{row.kind} · {row.at}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}
