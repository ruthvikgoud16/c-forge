import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const h = () => setR(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return r;
}

/** Increments every `ms` while mounted (paused under reduced motion). */
export function useTick(ms = 1200, enabled = true) {
  const [t, setT] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!enabled || reduced) return;
    const id = window.setInterval(() => setT((x) => x + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, enabled, reduced]);
  return t;
}

/** Fades content up when scrolled into view. SSR-safe: content stays visible until hydrated. */
export function Reveal({ children, className, delay = 0, as: As = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add("reveal");
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <As ref={ref as never} className={className} style={{ transitionDelay: `${delay}ms` }}>{children}</As>;
}

/** Slowly drifting colour blobs behind glass surfaces. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="cf-drift absolute -left-[10%] -top-[15%] size-[55vw] rounded-full bg-[oklch(0.82_0.11_250/0.55)] blur-3xl" />
      <div className="cf-drift absolute -right-[12%] top-[5%] size-[45vw] rounded-full bg-[oklch(0.86_0.1_340/0.5)] blur-3xl" style={{ animationDelay: "-7s" }} />
      <div className="cf-drift absolute bottom-[-20%] left-[25%] size-[50vw] rounded-full bg-[oklch(0.9_0.1_170/0.5)] blur-3xl" style={{ animationDelay: "-13s" }} />
      <div className="cf-drift absolute bottom-[10%] right-[15%] size-[22vw] rounded-full bg-[oklch(0.88_0.12_70/0.35)] blur-3xl" style={{ animationDelay: "-4s" }} />
    </div>
  );
}

/** Animated count-up number. */
export function CountUp({ to, duration = 1200, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const [v, setV] = useState(to);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setV(to); return; }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    setV(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduced]);
  return <>{v}{suffix}</>;
}
