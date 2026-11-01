import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, StateChip } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { services } from "@/services";
import { UnitArt } from "@/components/art/UnitArt";
import { Reveal } from "@/components/art/motion";
import { TOOL_TINT } from "@/components/art/ToolPreview";
import { TOOL_META } from "@/data/tools";
import { unitAssessmentId } from "@/lib/assessment";

export const Route = createFileRoute("/learn/units/$unitId/")({
  loader: async ({ params }) => {
    const unit = await services.curriculum.unit(params.unitId);
    if (!unit) throw notFound();
    const me = await services.student.me();
    return {
      unit,
      topics: await services.curriculum.topics(unit.id),
      progress: await services.progress.forStudent(me.id),
      teachingIds: new Set(await services.curriculum.teachingTopicIds()),
    };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.unit.title ?? "Unit"} — CForge` }, { name: "description", content: loaderData?.unit.summary ?? "CForge unit" }, { property: "og:title", content: `${loaderData?.unit.title ?? "Unit"} — CForge` }, { property: "og:description", content: loaderData?.unit.summary ?? "CForge unit" }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }] }),
  component: UnitPage,
});

function UnitPage() {
  const { unit, topics, progress, teachingIds } = Route.useLoaderData();
  return (
    <>
      <UnitArt unitId={unit.id} number={unit.number} className="cf-rise mb-8 h-44 md:h-56" />
      <PageHeader crumbs={[{ label: "Units", to: "/learn/units" }, { label: `Unit ${unit.number}` }]} eyebrow={`Unit ${unit.number}`} title={unit.title} lede={unit.summary}
        actions={<><Button asChild variant="quiet"><Link to="/learn/units/$unitId/mind-map" params={{ unitId: unit.id }}>Unit mind map</Link></Button><Button asChild variant="hero"><Link to="/learn/assessments/$assessmentId" params={{ assessmentId: unitAssessmentId(unit.id) }}>Unit assessment</Link></Button></>} />
      <ol className="grid gap-4 md:grid-cols-2">
        {topics.map((t, i) => {
          const st = progress.topics.find((p) => p.topicId === t.id)?.state ?? "not-started";
          return (
            <Reveal as="li" key={t.id} delay={(i % 2) * 100} className="lift glass-panel grid gap-4 rounded-3xl p-4 sm:grid-cols-[9rem_1fr]">
              <div className="group relative hidden min-h-28 place-items-center overflow-hidden rounded-2xl text-white sm:grid" style={{ background: TOOL_TINT[t.tools[0] ?? "syntax"] }} aria-hidden>
                <svg viewBox="0 0 100 100" className="cf-spin-slow absolute size-28 opacity-40"><circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
                <span className="relative font-mono text-3xl font-bold transition-transform duration-500 group-hover:scale-125">{TOOL_META[t.tools[0] ?? "syntax"].glyph}</span>
                <span className="absolute bottom-2 font-mono text-[10px] opacity-80">{String(t.order).padStart(2, "0")}</span>
              </div>
              <div>
              <div className="flex items-start justify-between gap-2"><span className="font-mono text-xs text-muted-foreground">Package {String(t.order).padStart(2, "0")}</span><StateChip state={st} /></div>
              <h2 className="mt-2 font-display text-xl"><Link to="/learn/topics/$topicId" params={{ topicId: t.id }} className="hover:text-copper">{t.title}</Link></h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.summary}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link to="/learn/topics/$topicId" params={{ topicId: t.id }} className="text-copper hover:underline">Topic hub</Link>
                {teachingIds.has(t.id) ? (
                  <>
                    <Link to="/learn/topics/$topicId/lesson" params={{ topicId: t.id }} className="text-copper hover:underline">Lesson</Link>
                    <Link to="/learn/topics/$topicId/notes" params={{ topicId: t.id }} className="text-copper hover:underline">Notes</Link>
                    <Link to="/learn/topics/$topicId/flashcards" params={{ topicId: t.id }} className="text-copper hover:underline">Flashcards</Link>
                    <Link to="/learn/topics/$topicId/mind-map" params={{ topicId: t.id }} className="text-copper hover:underline">Mind map</Link>
                  </>
                ) : <span className="text-xs text-muted-foreground">No teaching package is available for this catalog topic.</span>}
              </div>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </>
  );
}
