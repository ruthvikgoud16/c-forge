import { useEffect, useState, type ReactNode } from "react";

/** Animated progress ring (value 0..max). */
export function Ring({ value, max, size = 120, stroke = 12, color = "var(--color-copper)", track = "oklch(0.2 0.01 260 / 0.08)", children, label }: { value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(id); }, [pct]);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value} of ${max}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown)} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Multi-segment donut. */
export function Donut({ parts, size = 140, stroke = 18, children }: { parts: { value: number; color: string; label: string }[]; size?: number; stroke?: number; children?: ReactNode }) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  let acc = 0;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.2 0.01 260 / 0.07)" strokeWidth={stroke} />
        {parts.map((p) => {
          const len = (p.value / total) * c;
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeDasharray={`${on ? Math.max(0, len - 2) : 0} ${c}`} strokeDashoffset={-acc} style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)" }} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Horizontal animated bar. */
export function Meter({ value, max, color = "var(--color-copper)", className = "" }: { value: number; max: number; color?: string; className?: string }) {
  const [w, setW] = useState(0);
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  useEffect(() => { const id = requestAnimationFrame(() => setW(pct)); return () => cancelAnimationFrame(id); }, [pct]);
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-foreground/8 ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: color, transition: "width 1.1s cubic-bezier(.2,.8,.2,1)" }} />
    </div>
  );
}
