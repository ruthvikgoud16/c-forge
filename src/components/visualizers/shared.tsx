import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function useSteps<T>(frames: T[]) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setI(0); setPlaying(false); }, [frames]);
  useEffect(() => {
    if (!playing) return;
    if (i >= frames.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 700);
    return () => clearTimeout(t);
  }, [playing, i, frames.length]);
  return { i, frame: frames[Math.min(i, frames.length - 1)]!, total: frames.length, setI, playing, setPlaying };
}

export function StepControls({ s }: { s: ReturnType<typeof useSteps<unknown>> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="quiet" size="sm" onClick={() => { s.setPlaying(false); s.setI(0); }} aria-label="Reset"><RotateCcw /> Reset</Button>
      <Button variant="quiet" size="sm" disabled={s.i === 0} onClick={() => s.setI(s.i - 1)} aria-label="Previous step"><ChevronLeft /> Prev</Button>
      <Button variant="ink" size="sm" disabled={s.i >= s.total - 1} onClick={() => s.setI(s.i + 1)} aria-label="Next step">Next <ChevronRight /></Button>
      <Button variant="hero" size="sm" onClick={() => s.setPlaying(!s.playing)} disabled={s.i >= s.total - 1 && !s.playing}>{s.playing ? <><Pause /> Pause</> : <><Play /> Play</>}</Button>
      <span className="ml-auto font-mono text-xs text-muted-foreground">step {s.i + 1} / {s.total}</span>
    </div>
  );
}

export function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface-1 p-5 ${className}`}>{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p aria-live="polite" className="rounded-md bg-ink px-4 py-3 text-sm text-ink-foreground">{children}</p>;
}

export function CodeLines({ lines, active }: { lines: string[]; active?: number }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-code py-3 font-mono text-[13px] leading-6 text-code-foreground">
      {lines.map((l, n) => (
        <div key={n} className={`px-4 ${n === active ? "bg-copper/30 shadow-[inset_3px_0_0_var(--ember)]" : ""}`}>
          <span className="mr-3 inline-block w-5 text-right text-code-comment/60">{n + 1}</span>{l}
        </div>
      ))}
    </pre>
  );
}

export function Vars({ vars }: { vars: Record<string, string | number> }) {
  return (
    <dl className="flex flex-wrap gap-2">
      {Object.entries(vars).map(([k, v]) => (
        <div key={k} className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-sm"><dt className="inline text-muted-foreground">{k} = </dt><dd className="inline font-semibold text-copper">{v}</dd></div>
      ))}
    </dl>
  );
}
