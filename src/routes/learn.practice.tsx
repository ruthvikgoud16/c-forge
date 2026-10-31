import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { services } from "@/services";

export const Route = createFileRoute("/learn/practice")({
  loader: async () => ({ units: await services.curriculum.units(), topics: await services.curriculum.topics(), exercises: await services.exercises.list() }),
  head: () => ({ meta: [{ title: "Practice — CForge" }, { name: "description", content: "Guided practice, flashcards and coding exercises." }, { property: "og:title", content: "Practice — CForge" }, { property: "og:description", content: "Practise C with purpose." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Practice,
});

function Practice() {
  const { units, topics, exercises } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Practice" title="Practise with purpose" lede="Guided practice lives inside each lesson. Flashcards build recall. The studio builds code." />
      <section className="surface-ink mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl p-6">
        <div><p className="eyebrow">Coding studio</p><h2 className="mt-1 font-display text-2xl">{exercises.length} C exercises</h2></div>
        <Button asChild variant="hero"><Link to="/studio">Open the studio</Link></Button>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {units.map((u) => (
          <Panel key={u.id}>
            <h2 className="font-display text-xl">Unit {u.number} · {u.shortTitle}</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {topics.filter((t) => t.unitId === u.id).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{t.title}</span>
                  <span className="flex gap-3">
                    <Link to="/learn/topics/$topicId/lesson" hash="guided" params={{ topicId: t.id }} className="text-copper hover:underline">Guided</Link>
                    <Link to="/learn/topics/$topicId/flashcards" params={{ topicId: t.id }} className="text-copper hover:underline">Cards</Link>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
