import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { services } from "@/services";

export const Route = createFileRoute("/studio/")({
  loader: async () => ({ exercises: await services.exercises.list(), topics: await services.curriculum.topics() }),
  head: () => ({ meta: [{ title: "Coding Studio — CForge" }, { name: "description", content: "Original CForge judge exercises." }, { property: "og:title", content: "Coding Studio — CForge" }, { property: "og:description", content: "Practise C in a focused workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Catalogue,
});

function Catalogue() {
  const { exercises, topics } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [d, setD] = useState<string>("all");
  const tname = Object.fromEntries(topics.map((t) => [t.id, t.title]));
  const list = exercises.filter((e) => (d === "all" || e.difficulty === d) && e.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow">Original exercise bank</p>
      <h1 className="mt-2 font-display text-4xl">Exercises</h1>
      <p className="mt-2 text-muted-foreground">{exercises.length} exercises · hidden tests stay on the server and are never shown. Run and Submit call `/api/v1/execute`.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" aria-label="Search exercises" className="max-w-xs glass-panel" />
        {["all", "warm-up", "core", "stretch"].map((x) => (
          <button key={x} aria-pressed={d === x} onClick={() => setD(x)} className={`press rounded-full px-3 py-1.5 text-sm capitalize ${d === x ? "bg-copper text-pearl shadow" : "glass-panel"}`}>{x}</button>
        ))}
      </div>
      <ul className="mt-6 divide-y divide-white/10 overflow-hidden rounded-[1.75rem] glass-panel">
        {list.map((e, i) => (
          <li key={e.id}>
            <Link to="/studio/$exerciseId" params={{ exerciseId: e.id }} className="press flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-white/5">
              <span className="w-6 font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1 font-medium">{e.title}</span>
              {tname[e.topicId] ? <span className="text-xs text-muted-foreground">{tname[e.topicId]}</span> : null}
              <span className="rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[11px] text-ember">{e.difficulty}</span>
            </Link>
          </li>
        ))}
        {!list.length && <li className="p-6 text-center text-sm text-muted-foreground">No exercises match, and none were invented.</li>}
      </ul>
    </main>
  );
}
