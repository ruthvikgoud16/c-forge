import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Maximize } from "lucide-react";
import type { MindMap, MindMapNode } from "@/domain/types";
import { Button } from "@/components/ui/button";

type P = { x: number; y: number; a: number };

function layout(map: MindMap) {
  const children: Record<string, string[]> = {};
  map.edges.forEach((e) => (children[e.from] ??= []).push(e.to));
  const pos: Record<string, P> = { root: { x: 0, y: 0, a: 0 } };
  const l1 = children['root'] ?? [];
  const hasL2 = l1.some((id) => children[id]?.length);
  const R1 = hasL2 ? 260 : 220;
  l1.forEach((id, i) => {
    const a = (i / l1.length) * Math.PI * 2 - Math.PI / 2;
    pos[id] = { x: Math.cos(a) * R1, y: Math.sin(a) * R1, a };
    const kids = children[id] ?? [];
    const spread = Math.min(Math.PI / l1.length, 0.9);
    kids.forEach((k, j) => {
      const ka = a + (kids.length === 1 ? 0 : -spread / 2 + (spread * j) / (kids.length - 1));
      pos[k] = { x: Math.cos(ka) * (R1 + 190), y: Math.sin(ka) * (R1 + 190), a: ka };
    });
  });
  const pts = Object.values(pos);
  const pad = 140;
  const minX = Math.min(...pts.map((p) => p.x)) - pad, maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - 60, maxY = Math.max(...pts.map((p) => p.y)) + 60;
  return { pos, box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
}

function wrap(label: string, max = 18) {
  const words = label.split(" ");
  const lines: string[] = [];
  let cur = "";
  words.forEach((w) => { if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

const KIND: Record<MindMapNode["kind"], string> = {
  root: "fill-ink stroke-ember",
  topic: "fill-copper stroke-copper",
  concept: "fill-card stroke-border",
  resource: "fill-forest stroke-forest",
};
const TEXT: Record<MindMapNode["kind"], string> = { root: "fill-ink-foreground", topic: "fill-pearl", concept: "fill-foreground", resource: "fill-pearl" };

export function MindMapView({ map }: { map: MindMap }) {
  const { pos, box } = useMemo(() => layout(map), [map]);
  const [zoom, setZoom] = useState(1);
  const [sel, setSel] = useState<MindMapNode>(map.nodes[0]!);
  const vw = box.w / zoom, vh = box.h / zoom;
  const cx = (pos[sel.id]?.x ?? 0), cy = (pos[sel.id]?.y ?? 0);
  const vb = zoom === 1 ? `${box.x} ${box.y} ${box.w} ${box.h}` : `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-1">
        <div className="absolute inset-0 grid-paper opacity-60" aria-hidden />
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          <Button size="icon" variant="quiet" className="bg-card" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z * 1.4))}><Plus /></Button>
          <Button size="icon" variant="quiet" className="bg-card" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z / 1.4))}><Minus /></Button>
          <Button size="icon" variant="quiet" className="bg-card" aria-label="Fit to view" onClick={() => setZoom(1)}><Maximize /></Button>
        </div>
        <svg viewBox={vb} className="relative h-[60vh] min-h-96 w-full transition-all" role="group" aria-label={`Mind map: ${map.title}`}>
          {map.edges.map((e) => {
            const a = pos[e.from], b = pos[e.to];
            if (!a || !b) return null;
            const active = sel.id === e.from || sel.id === e.to;
            return <path key={e.from + e.to} d={`M${a.x},${a.y} Q${(a.x + b.x) / 2 + (b.y - a.y) * 0.1},${(a.y + b.y) / 2 - (b.x - a.x) * 0.1} ${b.x},${b.y}`} fill="none" strokeWidth={active ? 2.5 : 1.5} className={active ? "stroke-copper" : "stroke-stone"} />;
          })}
          {map.nodes.map((n) => {
            const p = pos[n.id];
            if (!p) return null;
            const lines = wrap(n.label, n.kind === "concept" ? 16 : 20);
            const w = Math.max(...lines.map((l) => l.length)) * 7.4 + 26;
            const h = lines.length * 16 + 16;
            return (
              <g key={n.id} transform={`translate(${p.x},${p.y})`} tabIndex={0} role="button" aria-label={n.label} aria-pressed={sel.id === n.id}
                onClick={() => setSel(n)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(n); } }} className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-ring [&:focus-visible>rect]:stroke-[3]">
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={n.kind === "root" ? 12 : 8} strokeWidth={sel.id === n.id ? 3 : 1.5} className={`${KIND[n.kind]} ${sel.id === n.id ? "!stroke-gold" : ""}`} />
                {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + 20 + i * 16} textAnchor="middle" className={`${TEXT[n.kind]} font-sans text-[12.5px] ${n.kind === "root" ? "font-semibold" : ""}`}>{l}</text>)}
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="rounded-xl border border-border bg-card p-5" aria-live="polite">
        <p className="eyebrow">{sel.kind}</p>
        <h2 className="mt-1 font-display text-xl">{sel.label}</h2>
        {sel.detail && <p className="mt-2 text-sm text-muted-foreground">{sel.detail}</p>}
        {sel.href && <Link to={sel.href as never} className="mt-4 inline-block text-sm text-copper hover:underline">Open →</Link>}
        <p className="mt-6 text-xs text-muted-foreground">{map.nodes.length} nodes · {map.edges.length} connections. Select a node (click or Tab + Enter), then zoom to focus on it.</p>
      </aside>
    </div>
  );
}
