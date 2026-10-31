import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stage, Note, StepControls, useSteps, CodeLines, Vars } from "./shared";

const LINES = ["1. Start", "2. Read a, b", "3. While b ≠ 0:", "4.    r ← a mod b", "5.    a ← b;  b ← r", "6. Print a (the GCD)", "7. Stop"];

type F = { line: number; vars: Record<string, number | string>; note: string };
function frames(a0: number, b0: number): F[] {
  const f: F[] = [{ line: 0, vars: {}, note: "Begin the Euclidean algorithm." }];
  let a = a0, b = b0;
  f.push({ line: 1, vars: { a, b }, note: `Read a = ${a}, b = ${b}.` });
  let guard = 0;
  while (guard++ < 40) {
    f.push({ line: 2, vars: { a, b }, note: b !== 0 ? `b = ${b} is not 0, so continue.` : "b is 0 — the loop ends." });
    if (b === 0) break;
    const r = a % b;
    f.push({ line: 3, vars: { a, b, r }, note: `${a} mod ${b} = ${r}.` });
    a = b; b = r;
    f.push({ line: 4, vars: { a, b, r }, note: `Shift: a becomes ${a}, b becomes ${b}.` });
  }
  f.push({ line: 5, vars: { a, b }, note: `Output: GCD = ${a}.` });
  f.push({ line: 6, vars: { a, b }, note: "Algorithm terminates." });
  return f;
}

export function AlgorithmViz() {
  const [a, setA] = useState(48);
  const [b, setB] = useState(18);
  const fs = useMemo(() => frames(Math.max(1, a), Math.max(0, b)), [a, b]);
  const s = useSteps(fs);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1"><Label htmlFor="alg-a">a</Label><Input id="alg-a" type="number" min={1} max={9999} value={a} onChange={(e) => setA(Number(e.target.value) || 1)} className="w-28 bg-card font-mono" /></div>
        <div className="space-y-1"><Label htmlFor="alg-b">b</Label><Input id="alg-b" type="number" min={0} max={9999} value={b} onChange={(e) => setB(Number(e.target.value) || 0)} className="w-28 bg-card font-mono" /></div>
      </div>
      <StepControls s={s as never} />
      <div className="grid gap-4 md:grid-cols-2">
        <CodeLines lines={LINES} active={s.frame.line} />
        <Stage><p className="eyebrow mb-3">State</p><Vars vars={s.frame.vars} /></Stage>
      </div>
      <Note>{s.frame.note}</Note>
    </div>
  );
}
