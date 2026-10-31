import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note, StepControls, useSteps, CodeLines, Vars, Stage } from "./shared";

type F = { line: number; vars: Record<string, number | string>; out: string; note: string };

const LADDER = ["if (mark >= 90)", '    grade = \'A\';', "else if (mark >= 75)", '    grade = \'B\';', "else if (mark >= 60)", '    grade = \'C\';', "else", '    grade = \'F\';', 'printf("%c", grade);'];
function ladder(mark: number): F[] {
  const f: F[] = [];
  const tests: [number, number, string][] = [[0, 90, "A"], [2, 75, "B"], [4, 60, "C"]];
  for (const [line, th, g] of tests) {
    const ok = mark >= th;
    f.push({ line, vars: { mark }, out: "", note: `${mark} >= ${th} is ${ok ? "true" : "false"}.` });
    if (ok) { f.push({ line: line + 1, vars: { mark, grade: `'${g}'` }, out: "", note: `Assign '${g}'; the rest of the ladder is skipped.` }); f.push({ line: 8, vars: { mark, grade: `'${g}'` }, out: g, note: `Prints ${g}.` }); return f; }
  }
  f.push({ line: 6, vars: { mark }, out: "", note: "No condition matched — take the else branch." });
  f.push({ line: 7, vars: { mark, grade: "'F'" }, out: "", note: "Assign 'F'." });
  f.push({ line: 8, vars: { mark, grade: "'F'" }, out: "F", note: "Prints F." });
  return f;
}

const LOOP = ["int sum = 0;", "for (int i = 1; i <= n; i++) {", "    if (i % 3 == 0) continue;", "    sum += i;", "}", 'printf("%d", sum);'];
function loop(n: number, kind: "for" | "while" | "do"): F[] {
  const f: F[] = [{ line: 0, vars: { n, sum: 0 }, out: "", note: "sum starts at 0." }];
  let sum = 0, i = 1;
  if (kind === "do") f.push({ line: 1, vars: { n, i, sum }, out: "", note: "do-while: the body runs before the first test." });
  for (let g = 0; g < 60; g++) {
    const test = i <= n;
    if (!(kind === "do" && g === 0)) {
      f.push({ line: 1, vars: { n, i, sum }, out: "", note: `Test i <= n: ${i} <= ${n} is ${test}.` });
      if (!test) break;
    }
    if (i % 3 === 0) { f.push({ line: 2, vars: { n, i, sum }, out: "", note: `${i} % 3 == 0 → continue skips the add.` }); }
    else { sum += i; f.push({ line: 3, vars: { n, i, sum }, out: "", note: `sum += ${i} → ${sum}.` }); }
    i++;
    f.push({ line: 4, vars: { n, i, sum }, out: "", note: `Update: i becomes ${i}.` });
  }
  f.push({ line: 5, vars: { n, i, sum }, out: String(sum), note: `Loop finished. Prints ${sum}.` });
  return f;
}

export function ControlFlowViz() {
  const [mode, setMode] = useState<"ladder" | "for" | "while" | "do">("ladder");
  const [mark, setMark] = useState(78);
  const [n, setN] = useState(7);
  const fs = useMemo(() => (mode === "ladder" ? ladder(mark) : loop(n, mode)), [mode, mark, n]);
  const s = useSteps(fs);
  const code = mode === "ladder" ? LADDER : mode === "for" ? LOOP : mode === "while" ? ["int sum = 0, i = 1;", "while (i <= n) {", "    if (i % 3 == 0) { i++; continue; }", "    sum += i;", "    i++; }", 'printf("%d", sum);'] : ["int sum = 0, i = 1;", "do {", "    if (i % 3 == 0) { i++; continue; }", "    sum += i;", "    i++; } while (i <= n);", 'printf("%d", sum);'];
  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList><TabsTrigger value="ladder">else-if ladder</TabsTrigger><TabsTrigger value="for">for</TabsTrigger><TabsTrigger value="while">while</TabsTrigger><TabsTrigger value="do">do-while</TabsTrigger></TabsList>
      </Tabs>
      {mode === "ladder"
        ? <div className="space-y-1"><Label htmlFor="cf-m">mark</Label><Input id="cf-m" type="number" min={0} max={100} value={mark} onChange={(e) => setMark(Number(e.target.value) || 0)} className="w-28 bg-card font-mono" /></div>
        : <div className="space-y-1"><Label htmlFor="cf-n">n (0–12)</Label><Input id="cf-n" type="number" min={0} max={12} value={n} onChange={(e) => setN(Math.max(0, Math.min(12, Number(e.target.value) || 0)))} className="w-28 bg-card font-mono" /></div>}
      <StepControls s={s as never} />
      <div className="grid gap-4 md:grid-cols-2">
        <CodeLines lines={code} active={s.frame.line} />
        <Stage className="space-y-3"><p className="eyebrow">Variables</p><Vars vars={s.frame.vars} /><p className="eyebrow pt-2">Output</p><p className="min-h-8 rounded bg-code px-3 py-1 font-mono text-code-string">{s.frame.out}</p></Stage>
      </div>
      <Note>{s.frame.note}</Note>
    </div>
  );
}
