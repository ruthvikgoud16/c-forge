import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note, StepControls, useSteps, Stage } from "./shared";

type F = { a: number[]; hi: number[]; done?: number[] | undefined; note: string };
type Alg = "linear" | "binary" | "bubble" | "insertion" | "selection" | "quick" | "merge";
const NAMES: Record<Alg, string> = { linear: "Linear search", binary: "Binary search", bubble: "Bubble sort", insertion: "Insertion sort", selection: "Selection sort", quick: "Quick sort", merge: "Merge sort" };

function run(alg: Alg, input: number[], key: number): F[] {
  const a = [...input];
  const f: F[] = [];
  const push = (hi: number[], note: string, done?: number[]) => f.push({ a: [...a], hi, done, note });
  if (alg === "linear") {
    for (let i = 0; i < a.length; i++) { push([i], `Compare a[${i}] = ${a[i]} with ${key}.`); if (a[i] === key) { push([i], `Found at index ${i}.`, [i]); return f; } }
    push([], `${key} not found — returns -1.`); return f;
  }
  if (alg === "binary") {
    a.sort((x, y) => x - y); push([], "Binary search needs a sorted array — sorted first.");
    let lo = 0, hi = a.length - 1;
    while (lo <= hi) { const mid = lo + Math.floor((hi - lo) / 2); push([mid], `lo=${lo}, hi=${hi}, mid=${mid}: a[mid]=${a[mid]}.`); if (a[mid] === key) { push([mid], `Found at index ${mid}.`, [mid]); return f; } if (a[mid]! < key) lo = mid + 1; else hi = mid - 1; }
    push([], `${key} not found — returns -1.`); return f;
  }
  const swap = (i: number, j: number) => { [a[i], a[j]] = [a[j]!, a[i]!]; };
  if (alg === "bubble") {
    for (let i = 0; i < a.length - 1; i++) { for (let j = 0; j < a.length - 1 - i; j++) { push([j, j + 1], `Compare ${a[j]} and ${a[j + 1]}.`); if (a[j]! > a[j + 1]!) { swap(j, j + 1); push([j, j + 1], "Out of order — swap."); } } push([], `Pass ${i + 1} done: largest unsorted value bubbled to the end.`); }
  } else if (alg === "insertion") {
    for (let i = 1; i < a.length; i++) { let j = i; push([i], `Insert ${a[i]} into the sorted prefix.`); while (j > 0 && a[j - 1]! > a[j]!) { swap(j, j - 1); j--; push([j], "Shift left."); } }
  } else if (alg === "selection") {
    for (let i = 0; i < a.length - 1; i++) { let m = i; for (let j = i + 1; j < a.length; j++) { push([m, j], `Minimum so far ${a[m]}; check ${a[j]}.`); if (a[j]! < a[m]!) m = j; } swap(i, m); push([i], `Place minimum ${a[i]} at index ${i}.`); }
  } else if (alg === "quick") {
    const qs = (lo: number, hi: number) => { if (lo >= hi) return; const p = a[hi]!; let i = lo; push([hi], `Pivot = ${p} (range ${lo}..${hi}).`); for (let j = lo; j < hi; j++) { if (a[j]! < p) { swap(i, j); push([i, j], `${a[i]} < pivot — move left.`); i++; } } swap(i, hi); push([i], `Pivot ${p} placed at index ${i}.`); qs(lo, i - 1); qs(i + 1, hi); };
    qs(0, a.length - 1);
  } else {
    const ms = (lo: number, hi: number) => { if (lo >= hi) return; const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid + 1, hi); const merged: number[] = []; let i = lo, j = mid + 1; while (i <= mid && j <= hi) merged.push(a[i]! <= a[j]! ? a[i++]! : a[j++]!); while (i <= mid) merged.push(a[i++]!); while (j <= hi) merged.push(a[j++]!); merged.forEach((v, k) => (a[lo + k] = v)); push(Array.from({ length: hi - lo + 1 }, (_, k) => lo + k), `Merged range ${lo}..${hi}.`); };
    ms(0, a.length - 1);
  }
  push([], "Sorted.", a.map((_, i) => i));
  return f;
}

export function SearchSortViz() {
  const [alg, setAlg] = useState<Alg>("bubble");
  const [text, setText] = useState("29, 10, 14, 37, 13, 5, 22");
  const [key, setKey] = useState(13);
  const arr = useMemo(() => text.split(/[ ,]+/).map(Number).filter((n) => !Number.isNaN(n)).slice(0, 10), [text]);
  const fs = useMemo(() => run(alg, arr.length ? arr : [1], key), [alg, arr, key]);
  const s = useSteps(fs);
  const max = Math.max(...s.frame.a, 1);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label>Algorithm</Label><Select value={alg} onValueChange={(v) => setAlg(v as Alg)}><SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(NAMES) as Alg[]).map((k) => <SelectItem key={k} value={k}>{NAMES[k]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label htmlFor="ss-a">Values (up to 10)</Label><Input id="ss-a" value={text} onChange={(e) => setText(e.target.value)} className="w-64 bg-card font-mono" /></div>
        {(alg === "linear" || alg === "binary") && <div className="space-y-1"><Label htmlFor="ss-k">Key</Label><Input id="ss-k" type="number" value={key} onChange={(e) => setKey(Number(e.target.value) || 0)} className="w-24 bg-card font-mono" /></div>}
      </div>
      <StepControls s={s as never} />
      <Stage>
        <div className="flex h-48 items-end gap-1.5">
          {s.frame.a.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end">
              <div className={`w-full rounded-t-lg transition-all ${s.frame.done?.includes(i) ? "bg-forest" : s.frame.hi.includes(i) ? "bg-copper" : "bg-foreground/15"}`} style={{ height: `${(v / max) * 160}px` }} />
              <span className="mt-1 font-mono text-xs">{v}</span>
            </div>
          ))}
        </div>
      </Stage>
      <Note>{s.frame.note}</Note>
    </div>
  );
}
