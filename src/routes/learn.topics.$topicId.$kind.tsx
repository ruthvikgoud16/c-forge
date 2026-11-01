import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { KnowledgeChecks, SlotCheck } from "@/components/learning/LessonCheck";
import { Reveal } from "@/components/art/motion";
import { loadTopic, topicHead } from "@/lib/topic-loader";
import {
  NEWLY_INTEGRATED_KINDS,
  isTeachingKind,
  teachingContentForKind,
  type TeachingKind,
  type TeachingPackage,
} from "@/lib/teaching";

const TITLES: Record<(typeof NEWLY_INTEGRATED_KINDS)[number], string> = {
  quick: "Quick notes",
  concepts: "Concept library",
  examples: "Worked examples",
  trace: "Code tracing",
  predict: "Output prediction",
  syntax: "Syntax reference",
  practice: "Practice",
};

export const Route = createFileRoute("/learn/topics/$topicId/$kind")({
  loader: async ({ params }) => {
    if (!isTeachingKind(params.kind) || !(NEWLY_INTEGRATED_KINDS as readonly string[]).includes(params.kind)) {
      throw notFound();
    }
    const base = await loadTopic(params.topicId);
    if (!base.teaching || !teachingContentForKind(base.teaching, params.kind)) throw notFound();
    return { ...base, kind: params.kind as TeachingKind };
  },
  head: ({ loaderData }) => topicHead(
    `${TITLES[loaderData?.kind as keyof typeof TITLES] ?? "Teaching"}: ${loaderData?.topic.title ?? "Topic"}`,
    `Original teaching interaction for ${loaderData?.topic.title ?? "this topic"}.`,
  ),
  component: TeachingKindPage,
});

function TeachingKindPage() {
  const { topic, unit, teaching, kind } = Route.useLoaderData();
  const pkg = teaching as TeachingPackage;
  return (
    <TopicShell topic={topic} unit={unit} title={`${TITLES[kind as keyof typeof TITLES]} — ${topic.title}`} teaching={pkg}>
      <SourceNotice what="This teaching interaction" source={pkg.source} />
      <div className="mt-6 space-y-4">
        {kind === "quick" ? (
          <ul className="space-y-3">
            {pkg.quickNotes.map((note) => (
              <Reveal as="li" key={note} className="glass-panel rounded-2xl p-4">{note}</Reveal>
            ))}
          </ul>
        ) : null}
        {kind === "concepts" ? (
          <dl className="grid gap-3 md:grid-cols-2">
            {pkg.concepts.map((concept) => (
              <div key={concept.id} className="glass-panel rounded-2xl p-4">
                <dt className="font-display text-lg">{concept.prompt}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{concept.explanation}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {kind === "examples" ? pkg.examples.map((example) => (
          <article key={example.title} className="glass-panel rounded-2xl p-5">
            <h2 className="font-display text-xl">{example.title}</h2>
            {example.problem ? <p className="mt-2 leading-7">{example.problem}</p> : null}
            {example.steps.length ? <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-7">{example.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
            {example.code ? <CodeBlock className="mt-4" code={example.code} output={example.output ?? undefined} title="Example" /> : null}
          </article>
        )) : null}
        {kind === "trace" && pkg.trace ? <SlotCheck lessonId={pkg.lessonId} item={pkg.trace} source={pkg.source} /> : null}
        {kind === "predict" && pkg.predict ? <SlotCheck lessonId={pkg.lessonId} item={pkg.predict} source={pkg.source} /> : null}
        {kind === "syntax" ? (
          <div className="space-y-4">
            {pkg.syntax ? <CodeBlock code={pkg.syntax} title="Syntax" /> : null}
            {pkg.syntaxRows.length ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {pkg.syntaxRows.map((row) => (
                  <li key={row.token} className="glass-panel rounded-2xl p-4">
                    <code className="text-ember">{row.token}</code>
                    <p className="mt-2 text-sm text-muted-foreground">{row.meaning}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {kind === "practice" ? (
          <div className="space-y-4">
            {pkg.guided ? <SlotCheck lessonId={pkg.lessonId} item={pkg.guided} source={pkg.source} /> : null}
            {pkg.independent ? <SlotCheck lessonId={pkg.lessonId} item={pkg.independent} source={pkg.source} /> : null}
            {pkg.checks.length ? <KnowledgeChecks lessonId={pkg.lessonId} items={pkg.checks} source={pkg.source} /> : null}
            {pkg.exerciseId ? (
              <p className="text-sm">
                Coding uses the existing judge.{" "}
                <Link to="/studio/$exerciseId" params={{ exerciseId: pkg.exerciseId }} className="text-copper hover:underline">Open the linked exercise</Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No judge exercise is linked. This practice is not an official lab.</p>
            )}
            <p className="text-sm text-muted-foreground">Practice scores are not placement and not mastery.</p>
          </div>
        ) : null}
      </div>
    </TopicShell>
  );
}
