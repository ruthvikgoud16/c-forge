import { createFileRoute, Link } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { Panel, SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { loadTopic, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";
import { TOOL_META } from "@/data/tools";
import { destForTeachingKind, destLink } from "@/lib/teaching";
import { topicAssessmentId } from "@/lib/assessment";
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

const KIND_COPY: Record<string, string> = {
  notes: "Structured study notes.",
  oneshot: "Compact revision sheet.",
  "mind-map": "Concept graph.",
  flashcards: "Study deck from the original package.",
  quick: "Short revision lines from the original package.",
  concepts: "Concept library from the original package.",
  examples: "Worked examples from the original lesson.",
  trace: "Code-tracing prompt. Scored by the original checker.",
  predict: "Output-prediction prompt. Scored by the original checker.",
  syntax: "Syntax and terminology from the original package.",
  practice: "Guided and independent practice, plus knowledge checks.",
};

function TopicOverview() {
  const { topic, unit, exercises, teaching } = Route.useLoaderData();
  const res = [
    ...(teaching?.availableKinds.length
      ? [{ to: "/learn/topics/$topicId/lesson" as const, label: "Lesson", d: "Concepts, worked example, trace and practice.", params: { topicId: topic.id } }]
      : []),
    ...(teaching?.availableKinds ?? []).map((kind) => {
      const dest = destLink(destForTeachingKind(topic.id, kind));
      return { to: dest.to, label: kind === "oneshot" ? "One-shot" : kind.replace("-", " "), d: KIND_COPY[kind] ?? "Original teaching package.", params: dest.params };
    }),
  ];
  return (
    <TopicShell topic={topic} unit={unit} teaching={teaching}>
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <p className="text-lg">{topic.summary}</p>
          <SourceNotice what="Topic text" source={topic.source} />
          <TopicDiagram topic={topic} />
          <div className="grid gap-3 sm:grid-cols-2">
            {res.map((r) => (
              <Link key={`${r.to}-${r.label}`} to={r.to} params={r.params} className="lift press glass-panel rounded-2xl p-4">
                <span className="font-display text-lg capitalize">{r.label}</span>
                <span className="block text-sm text-muted-foreground">{r.d}</span>
              </Link>
            ))}
            {teaching?.availableKinds.length ? <Link to="/learn/assessments/$assessmentId" params={{ assessmentId: topicAssessmentId(topic.id) }} className="lift press rounded-2xl bg-gradient-to-br from-copper to-ember p-4 text-pearl [&_span]:!text-pearl">
              <span className="font-display text-lg">Topic assessment</span>
              <span className="block text-sm text-muted-foreground">Server-scored CForge practice. Not an official exam.</span>
            </Link> : null}
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
