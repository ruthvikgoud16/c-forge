import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Stage, Note } from "./shared";

export function BinaryViz() {
  const [n, setN] = useState(45);
  const bits = Array.from({ length: 8 }, (_, i) => 7 - i);
  const flip = (b: number) => setN((v) => v ^ (1 << b));
  const steps: string[] = [];
  for (let v = n; v > 0; v = Math.floor(v / 2)) steps.push(`${v} ÷ 2 = ${Math.floor(v / 2)} remainder ${v % 2}`);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label htmlFor="bin-n">Decimal (0–255)</Label><Input id="bin-n" type="number" min={0} max={255} value={n} onChange={(e) => setN(Math.max(0, Math.min(255, Number(e.target.value) || 0)))} className="w-32 bg-card font-mono" /></div>
        <Button variant="quiet" onClick={() => setN(0)}>Reset</Button>
        <Button variant="quiet" onClick={() => setN((v) => (v << 1) & 255)}>{"<< 1"}</Button>
        <Button variant="quiet" onClick={() => setN((v) => v >> 1)}>{">> 1"}</Button>
        <Button variant="quiet" onClick={() => setN((v) => ~v & 255)}>~ (8-bit)</Button>
      </div>
      <Stage>
        <div className="grid grid-cols-8 gap-1 sm:gap-2">
          {bits.map((b) => {
            const on = (n >> b) & 1;
            return (
              <button key={b} onClick={() => flip(b)} aria-label={`Bit ${b}, value ${on}. Toggle`} aria-pressed={!!on} className="text-center">
                <span className="block font-mono text-[10px] text-muted-foreground">2^{b}</span>
                <span className={`mt-1 block rounded-md border py-3 font-mono text-xl transition ${on ? "border-copper bg-copper text-pearl" : "border-border bg-card"}`}>{on}</span>
                <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{on ? 1 << b : 0}</span>
              </button>
            );
          })}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-sm sm:grid-cols-4">
          {[["Decimal", n.toString(10)], ["Binary", n.toString(2).padStart(8, "0")], ["Octal", n.toString(8)], ["Hex", n.toString(16).toUpperCase()]].map(([k, v]) => <div key={k} className="rounded-md bg-card p-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-lg">{v}</dd></div>)}
        </dl>
      </Stage>
      <Note>{n === 0 ? "0 in binary is 0. Toggle bits to build a number." : <>Repeated division: {steps.join(" · ")} — read remainders bottom-up: <strong>{n.toString(2)}</strong></>}</Note>
    </div>
  );
}
