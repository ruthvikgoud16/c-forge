import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note, StepControls, useSteps, Stage } from "./shared";

type Frame = { label: string; ret?: number };
type F = { stack: Frame[]; note: string };

function factFrames(n: number): F[] {
  const f: F[] = [];
  const stack: Frame[] = [];
  const go = (k: number): number => {
    stack.push({ label: `fact(${k})` });
    f.push({ stack: stack.map((x) => ({ ...x })), note: k <= 1 ? `fact(${k}) hits the base case.` : `fact(${k}) calls fact(${k - 1}).` });
    const r = k <= 1 ? 1 : k * go(k - 1);
    stack[stack.length - 1]!.ret = r;
    f.push({ stack: stack.map((x) => ({ ...x })), note: `fact(${k}) returns ${r}.` });
    stack.pop();
    return r;
  };
  const r = go(n);
  f.push({ stack: [], note: `Stack empty. Result = ${r}.` });
  return f;
}
function fibFrames(n: number): F[] {
  const f: F[] = [];
  const stack: Frame[] = [];
  const go = (k: number): number => {
    stack.push({ label: `fib(${k})` });
    f.push({ stack: stack.map((x) => ({ ...x })), note: k < 2 ? `fib(${k}) is a base case.` : `fib(${k}) calls fib(${k - 1}) then fib(${k - 2}).` });
    const r = k < 2 ? k : go(k - 1) + go(k - 2);
    stack[stack.length - 1]!.ret = r;
    f.push({ stack: stack.map((x) => ({ ...x })), note: `fib(${k}) returns ${r}.` });
    stack.pop();
    return r;
  };
  const r = go(n);
  f.push({ stack: [], note: `Stack empty. Result = ${r}.` });
  return f;
}

export function RecursionViz() {
  const [fn, setFn] = useState<"fact" | "fib">("fact");
  const [n, setN] = useState(4);
  const fs = useMemo(() => (fn === "fact" ? factFrames(n) : fibFrames(Math.min(n, 5))), [fn, n]);
  const s = useSteps(fs);
  return (
    <div className="space-y-4">
      <Tabs value={fn} onValueChange={(v) => setFn(v as "fact" | "fib")}><TabsList><TabsTrigger value="fact">factorial</TabsTrigger><TabsTrigger value="fib">fibonacci</TabsTrigger></TabsList></Tabs>
      <div className="space-y-1"><Label htmlFor="rc-n">n ({fn === "fact" ? "0–7" : "0–5"})</Label><Input id="rc-n" type="number" min={0} max={7} value={n} onChange={(e) => setN(Math.max(0, Math.min(7, Number(e.target.value) || 0)))} className="w-28 bg-card font-mono" /></div>
      <StepControls s={s as never} />
      <Stage>
        <p className="mb-3 text-xs text-muted-foreground">Call stack (top of stack at top)</p>
        <ol className="flex min-h-40 flex-col-reverse gap-1.5" aria-label="Call stack">
          {s.frame.stack.map((fr, i) => (
            <li key={i} className={`flex items-center justify-between rounded-xl px-4 py-2 font-mono text-sm ${i === s.frame.stack.length - 1 ? "bg-copper text-primary-foreground" : "glass"}`}>
              <span>{fr.label}</span>{fr.ret !== undefined && <span>→ {fr.ret}</span>}
            </li>
          ))}
          {!s.frame.stack.length && <li className="text-sm text-muted-foreground">empty</li>}
        </ol>
      </Stage>
      <Note>{s.frame.note}</Note>
    </div>
  );
}
