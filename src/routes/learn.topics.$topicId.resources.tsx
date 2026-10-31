import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopicShell } from "@/components/learning/TopicShell";
import { SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { loadTopic, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";

export const Route = createFileRoute("/learn/topics/$topicId/resources")({
  loader: async ({ params }) => ({ ...(await loadTopic(params.topicId)), one: (await services.lessons.oneShot(params.topicId))! }),
  head: ({ loaderData }) => topicHead(`One-shot: ${loaderData?.topic.title ?? "Topic"}`, `Compact revision for ${loaderData?.topic.title ?? "this topic"}.`),
  component: OneShotPage,
});

function OneShotPage() {
  const { topic, unit, one } = Route.useLoaderData();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <TopicShell topic={topic} unit={unit} title={`One-shot — ${topic.title}`}>
      <SourceNotice what="This revision sheet" />
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
            {one.quickCheck.map((q, i) => (
              <li key={q.q}>
                <button className="w-full rounded-md border border-border p-3 text-left hover:bg-foreground/5" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                  <span className="font-medium">{q.q}</span>
                  {open === i && <span className="mt-1 block text-sm text-forest">{q.a}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TopicShell>
  );
}
