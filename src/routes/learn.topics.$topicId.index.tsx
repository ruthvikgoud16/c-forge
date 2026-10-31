import { createFileRoute, Link } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { Panel, SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { loadTopic, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";
import { TOOL_META } from "@/data/tools";
import { TopicDiagram } from "@/components/art/TopicDiagram";
import { ToolPreview } from "@/components/art/ToolPreview";

export const Route = createFileRoute("/learn/topics/$topicId/")({
  loader: async ({ params }) => {
    const base = await loadTopic(params.topicId);
    const ex = await services.exercises.list();
    return { ...base, exercises: ex.filter((e) => base.topic.exerciseIds.includes(e.id)) };
  },
  head: ({ loaderData }) => topicHead(loaderData?.topic.title ?? "Topic", loaderData?.topic.summary ?? "CForge topic"),
  component: TopicOverview,
});

function TopicOverview() {
  const { topic, unit, exercises } = Route.useLoaderData();
  const res = [
    { to: "/learn/topics/$topicId/lesson", label: "Lesson", d: "Concepts, worked example, trace and practice." },
    { to: "/learn/topics/$topicId/notes", label: "Notes", d: "Structured study notes." },
    { to: "/learn/topics/$topicId/resources", label: "One-shot", d: "Compact revision sheet." },
    { to: "/learn/topics/$topicId/flashcards", label: "Flashcards", d: "Six-card deck." },
    { to: "/learn/topics/$topicId/mind-map", label: "Mind map", d: "Concept graph." },
  ] as const;
  return (
    <TopicShell topic={topic} unit={unit}>
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <p className="text-lg">{topic.summary}</p>
          <SourceNotice what="Topic text" />
          <TopicDiagram topic={topic} />
          <div className="grid gap-3 sm:grid-cols-2">
            {res.map((r) => (
              <Link key={r.to} to={r.to} params={{ topicId: topic.id }} className="lift press glass-panel rounded-2xl p-4">
                <span className="font-display text-lg">{r.label}</span>
                <span className="block text-sm text-muted-foreground">{r.d}</span>
              </Link>
            ))}
            <Link to="/learn/assessments/$assessmentId" params={{ assessmentId: `ta-${topic.id}` }} className="lift press rounded-2xl bg-gradient-to-br from-copper to-ember p-4 text-pearl [&_span]:!text-pearl">
              <span className="font-display text-lg">Topic assessment</span>
              <span className="block text-sm text-muted-foreground">Preview quiz for this package.</span>
            </Link>
          </div>
          <CodeBlock code={topic.example.code} output={topic.example.output} title="Worked example" />
        </div>
        <aside className="space-y-4">
          <Panel className="bg-surface-2">
            <h2 className="font-display text-lg">Key concepts</h2>
            <dl className="mt-3 space-y-3 text-sm">{topic.concepts.map((c) => <div key={c.term}><dt className="font-medium">{c.term}</dt><dd className="text-muted-foreground">{c.definition}</dd></div>)}</dl>
          </Panel>
          <Panel>
            <h2 className="font-display text-lg">Visualisers</h2>
            <ul className="mt-3 space-y-3 text-sm">{topic.tools.map((t) => <li key={t}><Link to="/learn/tools/$tool" params={{ tool: t }} className="group block"><ToolPreview id={t} className="transition-transform group-hover:scale-[1.02]" /><span className="mt-1.5 block text-copper group-hover:underline">{TOOL_META[t].name} →</span></Link></li>)}</ul>
          </Panel>
          <Panel className="surface-ink">
            <h2 className="font-display text-lg">Coding exercises</h2>
            {exercises.length ? <ul className="mt-3 space-y-2 text-sm">{exercises.map((e) => <li key={e.id}><Link to="/studio/$exerciseId" params={{ exerciseId: e.id }} className="text-ember hover:underline">{e.title}</Link></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No coding exercise is linked to this topic yet.</p>}
          </Panel>
        </aside>
      </div>
    </TopicShell>
  );
}
