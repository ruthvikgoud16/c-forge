import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stage, Note, StepControls, useSteps } from "./shared";

type N = { id: string; label: string; shape: "term" | "io" | "proc" | "dec"; x: number; y: number };
const NODES: N[] = [
  { id: "start", label: "Start", shape: "term", x: 200, y: 30 },
  { id: "read", label: "Read n", shape: "io", x: 200, y: 100 },
  { id: "init", label: "i = 1, fact = 1", shape: "proc", x: 200, y: 170 },
  { id: "dec", label: "i <= n ?", shape: "dec", x: 200, y: 250 },
  { id: "body", label: "fact = fact * i; i++", shape: "proc", x: 380, y: 250 },
  { id: "out", label: "Print fact", shape: "io", x: 200, y: 340 },
  { id: "stop", label: "Stop", shape: "term", x: 200, y: 410 },
];
const EDGES: [string, string, string?][] = [["start", "read"], ["read", "init"], ["init", "dec"], ["dec", "body", "yes"], ["body", "dec"], ["dec", "out", "no"], ["out", "stop"]];

function frames(n: number) {
  const f: { node: string; note: string }[] = [{ node: "start", note: "Execution begins at the terminal symbol." }, { node: "read", note: `Input: n = ${n}.` }, { node: "init", note: "Initialise i = 1 and fact = 1." }];
  let fact = 1;
  for (let i = 1; ; i++) {
    if (i > n) { f.push({ node: "dec", note: `i = ${i} > ${n}: take the NO branch.` }); break; }
    f.push({ node: "dec", note: `i = ${i} ≤ ${n}: take the YES branch.` });
    fact *= i;
    f.push({ node: "body", note: `fact = ${fact}, then i becomes ${i + 1}. Loop back to the decision.` });
  }
  f.push({ node: "out", note: `Output: ${fact}.` }, { node: "stop", note: "Execution ends." });
  return f;
}

function Shape({ n, active }: { n: N; active: boolean }) {
  const w = n.shape === "dec" ? 120 : 150, h = n.shape === "dec" ? 60 : 40;
  const cls = active ? "fill-copper stroke-ember" : "fill-card stroke-foreground/40";
  const t = active ? "fill-pearl" : "fill-foreground";
  return (
    <g transform={`translate(${n.x},${n.y})`}>
      {n.shape === "term" && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} className={cls} strokeWidth={2} />}
      {n.shape === "proc" && <rect x={-w / 2} y={-h / 2} width={w} height={h} className={cls} strokeWidth={2} />}
      {n.shape === "io" && <polygon points={`${-w / 2 + 14},${-h / 2} ${w / 2},${-h / 2} ${w / 2 - 14},${h / 2} ${-w / 2},${h / 2}`} className={cls} strokeWidth={2} />}
      {n.shape === "dec" && <polygon points={`0,${-h / 2} ${w / 2},0 0,${h / 2} ${-w / 2},0`} className={cls} strokeWidth={2} />}
      <text textAnchor="middle" y={4} className={`${t} font-mono text-[11px]`}>{n.label}</text>
    </g>
  );
}

export function FlowchartViz() {
  const [n, setN] = useState(4);
  const fs = useMemo(() => frames(n), [n]);
  const s = useSteps(fs);
  const pos = Object.fromEntries(NODES.map((x) => [x.id, x]));
  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label htmlFor="fc-n">n (0–7)</Label><Input id="fc-n" type="number" min={0} max={7} value={n} onChange={(e) => setN(Math.max(0, Math.min(7, Number(e.target.value) || 0)))} className="w-28 bg-card font-mono" /></div>
      <StepControls s={s as never} />
      <Stage className="flex justify-center">
        <svg viewBox="40 0 440 440" className="w-full max-w-lg" role="img" aria-label="Factorial flowchart">
          <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" className="fill-foreground/60" /></marker></defs>
          {EDGES.map(([a, b, lbl]) => {
            const A = pos[a]!, B = pos[b]!;
            const d = a === "body" ? `M${A.x},${A.y + 20} L${A.x},${A.y + 50} L${B.x + 20},${B.y + 50} L${B.x + 20},${B.y + 22}` : a === "dec" && b === "body" ? `M${A.x + 60},${A.y} L${B.x - 75},${B.y}` : `M${A.x},${A.y + (A.shape === "dec" ? 30 : 20)} L${B.x},${B.y - (B.shape === "dec" ? 30 : 20)}`;
            return <g key={a + b}><path d={d} fill="none" strokeWidth={1.5} className="stroke-foreground/50" markerEnd="url(#arr)" />{lbl && <text x={a === "dec" && b === "body" ? 285 : 210} y={a === "dec" && b === "body" ? 244 : 296} className="fill-copper font-mono text-[10px]">{lbl}</text>}</g>;
          })}
          {NODES.map((x) => <Shape key={x.id} n={x} active={s.frame.node === x.id} />)}
        </svg>
      </Stage>
      <Note>{s.frame.note}</Note>
    </div>
  );
}
