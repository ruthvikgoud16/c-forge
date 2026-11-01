import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopicShell } from "@/components/learning/TopicShell";
import { SourceNotice } from "@/components/common/bits";
import { CodeBlock } from "@/components/common/CodeBlock";
import { Button } from "@/components/ui/button";
import { loadTopic, requireTopicMaterial, topicHead } from "@/lib/topic-loader";
import { topicAssessmentId } from "@/lib/assessment";
import { services } from "@/services";
import { TOOL_META } from "@/data/tools";
import type { LessonSection } from "@/domain/types";
import { TopicDiagram } from "@/components/art/TopicDiagram";
import { Reveal } from "@/components/art/motion";
import { KnowledgeChecks, SlotCheck } from "@/components/learning/LessonCheck";

export const Route = createFileRoute("/learn/topics/$topicId/lesson")({
  loader: async ({ params }) => ({ ...(await loadTopic(params.topicId)), lesson: await requireTopicMaterial(await services.lessons.lesson(params.topicId)) }),
  head: ({ loaderData }) => topicHead(`Lesson: ${loaderData?.topic.title ?? "Topic"}`, loaderData?.topic.summary ?? "CForge lesson"),
  component: LessonPage,
});

function Trace({ s }: { s: LessonSection }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-3">
      <p>{s.body}</p>
      <CodeBlock code={s.code!} title="Trace this" />
      {shown ? <p className="rounded-md bg-forest px-4 py-3 font-mono text-sm text-pearl">output › {s.output}</p> : <Button variant="quiet" onClick={() => setShown(true)}>Reveal output</Button>}
    </div>
  );
}

function LessonPage() {
  const { topic, unit, prev, next, lesson, teaching } = Route.useLoaderData();
  return (
    <TopicShell topic={topic} unit={unit} prev={prev} next={next} teaching={teaching}>
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="Lesson contents" className="sticky top-32 text-sm">
            <p className="eyebrow mb-3">Contents</p>
            <ol className="space-y-1.5 border-l border-border">
              {lesson.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-3 text-muted-foreground hover:border-copper hover:text-foreground">{s.title}</a></li>)}
            </ol>
          </nav>
        </aside>
        <article className="max-w-[68ch] space-y-10">
          <SourceNotice what="This lesson" source={lesson.source} />
          {lesson.sections.map((s, n) => (
            <Reveal as="section" key={s.id} className="scroll-mt-32">
              <span id={s.id} className="block scroll-mt-32" />
              {s.kind === "example" && <TopicDiagram topic={topic} className="mb-8" />}
              <p className="eyebrow mb-1 flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-copper font-mono text-[10px] text-pearl">{n + 1}</span>{s.kind}</p>
              <h2 className="mb-3 font-display text-2xl">{s.title}</h2>
              {s.kind === "trace" ? <Trace s={s} /> : (
                <>
                  {s.body && <p className="leading-7">{s.body}</p>}
                  {s.items && <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 marker:text-copper">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>}
                  {s.code && <CodeBlock className="mt-4" code={s.code} output={s.output} title={s.kind === "syntax" ? "Syntax" : "Example"} />}
                </>
              )}
            </Reveal>
          ))}
          {teaching?.trace ? <div id="trace"><SlotCheck lessonId={teaching.lessonId} item={teaching.trace} source={teaching.source} /></div> : null}
          {teaching?.predict ? <div id="predict"><SlotCheck lessonId={teaching.lessonId} item={teaching.predict} source={teaching.source} /></div> : null}
          {teaching?.guided ? <div id="guided"><SlotCheck lessonId={teaching.lessonId} item={teaching.guided} source={teaching.source} /></div> : null}
          {teaching?.independent ? <div id="independent"><SlotCheck lessonId={teaching.lessonId} item={teaching.independent} source={teaching.source} /></div> : null}
          {teaching?.checks.length ? <div id="check"><KnowledgeChecks lessonId={teaching.lessonId} items={teaching.checks} source={teaching.source} /></div> : null}
          {teaching ? <p className="text-sm text-muted-foreground">Opening this lesson is not mastery. Check scores stay separate from placement.</p> : null}
          <section className="glass-panel rounded-3xl p-6">
            <h2 className="font-display text-xl">Keep going</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Button asChild variant="quiet" size="sm"><Link to="/learn/topics/$topicId/notes" params={{ topicId: topic.id }}>Related notes</Link></Button>
              <Button asChild variant="quiet" size="sm"><Link to="/learn/topics/$topicId/mind-map" params={{ topicId: topic.id }}>Mind map</Link></Button>
              {topic.tools.map((t) => <Button key={t} asChild variant="quiet" size="sm"><Link to="/learn/tools/$tool" params={{ tool: t }}>{TOOL_META[t].name}</Link></Button>)}
              {teaching?.availableKinds.includes("practice") ? <Button asChild variant="quiet" size="sm"><Link to="/learn/topics/$topicId/$kind" params={{ topicId: topic.id, kind: "practice" }}>Practice</Link></Button> : null}
              <Button asChild variant="quiet" size="sm"><Link to="/learn/assessments/$assessmentId" params={{ assessmentId: topicAssessmentId(topic.id) }}>Topic assessment</Link></Button>
              {topic.exerciseIds[0] && <Button asChild variant="ink" size="sm"><Link to="/studio/$exerciseId" params={{ exerciseId: topic.exerciseIds[0] }}>Open exercise</Link></Button>}
            </div>
          </section>
        </article>
      </div>
    </TopicShell>
  );
}
