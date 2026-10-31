import { cn } from "@/lib/utils";

type Key = "unit-1" | "unit-2" | "unit-3" | "unit-4" | "unit-5" | "supplementary";

export const UNIT_STYLE: Record<Key, { from: string; to: string; ink: string; motif: string }> = {
  "unit-1": { from: "oklch(0.72 0.15 245)", to: "oklch(0.8 0.12 210)", ink: "oklch(0.45 0.17 250)", motif: "Machine · bits · structure" },
  "unit-2": { from: "oklch(0.78 0.15 55)", to: "oklch(0.75 0.15 15)", ink: "oklch(0.52 0.17 40)", motif: "Branches · decisions · loops" },
  "unit-3": { from: "oklch(0.78 0.13 165)", to: "oklch(0.76 0.11 200)", ink: "oklch(0.48 0.12 170)", motif: "Cells · indexes · strings" },
  "unit-4": { from: "oklch(0.7 0.14 275)", to: "oklch(0.74 0.13 235)", ink: "oklch(0.45 0.16 270)", motif: "Calls · frames · pointers" },
  "unit-5": { from: "oklch(0.76 0.15 350)", to: "oklch(0.8 0.14 60)", ink: "oklch(0.52 0.18 360)", motif: "Search paths · sorting" },
  supplementary: { from: "oklch(0.5 0.03 260)", to: "oklch(0.35 0.03 260)", ink: "oklch(0.3 0.02 260)", motif: "Contest practice" },
};

export const unitGradient = (id: string) => {
  const s = UNIT_STYLE[(id as Key)] ?? UNIT_STYLE.supplementary;
  return `linear-gradient(135deg, ${s.from}, ${s.to})`;
};

const W = "oklch(1 0 0 / 0.92)";
const W2 = "oklch(1 0 0 / 0.45)";

function Machine() {
  return (
    <g>
      <rect x="70" y="35" width="60" height="60" rx="10" fill={W2} stroke={W} strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={78 + i * 14} y1="35" x2={78 + i * 14} y2="25" stroke={W} strokeWidth="2" />
          <line x1={78 + i * 14} y1="95" x2={78 + i * 14} y2="105" stroke={W} strokeWidth="2" />
        </g>
      ))}
      <text x="100" y="70" textAnchor="middle" fontSize="13" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W} fontWeight="700">CPU</text>
      <path d="M130 65 H175" stroke={W} strokeWidth="2" className="cf-dash" />
      <path d="M25 65 H70" stroke={W} strokeWidth="2" className="cf-dash" />
      <rect x="175" y="50" width="18" height="30" rx="4" fill={W2} stroke={W} />
      {["1", "0", "1", "1"].map((b, i) => (
        <text key={i} x={12 + i * 14} y="125" fontSize="13" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W} className="cf-blink" style={{ animationDelay: `${i * 0.35}s`, animationDuration: "1.8s" }}>{b}</text>
      ))}
      <text x="150" y="125" fontSize="11" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W}>= 11₁₀</text>
    </g>
  );
}

function Branches() {
  return (
    <g>
      <path d="M100 20 L130 50 L100 80 L70 50 Z" fill={W2} stroke={W} strokeWidth="2" />
      <text x="100" y="54" textAnchor="middle" fontSize="11" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W} fontWeight="700">x&gt;0?</text>
      <path d="M70 50 H35 V95" fill="none" stroke={W} strokeWidth="2" className="cf-dash" />
      <path d="M130 50 H165 V95" fill="none" stroke={W} strokeWidth="2" className="cf-dash" />
      <rect x="15" y="95" width="40" height="22" rx="6" fill={W2} stroke={W} />
      <rect x="145" y="95" width="40" height="22" rx="6" fill={W2} stroke={W} />
      <text x="35" y="110" textAnchor="middle" fontSize="10" fill={W} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">no</text>
      <text x="165" y="110" textAnchor="middle" fontSize="10" fill={W} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">yes</text>
      <path id="loopArc" d="M100 80 C100 125, 60 125, 60 105" fill="none" stroke={W2} strokeWidth="2" />
      <circle r="4" fill={W}>
        <animateMotion dur="2.4s" repeatCount="indefinite" path="M100 80 C100 125, 60 125, 60 105" />
      </circle>
    </g>
  );
}

function Cells() {
  const chars = ["C", "F", "o", "r", "g", "e", "\\0"];
  return (
    <g>
      {chars.map((c, i) => (
        <g key={i}>
          <rect x={14 + i * 25} y="48" width="23" height="30" rx="5" fill={W2} stroke={W} strokeWidth="1.5" />
          <text x={25.5 + i * 25} y="68" textAnchor="middle" fontSize="12" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W} fontWeight="700">{c}</text>
          <text x={25.5 + i * 25} y="92" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W}>{i}</text>
        </g>
      ))}
      <rect y="44" width="27" height="38" rx="7" fill="none" stroke={W} strokeWidth="2.5">
        <animate attributeName="x" values="12;37;62;87;112;137;162;12" dur="5s" repeatCount="indefinite" calcMode="discrete" />
      </rect>
      <text x="186" y="26" textAnchor="end" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={W}>char s[7] @ 0x7ffe</text>
      <path d="M14 112 H186" stroke={W2} strokeWidth="1.5" className="cf-dash" />
    </g>
  );
}

function Frames() {
  const f = ["fact(1)", "fact(2)", "fact(3)", "main()"];
  return (
    <g>
      {f.map((l, i) => (
        <g key={l} className="cf-float" style={{ animationDelay: `${i * -1.2}s`, animationDuration: "5s" }}>
          <rect x={45 + i * 6} y={18 + i * 26} width={110 - i * 12} height="22" rx="6" fill={i === 0 ? W : W2} stroke={W} />
          <text x="100" y={33 + i * 26} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={i === 0 ? "oklch(0.4 0.15 270)" : W} fontWeight="700">{l}</text>
        </g>
      ))}
      <path d="M170 30 C190 60, 190 90, 170 115" fill="none" stroke={W} strokeWidth="2" className="cf-dash" markerEnd="url(#arr)" />
      <path d="M30 115 C10 90, 10 60, 30 30" fill="none" stroke={W2} strokeWidth="2" className="cf-dash" />
      <text x="178" y="130" fontSize="9" fill={W} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">return</text>
      <text x="4" y="130" fontSize="9" fill={W} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">call</text>
    </g>
  );
}

function Bars() {
  const h = [40, 75, 25, 90, 55, 65, 35];
  return (
    <g>
      {h.map((v, i) => (
        <rect key={i} x={20 + i * 24} y={115 - v} width="16" height={v} rx="4" fill={i === 3 ? W : W2} stroke={W} strokeWidth="1" className="cf-bar" style={{ animationDelay: `${i * -0.3}s` }} />
      ))}
      <g className="cf-float" style={{ animationDuration: "4s" }}>
        <circle cx="150" cy="28" r="13" fill="none" stroke={W} strokeWidth="3" />
        <line x1="159" y1="37" x2="172" y2="50" stroke={W} strokeWidth="4" strokeLinecap="round" />
      </g>
      <line x1="14" y1="117" x2="186" y2="117" stroke={W} strokeWidth="2" />
    </g>
  );
}

function Trophy() {
  return (
    <g>
      {[[40, 40], [100, 25], [160, 45], [70, 100], [135, 100]].map(([x, y], i, arr) => (
        <g key={i}>
          {i > 0 && <line x1={arr[i - 1]![0]} y1={arr[i - 1]![1]} x2={x} y2={y} stroke={W2} strokeWidth="2" className="cf-dash" />}
          <circle cx={x} cy={y} r="9" fill={W2} stroke={W} strokeWidth="2" className="cf-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
      <text x="100" y="135" textAnchor="middle" fontSize="10" fill={W} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">O(n log n)</text>
    </g>
  );
}

const MOTIF: Record<Key, () => React.JSX.Element> = { "unit-1": Machine, "unit-2": Branches, "unit-3": Cells, "unit-4": Frames, "unit-5": Bars, supplementary: Trophy };

/** Distinct animated illustration for each unit. */
export function UnitArt({ unitId, className, number, label = true }: { unitId: string; className?: string; number?: number; label?: boolean }) {
  const key = (unitId in UNIT_STYLE ? unitId : "supplementary") as Key;
  const M = MOTIF[key];
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)} style={{ background: unitGradient(key) }} role="img" aria-label={`Unit illustration: ${UNIT_STYLE[key].motif}`}>
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(oklch(1_0_0/0.5)_1px,transparent_1px)] [background-size:14px_14px]" aria-hidden />
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/25 blur-2xl" aria-hidden />
      <svg viewBox="0 0 200 140" className="relative h-full w-full" aria-hidden>
        <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill={W} /></marker></defs>
        <M />
      </svg>
      {number !== undefined && <span className="absolute left-3 top-2 font-display text-2xl text-white/90 drop-shadow">0{number}</span>}
      {label && <span className="absolute bottom-2 right-3 rounded-full bg-white/25 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">{UNIT_STYLE[key].motif}</span>}
    </div>
  );
}
