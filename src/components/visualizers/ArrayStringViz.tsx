import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note, StepControls, useSteps, Stage } from "./shared";

type F = { cells: string[]; hi: number[]; mark?: number[]; note: string };
type Op = "traverse" | "strlen" | "reverse" | "copy";

function build(op: Op, arr: number[], str: string): F[] {
  if (op === "traverse") {
    const f: F[] = [];
    let max = arr[0] ?? 0, mi = 0;
    arr.forEach((v, i) => { if (v > max) { max = v; mi = i; } f.push({ cells: arr.map(String), hi: [i], mark: [mi], note: `a[${i}] = ${v}. Largest so far: a[${mi}] = ${max}.` }); });
    f.push({ cells: arr.map(String), hi: [], mark: [mi], note: `Traversal done. Maximum is ${max} at index ${mi}.` });
    return f;
  }
  const chars = [...str, "\\0"];
  if (op === "strlen") {
    const f: F[] = [];
    for (let i = 0; i < chars.length; i++) f.push({ cells: chars, hi: [i], note: i < str.length ? `s[${i}] = '${chars[i]}' is not '\\0', so n = ${i + 1}.` : `s[${i}] is '\\0' — stop. strlen = ${str.length}.` });
    return f;
  }
  if (op === "reverse") {
    const c = [...str];
    const f: F[] = [{ cells: [...c, "\\0"], hi: [], note: "Two indexes: i from the start, j from the end." }];
    for (let i = 0, j = c.length - 1; i < j; i++, j--) {
      f.push({ cells: [...c, "\\0"], hi: [i, j], note: `Swap s[${i}]='${c[i]}' and s[${j}]='${c[j]}'.` });
      [c[i], c[j]] = [c[j]!, c[i]!];
      f.push({ cells: [...c, "\\0"], hi: [i, j], note: `Now "${c.join("")}".` });
    }
    f.push({ cells: [...c, "\\0"], hi: [], note: "i met j — reversal complete (manual, no strrev)." });
    return f;
  }
  const dst: string[] = Array(chars.length).fill("·");
  const f: F[] = [];
  chars.forEach((ch, i) => { dst[i] = ch; f.push({ cells: [...dst], hi: [i], note: `dst[${i}] = src[${i}] = '${ch}'${ch === "\\0" ? " — terminator copied, done." : "."}` }); });
  return f;
}

export function ArrayStringViz() {
  const [op, setOp] = useState<Op>("traverse");
  const [arrText, setArrText] = useState("12, 7, 31, 4, 19");
  const [str, setStr] = useState("forge");
  const arr = useMemo(() => arrText.split(/[ ,]+/).map(Number).filter((n) => !Number.isNaN(n)).slice(0, 10), [arrText]);
  const safeStr = str.slice(0, 12) || "c";
  const fs = useMemo(() => build(op, arr.length ? arr : [0], safeStr), [op, arr, safeStr]);
  const s = useSteps(fs);
  return (
    <div className="space-y-4">
      <Tabs value={op} onValueChange={(v) => setOp(v as Op)}>
        <TabsList className="flex-wrap"><TabsTrigger value="traverse">Array: find max</TabsTrigger><TabsTrigger value="strlen">strlen</TabsTrigger><TabsTrigger value="reverse">Manual reverse</TabsTrigger><TabsTrigger value="copy">Manual copy</TabsTrigger></TabsList>
      </Tabs>
      {op === "traverse"
        ? <div className="space-y-1"><Label htmlFor="as-a">Array values (up to 10)</Label><Input id="as-a" value={arrText} onChange={(e) => setArrText(e.target.value)} className="max-w-sm bg-card font-mono" /></div>
        : <div className="space-y-1"><Label htmlFor="as-s">String (up to 12 chars)</Label><Input id="as-s" value={str} maxLength={12} onChange={(e) => setStr(e.target.value)} className="max-w-sm bg-card font-mono" /></div>}
      <StepControls s={s as never} />
      <Stage>
        <div className="flex flex-wrap gap-1.5">
          {s.frame.cells.map((c, i) => (
            <div key={i} className="w-12 text-center">
              <div className={`rounded-md border py-3 font-mono transition ${s.frame.hi.includes(i) ? "border-copper bg-copper text-pearl" : s.frame.mark?.includes(i) ? "border-forest bg-forest/20" : c === "\\0" ? "border-dashed border-border bg-muted text-muted-foreground" : "border-border bg-card"}`}>{c}</div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">[{i}]</div>
            </div>
          ))}
        </div>
      </Stage>
      <Note>{s.frame.note}</Note>
    </div>
  );
}
