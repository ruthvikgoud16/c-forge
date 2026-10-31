import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyState, DemoBadge } from "@/components/common/bits";
import { services } from "@/services";

export const Route = createFileRoute("/learn/revision")({
  loader: async () => {
    const me = await services.student.me();
    return { topics: await services.curriculum.topics(), progress: await services.progress.forStudent(me.id) };
  },
  head: () => ({ meta: [{ title: "Revision — CForge" }, { name: "description", content: "Revise the topics that need more practice." }, { property: "og:title", content: "Revision — CForge" }, { property: "og:description", content: "Targeted revision with one-shot sheets and flashcards." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Revision,
});

function Revision() {
  const { topics, progress } = Route.useLoaderData();
  const byId = Object.fromEntries(topics.map((t) => [t.id, t]));
  const needs = progress.topics.filter((p) => p.state === "needs-practice");
  const recent = progress.topics.filter((p) => p.state === "demonstrated").slice(0, 6);
  const Row = ({ id }: { id: string }) => (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <span className="font-medium">{byId[id]?.title}</span>
      <span className="flex gap-3 text-sm">
        <Link to="/learn/topics/$topicId/resources" params={{ topicId: id }} className="text-copper hover:underline">One-shot</Link>
        <Link to="/learn/topics/$topicId/flashcards" params={{ topicId: id }} className="text-copper hover:underline">Flashcards</Link>
        <Link to="/learn/assessments/$assessmentId" params={{ assessmentId: `ta-${id}` }} className="text-copper hover:underline">Re-check</Link>
      </span>
    </li>
  );
  return (
    <>
      <PageHeader eyebrow="Revision" title="Revise deliberately" lede="Start with what needs more practice, then consolidate what you've demonstrated." actions={<DemoBadge>Demo progress</DemoBadge>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="border-copper/40 bg-accent/30">
          <h2 className="font-display text-xl">Needs more practice</h2>
          {needs.length ? <ul className="divide-y divide-border">{needs.map((n) => <Row key={n.topicId} id={n.topicId} />)}</ul> : <EmptyState title="Nothing flagged" body="Topics you struggle with in assessments will appear here." />}
        </Panel>
        <Panel>
          <h2 className="font-display text-xl">Consolidate — demonstrated</h2>
          {recent.length ? <ul className="divide-y divide-border">{recent.map((n) => <Row key={n.topicId} id={n.topicId} />)}</ul> : <EmptyState title="No demonstrated topics yet" />}
        </Panel>
      </div>
    </>
  );
}
