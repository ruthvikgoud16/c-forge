import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Brain, FileText, Layers, Network, Sparkles } from "lucide-react";
import { StateChip, DemoBadge } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { services } from "@/services";
import { UnitArt, unitGradient } from "@/components/art/UnitArt";
import { ToolPreview, TOOL_TINT } from "@/components/art/ToolPreview";
import { Donut, Meter, Ring } from "@/components/art/Ring";
import { CountUp, Reveal } from "@/components/art/motion";

export const Route = createFileRoute("/learn/")({
  loader: async () => {
    const me = await services.student.me();
    const [units, topics, progress, tools] = await Promise.all([services.curriculum.units(), services.curriculum.topics(), services.progress.forStudent(me.id), services.visualizers.list()]);
    return { me, units, topics, progress, tools };
  },
  head: () => ({ meta: [{ title: "Dashboard — CForge" }, { name: "description", content: "Your CForge learning dashboard." }, { property: "og:title", content: "Dashboard — CForge" }, { property: "og:description", content: "Continue learning C with CForge." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

const STATE_COLORS = { mastered: "var(--color-success)", demonstrated: "var(--color-gold)", "needs-practice": "var(--color-copper)", opened: "var(--color-ember)", "not-started": "oklch(0.2 0.01 260 / 0.12)" } as const;
const RES_ICON: Record<string, typeof BookOpen> = { Lesson: BookOpen, Flashcards: Layers, Notes: FileText, "Mind map": Network };

function Dashboard() {
  const { me, units, topics, progress, tools } = Route.useLoaderData();
  const byId = Object.fromEntries(topics.map((t) => [t.id, t]));
  const recent = progress.recent[0];
  const continueTopic = recent ? byId[recent.topicId] : topics[0];
  const next = topics.find((t) => progress.topics.find((p) => p.topicId === t.id)?.state === "not-started") ?? topics[0];
  const needs = progress.topics.filter((p) => p.state === "needs-practice");
  const count = (s: string) => progress.topics.filter((p) => p.state === s).length;
  const done = count("mastered") + count("demonstrated");

  return (
    <div className="space-y-10">
      <section className="glass-panel cf-rise relative overflow-hidden rounded-[2rem] p-6 md:p-8" data-testid="dashboard-welcome">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-ember/25 blur-3xl cf-drift" aria-hidden />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="eyebrow">{me.cohort}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Good to see you, {me.name.split(" ")[0]}.</h1>
            <p className="mt-2 font-mono text-sm text-muted-foreground">{me.rollNumber}</p>
            <div className="mt-4"><DemoBadge>Fictional student · demo progress</DemoBadge></div>
          </div>
          <Ring value={done} max={topics.length} size={136} stroke={13} label={`${done} of ${topics.length} topics demonstrated or mastered`}>
            <span><span className="block font-display text-3xl"><CountUp to={done} /></span><span className="text-[10px] text-muted-foreground">of {topics.length} topics</span></span>
          </Ring>
          <div className="hidden w-56 md:block"><ToolPreview id="recursion" ms={1000} className="h-40" /></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {continueTopic && (
          <Reveal className="glass-dark lift relative grid overflow-hidden rounded-[1.75rem] md:grid-cols-[13rem_1fr]">
            <UnitArt unitId={continueTopic.unitId} label={false} className="h-40 rounded-none md:h-full" />
            <div className="relative p-6 md:p-8">
              <p className="eyebrow !text-ember">Continue learning</p>
              <h2 className="mt-2 font-display text-3xl">{continueTopic.title}</h2>
              <p className="mt-2 max-w-lg text-sm text-white/70">{continueTopic.summary}</p>
              {recent && <p className="mt-2 text-xs text-white/60">Last opened: {recent.resource} · {recent.date}</p>}
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild variant="hero" className="press rounded-full"><Link to="/learn/topics/$topicId/lesson" params={{ topicId: continueTopic.id }} data-testid="dashboard-resume-lesson">Resume lesson <ArrowRight /></Link></Button>
                <Button asChild variant="quiet" className="press rounded-full border-white/20 text-white hover:bg-white/10"><Link to="/learn/topics/$topicId" params={{ topicId: continueTopic.id }}>Topic overview</Link></Button>
              </div>
            </div>
          </Reveal>
        )}
        {next && (
          <Reveal delay={120} className="glass-panel lift flex flex-col rounded-[1.75rem] p-5">
            <ToolPreview id={next.tools[0] ?? "syntax"} className="h-32" />
            <p className="eyebrow mt-4">Recommended next</p>
            <h2 className="mt-1 font-display text-2xl">{next.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">The first topic in your path you haven't started yet.</p>
            <Button asChild variant="ink" className="press mt-auto self-start rounded-full"><Link to="/learn/topics/$topicId" params={{ topicId: next.id }} data-testid="dashboard-start-next">Start topic</Link></Button>
          </Reveal>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><h2 className="font-display text-2xl">Five units</h2><Link to="/learn/units" className="text-sm text-copper hover:underline">All units</Link></div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {units.map((u, i) => {
            const ids = topics.filter((t) => t.unitId === u.id).map((t) => t.id);
            const d = progress.topics.filter((p) => ids.includes(p.topicId) && (p.state === "demonstrated" || p.state === "mastered")).length;
            return (
              <Reveal key={u.id} delay={i * 70} className="min-w-52 snap-start">
                <Link to="/learn/units/$unitId" params={{ unitId: u.id }} className="lift glass-panel group block overflow-hidden rounded-3xl" data-testid={`dashboard-unit-${u.id}`}>
                  <UnitArt unitId={u.id} number={u.number} label={false} className="h-28 rounded-none" />
                  <div className="p-4">
                    <h3 className="font-semibold leading-snug">{u.shortTitle}</h3>
                    <Meter value={d} max={ids.length} color={unitGradient(u.id)} className="mt-3" />
                    <p className="mt-2 text-xs text-muted-foreground">{d} of {ids.length} topics demonstrated or mastered</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Reveal className="glass-panel rounded-3xl p-5">
          <h2 className="font-display text-xl">Learning progress</h2>
          <div className="mt-4 flex items-center gap-5">
            <Donut size={124} stroke={16} parts={(["mastered", "demonstrated", "needs-practice", "opened", "not-started"] as const).map((s) => ({ label: s, value: count(s), color: STATE_COLORS[s] }))}>
              <span className="font-display text-xl">{topics.length}</span>
            </Donut>
            <ul className="flex-1 space-y-2 text-sm">
              {(["mastered", "demonstrated", "needs-practice", "opened"] as const).map((s) => (
                <li key={s} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: STATE_COLORS[s] }} /><StateChip state={s} /></span><span className="font-mono">{count(s)}</span></li>
              ))}
            </ul>
          </div>
          <Link to="/learn/progress" className="mt-4 inline-block text-sm text-copper hover:underline">Full progress</Link>
        </Reveal>

        <Reveal delay={100} className="glass-panel rounded-3xl p-5">
          <h2 className="font-display text-xl">Recent activity</h2>
          {progress.recent.length ? (
            <ol className="relative mt-4 space-y-4 border-l-2 border-copper/20 pl-5">
              {progress.recent.map((r, i) => {
                const I = RES_ICON[r.resource ?? ""] ?? BookOpen;
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[31px] grid size-6 place-items-center rounded-full bg-copper text-pearl shadow"><I className="size-3" /></span>
                    <Link to="/learn/topics/$topicId" params={{ topicId: r.topicId }} className="font-medium hover:text-copper">{byId[r.topicId]?.title}</Link>
                    <p className="font-mono text-[11px] text-muted-foreground">{r.resource} · {r.date}</p>
                  </li>
                );
              })}
            </ol>
          ) : <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>}
        </Reveal>

        <Reveal delay={200} className="relative overflow-hidden rounded-3xl p-5 text-white" >
          <div className="absolute inset-0" style={{ background: "linear-gradient(140deg, oklch(0.72 0.16 40), oklch(0.68 0.17 10))" }} aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-2"><Brain className="size-5" /><h2 className="font-display text-xl">Needs more practice</h2></div>
            <div className="relative mt-4 h-14" aria-hidden>
              {[0, 1, 2].map((k) => <div key={k} className="absolute h-12 w-24 rounded-xl border border-white/50 bg-white/25 backdrop-blur cf-float" style={{ left: k * 22, top: k * -3, transform: `rotate(${(k - 1) * 7}deg)`, animationDelay: `${k * -1.5}s` }} />)}
            </div>
            {needs.length ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {needs.slice(0, 5).map((n) => <li key={n.topicId}><Link to="/learn/topics/$topicId/flashcards" params={{ topicId: n.topicId }} className="hover:underline">{byId[n.topicId]?.title} →</Link></li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-white/80">Nothing flagged right now.</p>}
            <Link to="/learn/revision" className="mt-4 inline-block rounded-full bg-white/25 px-3 py-1 text-sm hover:bg-white/35">Go to revision</Link>
          </div>
        </Reveal>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Reveal className="glass-panel rounded-3xl p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl">Assessment history</h2><DemoBadge>Preview</DemoBadge></div>
          <ul className="mt-4 space-y-3 text-sm">
            {progress.attempts.slice(0, 5).map((a) => (
              <li key={a.assessmentId}>
                <div className="flex justify-between gap-2"><span className="truncate">{a.title}</span><span className="font-mono">{a.correct}/{a.total}</span></div>
                <Meter value={a.correct} max={a.total} color={a.correct / a.total >= 0.7 ? "var(--color-success)" : a.correct / a.total >= 0.4 ? "var(--color-gold)" : "var(--color-copper)"} className="mt-1" />
              </li>
            ))}
          </ul>
          <Link to="/learn/assessments" className="mt-4 inline-block text-sm text-copper hover:underline">All assessments</Link>
        </Reveal>
        <Reveal delay={120} className="glass-dark rounded-3xl p-5">
          <div className="flex items-center gap-2"><Sparkles className="size-4 text-ember" /><h2 className="font-display text-xl">Visual learning</h2></div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tools.map((t) => (
              <Link key={t.id} to="/learn/tools/$tool" params={{ tool: t.id }} className="lift press group rounded-2xl p-3 text-sm text-white" style={{ background: TOOL_TINT[t.id] }} data-testid={`dashboard-tool-${t.id}`}>
                <span className="inline-block font-mono text-lg transition-transform group-hover:scale-125">{t.glyph}</span>
                <span className="mt-1 block leading-tight">{t.name}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
