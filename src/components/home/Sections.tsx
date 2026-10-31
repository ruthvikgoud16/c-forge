import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Check, Eye, Hammer, ListChecks, MailPlus, KeyRound, Rocket, UserPlus, X } from "lucide-react";
import { units, topics } from "@/data/fixtures/curriculum";
import { TOOL_IDS, TOOL_META } from "@/data/tools";
import { highlightC } from "@/components/common/CodeBlock";
import { UnitArt, UNIT_STYLE, unitGradient } from "@/components/art/UnitArt";
import { ToolPreview } from "@/components/art/ToolPreview";
import { MindMapPreview } from "@/components/art/MindMapPreview";
import { Reveal, useTick } from "@/components/art/motion";
import { Ring, Meter } from "@/components/art/Ring";
import { cn } from "@/lib/utils";

export function Approach() {
  const steps = [
    { n: "01", t: "Read the concept", d: "Lessons, notes and compact one-shot revision for every topic.", I: BookOpen },
    { n: "02", t: "Visualise it", d: "Mind maps and interactive tools make invisible state visible.", I: Eye },
    { n: "03", t: "Practise with purpose", d: "Guided practice, flashcards and coding exercises.", I: Hammer },
    { n: "04", t: "Check understanding", d: "Topic and unit assessments, with progress you can act on.", I: ListChecks },
  ];
  const t = useTick(2200);
  const a = t % steps.length;
  return (
    <section id="approach" className="surface-ink relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(oklch(1_0_0/.5)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-24 md:px-6">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-3 !text-ember">What is CForge?</p>
          <h2 className="font-display text-4xl leading-tight md:text-5xl">Concept first. Then see it. Then build it.</h2>
        </Reveal>
        <div className="relative mt-14">
          <svg className="absolute left-0 top-10 hidden h-4 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 4" aria-hidden>
            <line x1="5" y1="2" x2="95" y2="2" stroke="oklch(1 0 0 / .25)" strokeWidth=".6" />
            <line x1="5" y1="2" x2={5 + (a / 3) * 90} y2="2" stroke="var(--color-ember)" strokeWidth=".8" style={{ transition: "all .8s ease" }} />
          </svg>
          <ol className="relative grid gap-6 md:grid-cols-4">
            {steps.map(({ n, t: title, d, I }, i) => (
              <Reveal as="li" key={n} delay={i * 120}>
                <div className={cn("grid size-20 place-items-center rounded-3xl border transition-all duration-700", i === a ? "scale-110 border-ember bg-ember text-ink shadow-[0_0_40px_oklch(0.7_0.15_230/.6)]" : i < a ? "border-ember/50 bg-white/10" : "border-white/20 bg-white/5")}>
                  <I className="size-8" />
                </div>
                <span className="mt-5 block font-mono text-xs text-ember">{n}</span>
                <h3 className="mt-1 font-display text-xl">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function CurriculumShowcase() {
  const [sel, setSel] = useState(0);
  const u = units[sel]!;
  const ts = topics.filter((t) => t.unitId === u.id);
  return (
    <section id="curriculum" className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <Reveal>
        <p className="eyebrow mb-3">Learn systematically</p>
        <h2 className="max-w-2xl font-display text-4xl leading-tight md:text-5xl">Five official syllabus units, one connected path.</h2>
      </Reveal>
      <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div role="tablist" aria-label="Units" className="flex gap-2 overflow-x-auto lg:flex-col">
          {units.map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === sel} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} data-testid={`unit-tab-${x.id}`}
              className={cn("press group flex min-w-56 items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-300", i === sel ? "glass-panel border-white shadow-xl" : "border-transparent hover:bg-white/40")}>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl font-display text-lg text-white shadow" style={{ background: unitGradient(x.id) }}>0{x.number}</span>
              <span><span className="block font-semibold">{x.title}</span><span className="block font-mono text-[10px] text-muted-foreground">{UNIT_STYLE[x.id].motif}</span></span>
            </button>
          ))}
        </div>
        <div key={u.id} className="cf-pop glass-panel overflow-hidden rounded-3xl">
          <UnitArt unitId={u.id} number={u.number} className="h-56 rounded-none md:h-64" />
          <div className="p-6">
            <h3 className="font-display text-2xl">{u.title}</h3>
            <p className="mt-2 text-muted-foreground">{u.summary}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {ts.map((t, i) => (
                <li key={t.id} className="cf-pop rounded-full border border-white bg-white/70 px-3 py-1 text-xs" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="mr-1 font-mono text-muted-foreground">{String(t.order).padStart(2, "0")}</span>{t.title}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs text-muted-foreground">{ts.length} teaching packages · mind map · unit assessment</p>
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Plus a supplementary competitive-programming package — 31 teaching packages in total.</p>
    </section>
  );
}

export function MindMapSection() {
  const u = units[2]!;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.5fr]">
      <Reveal>
        <p className="eyebrow mb-3">Mind maps</p>
        <h2 className="font-display text-4xl leading-tight">See how every idea connects.</h2>
        <p className="mt-4 text-muted-foreground">Each unit and each topic has its own concept map. Click a topic to open its key ideas, follow the links, and jump straight into the lesson.</p>
        <ul className="mt-6 space-y-2 text-sm">
          {["Unit maps link every package in the unit", "Topic maps expand concepts and resources", "Built from the same curriculum you study"].map((x) => (
            <li key={x} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-forest text-pearl"><Check className="size-3" /></span>{x}</li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={150}><MindMapPreview unit={u} topics={topics.filter((t) => t.unitId === u.id)} className="aspect-[16/11]" /></Reveal>
    </section>
  );
}

export function VisualiserBento() {
  const big = new Set(["binary", "control-flow", "recursion", "search-sort"]);
  return (
    <section id="visualise" className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <p className="eyebrow mb-3">Interactive visualisers</p>
          <h2 className="max-w-2xl font-display text-4xl leading-tight md:text-5xl">Eight visualisers that make invisible state visible.</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">These previews are running live. Inside CForge each one takes your own input, with step, replay and reset controls.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOL_IDS.map((id, i) => (
            <Reveal key={id} delay={(i % 4) * 90} className={cn(big.has(id) && "lg:col-span-2")}>
              <Link to="/learn/tools/$tool" params={{ tool: id }} className="lift glass-panel group flex h-full flex-col rounded-3xl p-4" data-testid={`visualiser-card-${id}`}>
                <ToolPreview id={id} ms={900 + i * 120} className="min-h-32" />
                <div className="mt-4 flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-copper/10 font-mono text-sm text-copper transition-transform group-hover:rotate-6">{TOOL_META[id].glyph}</span>
                  <div><h3 className="font-semibold">{TOOL_META[id].name}</h3><p className="text-sm text-muted-foreground">{TOOL_META[id].blurb}</p></div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STUDIO_CODE = `#include <stdio.h>

int main(void) {
    int n, sum = 0;
    scanf("%d", &n);
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    printf("%d\\n", sum);
    return 0;
}`;

export function StudioShowcase() {
  const t = useTick(700);
  const phase = t % 10;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:px-6 lg:grid-cols-[1.3fr_1fr]">
      <Reveal className="glass-dark overflow-hidden rounded-3xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] text-white/60">digit_sum.c</span>
          <span className={cn("ml-auto rounded-full px-2 py-0.5 font-mono text-[10px]", phase < 3 ? "bg-white/10 text-white/60" : "bg-forest/80 text-white")}>{phase < 3 ? "compiling…" : "compiled · simulated"}</span>
        </div>
        <pre className="px-5 py-4 font-mono text-[12.5px] leading-6 text-code-foreground"><code>{highlightC(STUDIO_CODE)}</code></pre>
        <div className="grid grid-cols-4 gap-2 border-t border-white/10 p-4">
          {[1, 2, 3, 4].map((k) => {
            const done = phase >= 3 + k;
            return (
              <div key={k} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-[11px] transition-all duration-500", done ? "bg-forest/80 text-white" : "bg-white/5 text-white/40")}>
                {done ? <Check className="size-3.5" /> : <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />} test {k}
              </div>
            );
          })}
        </div>
      </Reveal>
      <Reveal delay={150}>
        <p className="eyebrow mb-3">Coding practice</p>
        <h2 className="font-display text-4xl leading-tight">A focused studio for writing real C.</h2>
        <p className="mt-4 text-muted-foreground">Read the problem, write your solution, run it against sample input and submit to hidden tests. Compiler feedback and test results appear right beside your code.</p>
        <p className="mt-4 inline-flex rounded-full bg-warning/15 px-3 py-1 text-xs">Execution is simulated until the secure CForge judge is connected.</p>
      </Reveal>
    </section>
  );
}

export function AssessmentShowcase() {
  const t = useTick(1100);
  const phase = t % 6;
  const opts = ["5", "6", "7", "Compilation error"];
  return (
    <section className="surface-ink relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:px-6 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="eyebrow mb-3 !text-ember">Assessments</p>
          <h2 className="font-display text-4xl leading-tight">Check understanding, then act on it.</h2>
          <p className="mt-4 text-muted-foreground">Topic and unit assessments mix single-choice, true/false and predict-the-output questions. After each attempt you see which answers were right, and which topics to revise.</p>
          <div className="mt-8 flex items-center gap-6">
            <Ring value={phase >= 4 ? 8 : 0} max={10} size={110} color="var(--color-ember)" track="oklch(1 0 0 / .12)"><span className="font-display text-2xl">{phase >= 4 ? "8/10" : "–"}</span></Ring>
            <p className="max-w-48 text-sm text-muted-foreground">Results are shown question by question, with the correct answer.</p>
          </div>
        </Reveal>
        <Reveal delay={150} className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between font-mono text-xs text-white/60"><span>Question 3 / 10</span><span className="rounded-full bg-white/10 px-2 py-0.5">Predict the output</span></div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[30%] bg-ember" /></div>
          <pre className="mt-5 rounded-xl bg-black/30 p-4 font-mono text-[12px] leading-6 text-code-foreground">{highlightC("int x = 5;\nprintf(\"%d\", x++ + 1);")}</pre>
          <div className="mt-4 space-y-2">
            {opts.map((o, i) => {
              const picked = phase >= 2 && i === 1;
              const reveal = phase >= 3;
              return (
                <div key={o} className={cn("flex items-center justify-between rounded-xl border px-4 py-2.5 font-mono text-sm transition-all duration-500", reveal && i === 1 ? "border-forest bg-forest/40" : picked ? "border-ember bg-ember/20" : "border-white/15")}>
                  {o}{reveal && i === 1 && <Check className="size-4" />}{reveal && i === 2 && <X className="size-4 opacity-40" />}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ProgressShowcase() {
  const sample = [["unit-1", 8, 10], ["unit-2", 4, 6], ["unit-3", 2, 5], ["unit-4", 1, 6], ["unit-5", 0, 3]] as const;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:px-6 lg:grid-cols-[1.2fr_1fr]">
      <Reveal className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between"><p className="eyebrow">Your progress</p><span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px]">Example data</span></div>
        <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <Ring value={15} max={31} size={140} stroke={14}><span><span className="block font-display text-3xl">15</span><span className="text-[10px] text-muted-foreground">of 31 packages</span></span></Ring>
          <ul className="space-y-3">
            {sample.map(([id, d, n]) => (
              <li key={id}>
                <div className="mb-1 flex justify-between text-xs"><span>{units.find((u) => u.id === id)!.shortTitle}</span><span className="font-mono text-muted-foreground">{d}/{n}</span></div>
                <Meter value={d} max={n} color={unitGradient(id)} />
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <Reveal delay={150}>
        <p className="eyebrow mb-3">Track your progress</p>
        <h2 className="font-display text-4xl leading-tight">Know what you've mastered, and what's next.</h2>
        <p className="mt-4 text-muted-foreground">See what you've demonstrated, mastered and what needs more practice, with recommendations for what to revise next.</p>
      </Reveal>
    </section>
  );
}

export function CohortFlow() {
  const steps = [
    { I: UserPlus, t: "Faculty adds you", d: "Your roll number is placed on the approved roster." },
    { I: MailPlus, t: "You get an invitation", d: "A personal link, bound to your roll number." },
    { I: KeyRound, t: "You set your password", d: "Only you know it. Faculty never see it." },
    { I: Rocket, t: "Learning starts", d: "Your dashboard, path and progress are ready." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
      <Reveal><p className="eyebrow mb-3">Built for engineering students</p><h2 className="max-w-2xl font-display text-4xl leading-tight">An invitation-based cohort.</h2></Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {steps.map(({ I, t, d }, i) => (
          <Reveal key={t} delay={i * 110} className="lift glass-panel relative rounded-3xl p-5">
            <span className="grid size-12 place-items-center rounded-2xl text-white shadow" style={{ background: unitGradient(units[i]!.id) }}><I className="size-5" /></span>
            <h3 className="mt-4 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p>
            {i < 3 && <span className="absolute -right-3 top-1/2 z-10 hidden font-mono text-copper md:block">→</span>}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
