import { useState } from "react";
import type { Topic, Unit } from "@/domain/types";
import { cn } from "@/lib/utils";
import { unitGradient } from "./UnitArt";

/** Interactive concept map built from real curriculum data: click a topic to expand its concepts. */
export function MindMapPreview({ unit, topics, className }: { unit: Unit; topics: Topic[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(topics[0]?.id ?? null);
  const [hover, setHover] = useState<string | null>(null);
  const W = 640, H = 420, cx = W / 2, cy = H / 2, R = 150;
  const pos = topics.map((t, i) => {
    const a = (i / topics.length) * Math.PI * 2 - Math.PI / 2;
    return { t, x: cx + Math.cos(a) * R * 1.25, y: cy + Math.sin(a) * R, a };
  });
  const sel = pos.find((p) => p.t.id === open);
  const concepts = sel ? sel.t.concepts.slice(0, 4).map((c, i, arr) => {
    const spread = (i - (arr.length - 1) / 2) * 0.42;
    const a = sel.a + spread;
    return { c, x: sel.x + Math.cos(a) * 92, y: sel.y + Math.sin(a) * 70 };
  }) : [];
  return (
    <div className={cn("relative overflow-hidden rounded-3xl glass-panel", className)} data-testid="mindmap-preview">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`Concept map for ${unit.title}`}>
        <defs>
          <linearGradient id="mm-core" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="oklch(0.66 0.17 250)" /><stop offset="1" stopColor="oklch(0.74 0.13 210)" /></linearGradient>
        </defs>
        {pos.map((p) => (
          <line key={p.t.id} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-copper)" strokeOpacity={hover === p.t.id || open === p.t.id ? 0.9 : 0.25} strokeWidth={open === p.t.id ? 3 : 2} className={open === p.t.id ? "cf-dash" : ""} style={{ transition: "stroke-opacity .3s" }} />
        ))}
        {concepts.map(({ c, x, y }) => (
          <g key={c.term} className="cf-pop">
            <line x1={sel!.x} y1={sel!.y} x2={x} y2={y} stroke="var(--color-forest)" strokeOpacity=".7" strokeWidth="1.5" />
            <rect x={x - 58} y={y - 13} width="116" height="26" rx="13" fill="oklch(0.97 0.03 160)" stroke="var(--color-forest)" strokeWidth="1.2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fill="oklch(0.35 0.08 160)">{c.term.length > 20 ? c.term.slice(0, 19) + "…" : c.term}</text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r="58" fill="url(#mm-core)" className="cf-pulse" style={{ animationDuration: "4s" }} opacity=".25" />
        <circle cx={cx} cy={cy} r="48" fill="url(#mm-core)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fill="white" fontWeight="700">Unit {unit.number}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="white">{unit.shortTitle}</text>
        {pos.map((p, i) => {
          const on = open === p.t.id;
          const label = p.t.title.length > 22 ? p.t.title.slice(0, 21) + "…" : p.t.title;
          return (
            <g key={p.t.id} role="button" tabIndex={0} aria-label={`Expand ${p.t.title}`} aria-pressed={on}
              onClick={() => setOpen(on ? null : p.t.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(on ? null : p.t.id); } }}
              onMouseEnter={() => setHover(p.t.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer outline-none" data-testid={`mindmap-node-${p.t.id}`}>
              <g className="cf-float" style={{ animationDelay: `${i * -0.8}s`, animationDuration: "7s" }}>
                <rect x={p.x - 74} y={p.y - 17} width="148" height="34" rx="17" fill={on ? "var(--color-copper)" : "white"} stroke="var(--color-copper)" strokeWidth={hover === p.t.id ? 2.5 : 1.2} style={{ transition: "fill .3s" }} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill={on ? "white" : "oklch(0.25 0.02 260)"} fontWeight="600">{label}</text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="absolute left-4 top-4 rounded-full px-3 py-1 font-mono text-[10px] text-white" style={{ background: unitGradient(unit.id) }}>click a topic to expand</div>
    </div>
  );
}
