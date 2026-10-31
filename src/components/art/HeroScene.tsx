import { useRef, type PointerEvent } from "react";
import { highlightC } from "@/components/common/CodeBlock";
import { useTick } from "./motion";
import { cn } from "@/lib/utils";

const CODE = `int binary_search(int a[], int n, int key) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == key) return mid;
        if (a[mid] < key) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`;
const ARR = [3, 8, 12, 17, 21, 26, 34];
const STATES = [
  { lo: 0, hi: 6, mid: 3, note: "a[3]=17 < 21 → lo = 4" },
  { lo: 4, hi: 6, mid: 5, note: "a[5]=26 > 21 → hi = 4" },
  { lo: 4, hi: 4, mid: 4, note: "a[4]=21 == key → found" },
];
const BITS = "0101 1100 0010 1011 1110 0001 0110 1001 0011 1101 1000 0111 ";

function Typing() {
  const t = useTick(40);
  const n = Math.min(CODE.length, (t % (CODE.length + 90)) * 2);
  const shown = t === 0 ? CODE : CODE.slice(0, n);
  return (
    <pre className="overflow-hidden font-mono text-[12px] leading-6 text-code-foreground">
      <code>{highlightC(shown)}</code><span className="cf-blink ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-ember" />
    </pre>
  );
}

function SearchCard() {
  const t = useTick(1700);
  const s = STATES[t % STATES.length]!;
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between"><p className="eyebrow">array a[ ] · key = 21</p><span className="font-mono text-[10px] text-muted-foreground">step {(t % 3) + 1}/3</span></div>
      <div className="flex gap-1">
        {ARR.map((v, i) => {
          const out = i < s.lo || i > s.hi;
          return (
            <div key={i} className="flex-1 text-center">
              <div className={cn("rounded-lg border py-2 font-mono text-sm transition-all duration-500", i === s.mid ? "-translate-y-1.5 border-copper bg-copper text-pearl shadow-lg" : out ? "border-transparent bg-foreground/5 text-muted-foreground/60 line-through" : "border-white bg-white/80")}>{v}</div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">{i === s.mid ? "mid" : i === s.lo ? "lo" : i === s.hi ? "hi" : i}</div>
            </div>
          );
        })}
      </div>
      <p key={t} className="cf-pop mt-2 font-mono text-[11px] text-foreground/80">{s.note}</p>
    </div>
  );
}

function MiniFlow() {
  return (
    <svg viewBox="0 0 120 150" className="w-28" aria-hidden>
      <rect x="30" y="4" width="60" height="20" rx="10" fill="var(--color-copper)" />
      <text x="60" y="17" textAnchor="middle" fontSize="9" fill="white" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">start</text>
      <line x1="60" y1="24" x2="60" y2="44" stroke="var(--color-copper)" strokeWidth="2" className="cf-dash" />
      <path d="M60 44 L88 64 L60 84 L32 64Z" fill="white" stroke="var(--color-copper)" strokeWidth="2" />
      <text x="60" y="67" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">lo≤hi?</text>
      <line x1="60" y1="84" x2="60" y2="104" stroke="var(--color-copper)" strokeWidth="2" className="cf-dash" />
      <path d="M88 64 H110 V20 H90" fill="none" stroke="var(--color-forest)" strokeWidth="2" className="cf-dash" />
      <rect x="30" y="104" width="60" height="20" rx="4" fill="white" stroke="var(--color-copper)" strokeWidth="2" />
      <text x="60" y="117" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">mid = …</text>
      <circle r="4" fill="var(--color-gold)"><animateMotion dur="3s" repeatCount="indefinite" path="M60 24 L60 64 L88 64 L110 64 L110 20 L90 20" /></circle>
    </svg>
  );
}

const CHIPS = [
  { t: "{ }", c: "left-[-9%] top-[42%]", d: "0s" },
  { t: "0x2A", c: "left-[12%] top-[-3%]", d: "-2s" },
  { t: "O(log n)", c: "right-[6%] bottom-[-3%]", d: "-4s" },
];

/** Layered, parallax hero composition: typing code, live binary search, flowchart and bit stream. */
export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--my", String((e.clientY - r.top) / r.height - 0.5));
  };
  const layer = (n: number) => ({ transform: `translate3d(calc(var(--mx,0) * ${n}px), calc(var(--my,0) * ${n}px), 0)`, transition: "transform .4s ease-out" });
  return (
    <div ref={ref} onPointerMove={move} className="relative mx-auto w-full min-w-0 max-w-xl select-none py-6" data-testid="hero-scene">
      <div className="absolute inset-[-8%] -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_30%_30%,oklch(0.8_0.12_250/.55),transparent_60%),radial-gradient(circle_at_80%_70%,oklch(0.85_0.11_340/.5),transparent_55%)] blur-2xl" aria-hidden />
      <div style={layer(-14)} className="glass-dark rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-white/50">unit-5 / searching.c</span>
        </div>
        <div className="h-[15rem]"><Typing /></div>
      </div>
      <div style={layer(22)} className="relative -mt-14 ml-8 mr-[-1rem] md:ml-20"><SearchCard /></div>
      <div style={layer(32)} className="glass-panel cf-float absolute -right-14 -top-14 hidden rounded-2xl p-2 md:block"><MiniFlow /></div>
      <div className="mt-5 overflow-hidden rounded-full glass-panel py-1.5" aria-hidden>
        <div className="cf-ticker flex w-max whitespace-nowrap font-mono text-[11px] tracking-[0.3em] text-copper/70">{BITS.repeat(6)}</div>
      </div>
      {CHIPS.map((c) => (
        <span key={c.t} style={{ ...layer(40), animationDelay: c.d }} className={cn("glass-panel absolute hidden rounded-full px-3 py-1 font-mono text-xs text-copper md:inline-block", c.c)}>
          <span className="cf-float inline-block" style={{ animationDelay: c.d }}>{c.t}</span>
        </span>
      ))}
    </div>
  );
}
