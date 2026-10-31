import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, StateChip, DemoBadge } from "@/components/common/bits";
import { services } from "@/services";

export const Route = createFileRoute("/learn/progress")({
  loader: async () => {
    const me = await services.student.me();
    return { me, units: await services.curriculum.units(), topics: await services.curriculum.topics(), progress: await services.progress.forStudent(me.id) };
  },
  head: () => ({ meta: [{ title: "Progress — CForge" }, { name: "description", content: "Your topic-by-topic learning progress." }, { property: "og:title", content: "Progress — CForge" }, { property: "og:description", content: "Demonstrated, mastered and needs-practice topics." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { units, topics, progress } = Route.useLoaderData();
  const st = (id: string) => progress.topics.find((p) => p.topicId === id);
  return (
    <>
      <PageHeader eyebrow="Progress" title="Where you stand" lede="States come from your learning activity and assessments. CForge does not predict marks or rank students." actions={<DemoBadge>Demo progress — not saved</DemoBadge>} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {units.map((u) => (
            <Panel key={u.id}>
              <h2 className="font-display text-xl">Unit {u.number} · {u.title}</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {topics.filter((t) => t.unitId === u.id).map((t) => {
                  const p = st(t.id);
                  return (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link to="/learn/topics/$topicId" params={{ topicId: t.id }} className="hover:text-copper">{t.title}</Link>
                      <span className="flex items-center gap-3">{p?.lastOpened && <span className="text-xs text-muted-foreground">opened {p.lastOpened}</span>}<StateChip state={p?.state ?? "not-started"} /></span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
        <aside>
          <Panel className="sticky top-32">
            <h2 className="font-display text-xl">Assessment history</h2>
            <p className="mt-1 text-xs text-muted-foreground">Fictional preview attempts.</p>
            <ul className="mt-3 divide-y divide-border text-sm">
              {progress.attempts.map((a) => <li key={a.assessmentId} className="flex justify-between gap-2 py-2"><span>{a.title}<span className="block text-xs text-muted-foreground">{a.date}</span></span><span className="font-mono">{a.correct}/{a.total}</span></li>)}
            </ul>
          </Panel>
        </aside>
      </div>
    </>
  );
}
