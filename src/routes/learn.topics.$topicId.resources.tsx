import { createFileRoute } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { TeachingEvent } from "@/components/learning/TeachingEvent";
import { SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { loadTopic, requireTopicMaterial, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";

export const Route = createFileRoute("/learn/topics/$topicId/resources")({
  loader: async ({ params }) => ({ ...(await loadTopic(params.topicId)), one: await requireTopicMaterial(await services.lessons.oneShot(params.topicId)) }),
  head: ({ loaderData }) => topicHead(`One-shot: ${loaderData?.topic.title ?? "Topic"}`, `Compact revision for ${loaderData?.topic.title ?? "this topic"}.`),
  component: OneShotPage,
});

function OneShotPage() {
  const { topic, unit, one, teaching } = Route.useLoaderData();
  return (
    <TopicShell topic={topic} unit={unit} title={`One-shot — ${topic.title}`} teaching={teaching}>
      <TeachingEvent topicId={topic.id} kind="oneshot_completed" source={one.source} />
      <SourceNotice what="This revision sheet" source={one.source} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="surface-ink rounded-xl p-6 md:row-span-2">
          <p className="eyebrow">Must-know</p>
          <ol className="mt-3 space-y-3">{one.keyPoints.map((k, i) => <li key={k} className="flex gap-3"><span className="font-mono text-ember">{i + 1}</span><span>{k}</span></li>)}</ol>
          {one.syntax && <CodeBlock className="mt-5" code={one.syntax} title="Syntax" />}
        </section>
        <section className="rounded-xl border border-copper/40 bg-accent/40 p-6">
          <p className="eyebrow">Pitfalls</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">{one.pitfalls.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="eyebrow">Quick check</p>
          <ul className="mt-3 space-y-2">
            {one.quickCheck.map((q) => (
              <li key={q.q} className="rounded-md border border-border p-3">
                <span className="font-medium">{q.q}</span>
                <span className="mt-1 block text-sm text-muted-foreground">Think first, then use the topic assessment. The expected answer stays on the server.</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TopicShell>
  );
}
