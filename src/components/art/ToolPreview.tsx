import type { ToolId } from "@/domain/types";
import { useTick } from "./motion";
import { cn } from "@/lib/utils";

const mono = "font-mono text-[11px]";

export function bubbleStates(start: number[]) {
  const a = [...start];
  const out: { arr: number[]; i: number; j: number; swapped: boolean }[] = [{ arr: [...a], i: -1, j: -1, swapped: false }];
  for (let p = 0; p < a.length - 1; p++)
    for (let k = 0; k < a.length - 1 - p; k++) {
      const sw = a[k]! > a[k + 1]!;
      if (sw) [a[k], a[k + 1]] = [a[k + 1]!, a[k]!];
      out.push({ arr: [...a], i: k, j: k + 1, swapped: sw });
    }
  return out;
}
const SORT = bubbleStates([5, 2, 8, 3, 9, 1, 6]);

function Syntax({ t }: { t: number }) {
  const lines = [["#include <stdio.h>", "preprocessor"], ["int main(void) {", "entry point"], ["  int n = 5;", "declaration"], ["  printf(\"%d\", n);", "statement"], ["  return 0; }", "exit status"]];
  const a = t % lines.length;
  return (
    <div className="space-y-1">
      {lines.map(([l, tag], i) => (
        <div key={i} className={cn("flex items-center justify-between rounded px-2 py-0.5 transition-colors duration-500", mono, i === a ? "bg-white/20 text-white" : "text-white/55")}>
          <span>{l}</span>{i === a && <span className="cf-pop rounded bg-white/30 px-1.5 text-[9px] uppercase tracking-wider">{tag}</span>}
        </div>
      ))}
    </div>
  );
}

function Binary({ t }: { t: number }) {
  const n = (t * 37 + 11) % 256;
  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => {
          const bit = (n >> (7 - i)) & 1;
          return (
            <div key={i} className="flex-1 text-center">
              <div className={cn("rounded-md py-1.5 font-mono text-sm font-bold transition-all duration-500", bit ? "bg-white text-[oklch(0.45_0.17_250)] shadow" : "bg-white/15 text-white/70")}>{bit}</div>
              <div className="mt-0.5 font-mono text-[9px] text-white/60">{1 << (7 - i)}</div>
            </div>
          );
        })}
      </div>
      <p className={cn("mt-2 text-white", mono)}>= <span className="text-base font-bold">{n}</span> decimal · 0x{n.toString(16).toUpperCase().padStart(2, "0")}</p>
    </div>
  );
}

function Algorithm({ t }: { t: number }) {
  const steps = ["Start", "Read a,b", "a > b ?", "Print max", "Stop"];
  const a = t % steps.length;
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1">
          <div className={cn("w-full rounded-lg px-1 py-2 text-center text-[10px] font-semibold transition-all duration-500", i === a ? "scale-110 bg-white text-[oklch(0.45_0.15_160)] shadow-lg" : i < a ? "bg-white/40 text-white" : "bg-white/15 text-white/70")}>{s}</div>
          {i < steps.length - 1 && <span className={cn("text-xs", i < a ? "text-white" : "text-white/40")}>→</span>}
        </div>
      ))}
    </div>
  );
}

function Flowchart({ t }: { t: number }) {
  const yes = t % 2 === 0;
  return (
    <svg viewBox="0 0 220 110" className="w-full">
      <rect x="85" y="2" width="50" height="18" rx="9" fill="oklch(1 0 0 / .9)" />
      <text x="110" y="14" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">start</text>
      <line x1="110" y1="20" x2="110" y2="32" stroke="white" strokeWidth="2" />
      <path d="M110 32 L138 52 L110 72 L82 52Z" fill="oklch(1 0 0 / .25)" stroke="white" strokeWidth="2" />
      <text x="110" y="55" textAnchor="middle" fontSize="9" fill="white" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">n%2==0</text>
      <path d="M82 52 H30 V88" fill="none" stroke="white" strokeOpacity={yes ? 1 : 0.3} strokeWidth="2" className={yes ? "cf-dash" : ""} />
      <path d="M138 52 H190 V88" fill="none" stroke="white" strokeOpacity={yes ? 0.3 : 1} strokeWidth="2" className={yes ? "" : "cf-dash"} />
      <rect x="5" y="88" width="50" height="18" rx="4" fill={yes ? "white" : "oklch(1 0 0 / .2)"} style={{ transition: "fill .4s" }} />
      <rect x="165" y="88" width="50" height="18" rx="4" fill={yes ? "oklch(1 0 0 / .2)" : "white"} style={{ transition: "fill .4s" }} />
      <text x="30" y="100" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">even</text>
      <text x="190" y="100" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">odd</text>
    </svg>
  );
}

function ControlFlow({ t }: { t: number }) {
  const i = t % 6;
  return (
    <div>
      <p className={cn("text-white", mono)}>for (i = 0; <span className={i < 5 ? "text-white" : "text-white/60 line-through"}>i &lt; 5</span>; i++)</p>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 5 }, (_, k) => (
          <div key={k} className={cn("grid h-9 flex-1 place-items-center rounded-md font-mono text-xs font-bold transition-all duration-500", k < i ? "bg-white/45 text-white" : k === i ? "scale-110 bg-white text-[oklch(0.52_0.17_40)] shadow-lg" : "bg-white/12 text-white/50")}>i={k}</div>
        ))}
      </div>
      <p className={cn("mt-2 text-white/80", mono)}>{i < 5 ? `iteration ${i + 1}: condition true → body runs` : "i = 5: condition false → loop exits"}</p>
    </div>
  );
}

function ArrayString({ t }: { t: number }) {
  const a = [4, 8, 15, 16, 23, 42];
  const i = t % a.length;
  const sum = a.slice(0, i + 1).reduce((x, y) => x + y, 0);
  return (
    <div>
      <div className="flex gap-1">
        {a.map((v, k) => (
          <div key={k} className="flex-1 text-center">
            <div className={cn("rounded-md py-1.5 font-mono text-sm font-bold transition-all duration-500", k === i ? "-translate-y-1 bg-white text-[oklch(0.48_0.12_170)] shadow-lg" : k < i ? "bg-white/40 text-white" : "bg-white/15 text-white/70")}>{v}</div>
            <div className="mt-0.5 font-mono text-[9px] text-white/60">[{k}]</div>
          </div>
        ))}
      </div>
      <p className={cn("mt-2 text-white", mono)}>sum += a[{i}] → <b>{sum}</b></p>
    </div>
  );
}

function Recursion({ t }: { t: number }) {
  const phase = t % 9;
  const depth = phase <= 4 ? phase : 8 - phase;
  const returning = phase > 4;
  return (
    <div className="flex h-full flex-col-reverse gap-1">
      {Array.from({ length: depth + 1 }, (_, k) => (
        <div key={k} className={cn("cf-pop rounded-md px-2 py-1 font-mono text-[11px] transition-all", k === depth ? "bg-white font-bold text-[oklch(0.45_0.16_270)] shadow" : "bg-white/25 text-white")}>
          {k === 0 ? "main()" : `fact(${5 - k})`}{k === depth && <span className="float-right">{returning ? "↩ return" : "→ call"}</span>}
        </div>
      ))}
    </div>
  );
}

function SearchSort({ t }: { t: number }) {
  const s = SORT[t % SORT.length]!;
  return (
    <div>
      <div className="flex h-20 items-end gap-1">
        {s.arr.map((v, k) => (
          <div key={k} className={cn("flex-1 rounded-t-md transition-all duration-500", k === s.i || k === s.j ? (s.swapped ? "bg-white" : "bg-white/80") : "bg-white/30")} style={{ height: `${v * 10}%` }} />
        ))}
      </div>
      <p className={cn("mt-2 text-white", mono)}>{s.i < 0 ? "bubble sort · start" : `compare a[${s.i}], a[${s.j}] ${s.swapped ? "→ swap" : "→ keep"}`}</p>
    </div>
  );
}

const MAP: Record<ToolId, (p: { t: number }) => React.JSX.Element> = { syntax: Syntax, binary: Binary, algorithm: Algorithm, flowchart: Flowchart, "control-flow": ControlFlow, "array-string": ArrayString, recursion: Recursion, "search-sort": SearchSort };

export const TOOL_TINT: Record<ToolId, string> = {
  syntax: "linear-gradient(135deg, oklch(0.32 0.03 260), oklch(0.22 0.02 260))",
  binary: "linear-gradient(135deg, oklch(0.66 0.17 250), oklch(0.74 0.13 215))",
  algorithm: "linear-gradient(135deg, oklch(0.7 0.15 160), oklch(0.72 0.12 195))",
  flowchart: "linear-gradient(135deg, oklch(0.68 0.15 285), oklch(0.7 0.14 245))",
  "control-flow": "linear-gradient(135deg, oklch(0.76 0.15 55), oklch(0.72 0.17 25))",
  "array-string": "linear-gradient(135deg, oklch(0.72 0.13 170), oklch(0.68 0.12 215))",
  recursion: "linear-gradient(135deg, oklch(0.62 0.16 275), oklch(0.68 0.15 320))",
  "search-sort": "linear-gradient(135deg, oklch(0.72 0.17 355), oklch(0.78 0.15 50))",
};

/** Small live animation that previews what each visualiser does. */
export function ToolPreview({ id, ms = 1100, className }: { id: ToolId; ms?: number; className?: string }) {
  const t = useTick(ms);
  const C = MAP[id];
  return <div className={cn("rounded-xl p-3", className)} style={{ background: TOOL_TINT[id] }} aria-hidden><C t={t} /></div>;
}
