import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/bits";
import { services } from "@/services";
import { unitAssessmentId } from "@/lib/assessment";
import { UnitArt } from "@/components/art/UnitArt";
import { Reveal } from "@/components/art/motion";

export const Route = createFileRoute("/learn/units/")({
  loader: async () => ({
    units: await services.curriculum.units(),
    topics: await services.curriculum.topics(),
    official: await services.curriculum.official(),
  }),
  head: () => ({ meta: [{ title: "Units — CForge" }, { name: "description", content: "The five official C programming units and supplementary practice." }, { property: "og:title", content: "Units — CForge" }, { property: "og:description", content: "Browse the CForge curriculum." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Units,
});

function Units() {
  const { units, topics, official } = Route.useLoaderData();
  const supp = topics.filter((t) => t.unitId === "supplementary");
  const unitCount = official?.officialUnitCount ?? units.length;
  const topicCount = official?.officialTopicCount ?? topics.filter((t) => t.unitId !== "supplementary").length;
  return (
    <>
      <PageHeader eyebrow="Curriculum" title={`${unitCount} official units, ${topicCount} official topics`} lede="Every official unit links to its catalog topics. Foundation is a supporting library, not a sixth unit. Laboratory topics stay listed even when a teaching package is not available." />
      <Reveal>
        <Link to="/learn/foundation" className="glass-dark lift mb-6 block overflow-hidden rounded-[1.75rem] p-6 md:p-8" data-testid="units-foundation-entry">
          <p className="eyebrow !text-ember">Supporting library</p>
          <h2 className="mt-2 font-display text-3xl">Foundation labels</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75">Readable catalog labels only. Missing screenshot entries and lesson bodies are not invented.</p>
        </Link>
      </Reveal>
      <div className="space-y-6">
        {units.map((u, i) => (
          <Reveal key={u.id} delay={i * 60}><section className="glass-panel grid items-start gap-6 overflow-hidden rounded-3xl p-4 md:grid-cols-[16rem_1fr] md:p-5" data-testid={`units-${u.id}`}>
            <div>
              <UnitArt unitId={u.id} number={u.number} className="h-40" />
              <h2 className="mt-1 font-display text-2xl"><Link to="/learn/units/$unitId" params={{ unitId: u.id }} className="hover:text-copper">{u.title}</Link></h2>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link to="/learn/units/$unitId/mind-map" params={{ unitId: u.id }} className="text-copper hover:underline">Mind map</Link>
                <Link to="/learn/assessments/$assessmentId" params={{ assessmentId: unitAssessmentId(u.id) }} className="text-copper hover:underline">Unit assessment</Link>
              </div>
            </div>
            <ol className="grid gap-2 sm:grid-cols-2">
              {topics.filter((t) => t.unitId === u.id).map((t) => (
                <li key={t.id}><Link to="/learn/topics/$topicId" params={{ topicId: t.id }} className="press flex gap-3 rounded-xl p-2 transition-colors hover:bg-white/70"><span className="font-mono text-xs text-muted-foreground">{String(t.order).padStart(2, "0")}</span><span>{t.title}</span></Link></li>
              ))}
            </ol>
          </section></Reveal>
        ))}
        <section className="surface-ink grid items-center gap-6 rounded-3xl p-6 md:grid-cols-[1fr_14rem]"><div>
          <p className="eyebrow">Supplementary — outside the official syllabus</p>
          {supp.map((t) => <Link key={t.id} to="/learn/topics/$topicId" params={{ topicId: t.id }} className="mt-2 block font-display text-2xl hover:text-ember">{t.title}</Link>)}
          </div><UnitArt unitId="supplementary" className="h-32" />
        </section>
      </div>
    </>
  );
}
