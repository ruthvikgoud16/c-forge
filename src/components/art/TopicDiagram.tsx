import { useEffect, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import type { Topic } from "@/domain/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { bubbleStates } from "./ToolPreview";
import { useReducedMotion } from "./motion";

function useStepper(total: number, ms = 1300) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!playing || reduced) return;
    const id = window.setInterval(() => setI((x) => (x + 1 >= total ? (setPlaying(false), x) : x + 1)), ms);
    return () => window.clearInterval(id);
  }, [playing, total, ms, reduced]);
  return { i, playing, step: () => setI((x) => Math.min(total - 1, x + 1)), reset: () => { setI(0); setPlaying(false); }, toggle: () => { if (i >= total - 1) setI(0); setPlaying((p) => !p); } };
}

function Controls({ s, total, caption }: { s: ReturnType<typeof useStepper>; total: number; caption: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button size="sm" variant="hero" className="press" onClick={s.toggle} data-testid="diagram-play">{s.playing ? <Pause /> : <Play />}{s.playing ? "Pause" : "Play"}</Button>
      <Button size="sm" variant="quiet" className="press" onClick={s.step} disabled={s.i >= total - 1} data-testid="diagram-step"><StepForward /> Step</Button>
      <Button size="sm" variant="quiet" className="press" onClick={s.reset} data-testid="diagram-reset"><RotateCcw /> Reset</Button>
      <span className="font-mono text-xs text-muted-foreground">step {s.i + 1}/{total}</span>
      <p key={s.i} className="cf-pop w-full rounded-xl bg-foreground/5 px-3 py-2 text-sm">{caption}</p>
    </div>
  );
}

function BinaryDiagram() {
  const [n, setN] = useState(45);
  const bits = Array.from({ length: 8 }, (_, i) => (n >> (7 - i)) & 1);
  const terms = bits.map((b, i) => (b ? 1 << (7 - i) : 0)).filter(Boolean);
  return (
    <div>
      <div className="grid grid-cols-8 gap-1.5">
        {bits.map((b, i) => (
          <button key={i} type="button" onClick={() => setN(n ^ (1 << (7 - i)))} aria-label={`Bit ${7 - i}, value ${b}. Click to flip`} data-testid={`bit-${7 - i}`}
            className={cn("press rounded-xl border py-3 text-center transition-all duration-300", b ? "border-copper bg-copper text-pearl shadow-lg" : "border-border bg-white/60")}>
            <span className="block font-mono text-xl font-bold">{b}</span>
            <span className={cn("block font-mono text-[10px]", b ? "text-pearl/80" : "text-muted-foreground")}>2^{7 - i}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-sm">{terms.length ? terms.join(" + ") : "0"} = <b className="text-copper">{n}</b>₁₀ · 0x{n.toString(16).toUpperCase()}</p>
      <input type="range" min={0} max={255} value={n} onChange={(e) => setN(+e.target.value)} className="mt-3 w-full accent-[var(--copper)]" aria-label="Decimal value" />
      <p className="mt-1 text-xs text-muted-foreground">Click any bit to flip it, or drag to change the decimal value.</p>
    </div>
  );
}

function ChainDiagram({ steps }: { steps: [string, string][] }) {
  const s = useStepper(steps.length);
  return (
    <div>
      <div className="relative flex flex-col gap-3 md:flex-row md:items-stretch">
        {steps.map(([t], k) => (
          <div key={t} className="flex flex-1 items-center gap-2 md:flex-col">
            <div className={cn("w-full rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition-all duration-500", k === s.i ? "scale-105 border-copper bg-copper text-pearl shadow-lg" : k < s.i ? "border-copper/40 bg-accent text-foreground" : "border-border bg-white/60 text-muted-foreground")}>
              <span className="block font-mono text-[10px] opacity-70">{String(k + 1).padStart(2, "0")}</span>{t}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/8"><div className="h-full bg-copper transition-all duration-700" style={{ width: `${((s.i + 1) / steps.length) * 100}%` }} /></div>
      <Controls s={s} total={steps.length} caption={steps[s.i]![1]} />
    </div>
  );
}

function LoopDiagram() {
  const states: { i: number; phase: "check" | "body" | "update" | "exit" }[] = [];
  for (let i = 0; i < 4; i++) states.push({ i, phase: "check" }, { i, phase: "body" }, { i, phase: "update" });
  states.push({ i: 4, phase: "check" }, { i: 4, phase: "exit" });
  const s = useStepper(states.length, 900);
  const cur = states[s.i]!;
  const sum = Array.from({ length: cur.i }, (_, k) => k).reduce((a, b) => a + b, 0) + (cur.phase === "update" ? cur.i : 0);
  const parts = [["check", "i < 4"], ["body", "sum += i"], ["update", "i++"]] as const;
  return (
    <div>
      <div className="glass-dark rounded-2xl p-4 font-mono text-sm">
        for (int i = 0; {parts.map(([p, label], k) => (
          <span key={p}><span className={cn("rounded px-1 transition-colors", cur.phase === p ? "bg-ember text-ink" : "")}>{label}</span>{k === 0 ? "; " : k === 2 ? ") " : ""}</span>
        ))}{"{ "}<span className={cn("rounded px-1", cur.phase === "body" ? "bg-ember text-ink" : "")}>sum += i;</span>{" }"}
      </div>
      <div className="mt-4 flex gap-2">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className={cn("grid flex-1 place-items-center rounded-xl py-3 font-mono text-sm transition-all duration-500", k < cur.i ? "bg-forest text-pearl" : k === cur.i && cur.phase !== "exit" ? "scale-105 bg-copper text-pearl shadow-lg" : "bg-white/60 text-muted-foreground")}>iter {k + 1}</div>
        ))}
        <div className={cn("grid flex-1 place-items-center rounded-xl py-3 font-mono text-sm transition-all", cur.phase === "exit" ? "bg-ink text-ink-foreground" : "bg-white/40 text-muted-foreground")}>exit</div>
      </div>
      <Controls s={s} total={states.length} caption={<span className="font-mono">i = {cur.i} · sum = {sum} · {cur.phase === "check" ? `checking ${cur.i} < 4 → ${cur.i < 4}` : cur.phase === "body" ? "running the loop body" : cur.phase === "update" ? "updating i++" : "condition false, loop ends"}</span>} />
    </div>
  );
}

function MemoryDiagram() {
  const a = [12, 7, 31, 4, 19, 25];
  const s = useStepper(a.length + 1, 1000);
  const max = a.slice(0, s.i).reduce((m, v) => Math.max(m, v), -Infinity);
  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {a.map((v, k) => (
          <div key={k} className="min-w-14 flex-1 text-center">
            <div className={cn("rounded-xl border py-3 font-mono text-lg font-bold transition-all duration-500", k === s.i - 1 ? "-translate-y-2 border-copper bg-copper text-pearl shadow-lg" : k < s.i ? "border-copper/40 bg-accent" : "border-border bg-white/60")}>{v}</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">a[{k}]</div>
            <div className="font-mono text-[9px] text-muted-foreground/70">0x{(0x1000 + k * 4).toString(16)}</div>
          </div>
        ))}
      </div>
      <Controls s={s} total={a.length + 1} caption={<span className="font-mono">{s.i === 0 ? "int a[6]: six ints, 4 bytes apart in memory" : `visit a[${s.i - 1}] = ${a[s.i - 1]} at 0x${(0x1000 + (s.i - 1) * 4).toString(16)} · max so far = ${max}`}</span>} />
    </div>
  );
}

function StackDiagram() {
  const N = 4;
  const states = [...Array.from({ length: N + 1 }, (_, d) => ({ depth: d, ret: null as number | null })), ...Array.from({ length: N }, (_, k) => { const d = N - 1 - k; let f = 1; for (let x = 1; x <= N - d; x++) f *= x; return { depth: d, ret: f }; })];
  const s = useStepper(states.length, 1000);
  const cur = states[s.i]!;
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <div className="flex min-h-56 flex-col-reverse gap-1.5 rounded-2xl bg-foreground/5 p-3">
        <div className="rounded-lg bg-ink px-3 py-1.5 font-mono text-xs text-ink-foreground">main()</div>
        {Array.from({ length: cur.depth }, (_, k) => (
          <div key={k} className={cn("cf-pop rounded-lg px-3 py-1.5 font-mono text-xs", k === cur.depth - 1 ? "bg-copper text-pearl shadow-lg" : "bg-white/80")}>fact({N - k}) {k === cur.depth - 1 && cur.ret !== null && <span className="float-right">↩ {cur.ret}</span>}</div>
        ))}
      </div>
      <div className="glass-dark rounded-2xl p-4 font-mono text-[12px] leading-6">
        <p>int fact(int n) {"{"}</p><p className={cn("pl-4", cur.ret === null && cur.depth === N ? "rounded bg-ember/30" : "")}>if (n &lt;= 1) return 1;</p><p className={cn("pl-4", cur.ret === null && cur.depth < N ? "rounded bg-ember/30" : cur.ret !== null ? "rounded bg-forest/40" : "")}>return n * fact(n - 1);</p><p>{"}"}</p>
      </div>
      <div className="md:col-span-2"><Controls s={s} total={states.length} caption={<span className="font-mono">{cur.ret === null ? (cur.depth === 0 ? "main calls fact(4)" : cur.depth === N ? "base case reached: fact(1) returns 1" : `push frame fact(${N - cur.depth + 1})`) : `pop: frame returns ${cur.ret}`}</span>} /></div>
    </div>
  );
}

function SortDiagram() {
  const states = bubbleStates([6, 3, 8, 2, 7, 4]);
  const s = useStepper(states.length, 800);
  const cur = states[s.i]!;
  return (
    <div>
      <div className="flex h-44 items-end gap-2 rounded-2xl bg-foreground/5 p-3">
        {cur.arr.map((v, k) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className={cn("w-full rounded-t-lg transition-all duration-500", k === cur.i || k === cur.j ? (cur.swapped ? "bg-copper" : "bg-gold") : "bg-forest/60")} style={{ height: `${v * 16}px` }} />
            <span className="font-mono text-xs">{v}</span>
          </div>
        ))}
      </div>
      <Controls s={s} total={states.length} caption={<span className="font-mono">{cur.i < 0 ? "bubble sort: compare neighbours, swap if out of order" : `compare a[${cur.i}] and a[${cur.j}] → ${cur.swapped ? "swap" : "already in order"}`}</span>} />
    </div>
  );
}

function AnatomyDiagram() {
  const lines: [string, string, string][] = [
    ["#include <stdio.h>", "Preprocessor", "Pulls in printf/scanf declarations before compiling."],
    ["int main(void) {", "Entry point", "Execution starts here. Returns an int status."],
    ["    int marks = 82;", "Declaration", "Reserves memory for a variable and gives it a value."],
    ["    printf(\"%d\\n\", marks);", "Statement", "A function call that prints formatted output."],
    ["    return 0;", "Return", "0 tells the operating system the program succeeded."],
    ["}", "Block end", "Closes the body of main."],
  ];
  const [a, setA] = useState(1);
  return (
    <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
      <div className="glass-dark rounded-2xl p-3 font-mono text-[12.5px]">
        {lines.map(([l], k) => (
          <button key={k} type="button" onMouseEnter={() => setA(k)} onFocus={() => setA(k)} onClick={() => setA(k)} data-testid={`anatomy-line-${k}`}
            className={cn("block w-full rounded px-2 py-1 text-left whitespace-pre transition-colors", k === a ? "bg-ember/25 text-white" : "text-white/70 hover:bg-white/5")}>{l}</button>
        ))}
      </div>
      <div key={a} className="cf-pop rounded-2xl border border-copper/40 bg-accent p-4">
        <p className="eyebrow">{lines[a]![1]}</p>
        <p className="mt-2 text-sm">{lines[a]![2]}</p>
        <p className="mt-3 text-xs text-muted-foreground">Hover or tap each line of the program.</p>
      </div>
    </div>
  );
}

function BlockDiagram() {
  const flow = [["Input", "Keyboard data enters the system."], ["Memory", "Data is stored in RAM."], ["CPU · CU", "The control unit fetches and decodes the instruction."], ["CPU · ALU", "The ALU performs the arithmetic or logic."], ["Memory", "The result is written back."], ["Output", "The result is shown on screen."]] as [string, string][];
  const s = useStepper(flow.length, 1100);
  const active = flow[s.i]![0];
  const box = (label: string, x: number, y: number, w = 110) => (
    <g>
      <rect x={x} y={y} width={w} height="44" rx="12" fill={active === label ? "var(--color-copper)" : "white"} stroke="var(--color-copper)" strokeWidth="1.5" style={{ transition: "fill .4s" }} />
      <text x={x + w / 2} y={y + 27} textAnchor="middle" fontSize="13" fontWeight="600" fill={active === label ? "white" : "oklch(0.25 0.02 260)"}>{label}</text>
    </g>
  );
  return (
    <div>
      <svg viewBox="0 0 560 200" className="w-full rounded-2xl bg-foreground/5">
        {[["M120 100 H170"], ["M280 100 H330"], ["M440 100 H470"], ["M225 78 V50"], ["M385 78 V50"]].map(([d]) => <path key={d} d={d} stroke="var(--color-copper)" strokeWidth="2" className="cf-dash" fill="none" />)}
        {box("Input", 10, 78)}{box("Memory", 170, 78)}{box("Output", 470, 78, 80)}
        <rect x="330" y="68" width="110" height="64" rx="14" fill="none" stroke="var(--color-forest)" strokeDasharray="4 4" />
        {box("CPU · CU", 170, 6)}{box("CPU · ALU", 330, 6)}
        <text x="385" y="150" textAnchor="middle" fontSize="11" fill="var(--color-forest)">processor</text>
      </svg>
      <Controls s={s} total={flow.length} caption={flow[s.i]![1]} />
    </div>
  );
}

const ALGO_STEPS: [string, string][] = [["Start", "Every algorithm has a single, clear starting point."], ["Input", "Read the values the problem needs, e.g. a, b and c."], ["Decide", "Compare: is a greater than b and c? The diamond symbol branches."], ["Process", "Assign the largest value to max."], ["Output", "Print max."], ["Stop", "The algorithm ends after a finite number of steps."]];
const PREC_STEPS: [string, string][] = [["2 + 3 * 4 - 1", "Start with the full expression."], ["3 * 4 → 12", "* has higher precedence than + and -."], ["2 + 12 → 14", "+ and - are equal; associativity is left to right."], ["14 - 1 → 13", "Evaluate the remaining subtraction."], ["= 13", "Final value of the expression."]];

/** Picks an interactive explanatory diagram that matches the topic. */
export function TopicDiagram({ topic, className }: { topic: Topic; className?: string }) {
  const tool = topic.tools[0];
  let body: ReactNode; let title: string;
  if (topic.id === "computer-system") { body = <BlockDiagram />; title = "How data moves through a computer"; }
  else if (topic.id === "precedence-associativity") { body = <ChainDiagram steps={PREC_STEPS} />; title = "Evaluate an expression step by step"; }
  else if (tool === "binary") { body = <BinaryDiagram />; title = "Bit positions and place values"; }
  else if (tool === "algorithm" || tool === "flowchart") { body = <ChainDiagram steps={ALGO_STEPS} />; title = "An algorithm as connected steps"; }
  else if (tool === "control-flow") { body = <LoopDiagram />; title = "Watch control flow, one step at a time"; }
  else if (tool === "array-string") { body = <MemoryDiagram />; title = "Indexed memory cells"; }
  else if (tool === "recursion") { body = <StackDiagram />; title = "Calls push frames, returns pop them"; }
  else if (tool === "search-sort") { body = <SortDiagram />; title = "Sorting, comparison by comparison"; }
  else { body = <AnatomyDiagram />; title = "Anatomy of a C program"; }
  return (
    <section className={cn("glass-panel rounded-3xl p-5 md:p-6", className)} data-testid="topic-diagram">
      <p className="eyebrow">See it</p>
      <h2 className="mb-4 mt-1 font-display text-xl">{title}</h2>
      {body}
    </section>
  );
}
