import { createFileRoute, Link } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { loadTopic, requireTopicMaterial, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";
import { TeachingEvent } from "@/components/learning/TeachingEvent";
import { TOOL_META } from "@/data/tools";

export const Route = createFileRoute("/learn/topics/$topicId/notes")({
  loader: async ({ params }) => ({ ...(await loadTopic(params.topicId)), notes: await requireTopicMaterial(await services.lessons.notes(params.topicId)) }),
  head: ({ loaderData }) => topicHead(`Notes: ${loaderData?.topic.title ?? "Topic"}`, `Study notes for ${loaderData?.topic.title ?? "this topic"}.`),
  component: NotesPage,
});

function NotesPage() {
  const { topic, unit, notes, teaching } = Route.useLoaderData();
  return (
    <TopicShell topic={topic} unit={unit} title={`Notes — ${topic.title}`} teaching={teaching}>
      <TeachingEvent topicId={topic.id} kind="notes_viewed" source={notes.source} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="glass-panel max-w-[70ch] space-y-8 rounded-[1.75rem] p-6 md:p-10">
          <SourceNotice what="These notes" source={notes.source} />
          {notes.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="border-b border-border pb-2 font-display text-xl">{s.heading}</h2>
              <ul className="mt-3 space-y-2 leading-7">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
              {s.code && <CodeBlock className="mt-4" code={s.code} />}
            </section>
          ))}
        </article>
        <aside className="space-y-3 text-sm">
          <p className="eyebrow">Related</p>
          <Link to="/learn/topics/$topicId/lesson" params={{ topicId: topic.id }} className="block text-copper hover:underline">Lesson</Link>
          <Link to="/learn/topics/$topicId/resources" params={{ topicId: topic.id }} className="block text-copper hover:underline">One-shot revision</Link>
          <Link to="/learn/topics/$topicId/mind-map" params={{ topicId: topic.id }} className="block text-copper hover:underline">Mind map</Link>
          {topic.tools.map((t) => <Link key={t} to="/learn/tools/$tool" params={{ tool: t }} className="block text-copper hover:underline">{TOOL_META[t].name}</Link>)}
        </aside>
      </div>
    </TopicShell>
  );
}
