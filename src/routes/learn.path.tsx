import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StateChip } from "@/components/common/bits";
import { services } from "@/services";

export const Route = createFileRoute("/learn/path")({
  loader: async () => {
    const me = await services.student.me();
    return { units: await services.curriculum.units(), topics: await services.curriculum.topics(), progress: await services.progress.forStudent(me.id) };
  },
  head: () => ({ meta: [{ title: "Learning Path — CForge" }, { name: "description", content: "All 31 CForge packages in syllabus order." }, { property: "og:title", content: "Learning Path — CForge" }, { property: "og:description", content: "Your sequential C learning path." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PathPage,
});

function PathPage() {
  const { units, topics, progress } = Route.useLoaderData();
  const st = (id: string) => progress.topics.find((p) => p.topicId === id)?.state ?? "not-started";
  const groups = [...units.map((u) => ({ key: u.id, label: `Unit ${u.number} · ${u.title}` })), { key: "supplementary", label: "Supplementary" }];
  return (
    <>
      <PageHeader eyebrow="Learning path" title="The full sequence" lede="Work through the packages in order. Each step opens its lesson." />
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="mb-4 font-display text-xl">{g.label}</h2>
            <ol className="relative ml-3 border-l-2 border-border">
              {topics.filter((t) => t.unitId === g.key).map((t) => {
                const s = st(t.id);
                return (
                  <li key={t.id} className="relative mb-3 pl-6">
                    <span className={`absolute -left-[9px] top-3 size-4 rounded-full border-2 border-background ${s === "mastered" ? "bg-success" : s === "demonstrated" ? "bg-gold" : s === "needs-practice" ? "bg-copper" : s === "opened" ? "bg-info" : "bg-stone"}`} aria-hidden />
                    <Link to="/learn/topics/$topicId/lesson" params={{ topicId: t.id }} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:border-copper">
                      <span><span className="mr-3 font-mono text-xs text-muted-foreground">{String(t.order).padStart(2, "0")}</span>{t.title}</span>
                      <StateChip state={s} />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
