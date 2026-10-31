import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import type { Flashcard } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { highlightC } from "@/components/common/CodeBlock";
import { Ring } from "@/components/art/Ring";
import { cn } from "@/lib/utils";

export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const done = i >= cards.length;
  const card = cards[i];

  const reveal = useCallback(() => { if (card) { setRevealed(true); setSeen((s) => new Set(s).add(card.id)); } }, [card]);
  const advance = useCallback(() => { if (revealed) { setI((x) => x + 1); setRevealed(false); } }, [revealed]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key === "ArrowRight") advance();
      if (e.key === " " && !(e.target as HTMLElement).closest("button,a")) { e.preventDefault(); if (revealed) advance(); else reveal(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [advance, reveal, revealed]);

  if (!cards.length) return <p>No flashcards for this topic.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-mono" data-testid="flashcard-counter">{Math.min(i + 1, cards.length)} / {cards.length}</span>
        <span className="text-muted-foreground">{seen.size} revealed this pass</span>
      </div>
      <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={i}>
        {cards.map((c, k) => (
          <span key={c.id} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", k < i ? "bg-forest" : k === i ? "bg-copper" : seen.has(c.id) ? "bg-gold" : "bg-foreground/10")} />
        ))}
      </div>
      {done ? (
        <div className="glass-dark cf-pop relative overflow-hidden rounded-[2rem] p-10 text-center" data-testid="flashcards-complete">
          <div className="absolute -left-10 -top-10 size-48 rounded-full bg-ember/30 blur-3xl cf-drift" aria-hidden />
          <div className="relative">
            <Ring value={seen.size} max={cards.length} size={110} color="var(--color-ember)" track="oklch(1 0 0 / .12)"><Sparkles className="size-7 text-ember" /></Ring>
            <p className="eyebrow mt-4 !text-ember">Pass complete</p>
            <p className="mt-2 font-display text-3xl">You went through all {cards.length} cards.</p>
            <p className="mt-2 text-sm text-white/70">Review history is not saved in demo mode.</p>
            <Button variant="hero" className="press mt-6 rounded-full" onClick={() => { setI(0); setRevealed(false); setSeen(new Set()); }} data-testid="flashcards-restart"><RotateCcw /> Start another pass</Button>
          </div>
        </div>
      ) : card && (
        <>
          <div className="relative">
            {[2, 1].map((k) => i + k < cards.length && (
              <div key={k} aria-hidden className="glass-panel absolute inset-x-0 top-0 h-full rounded-[2rem]" style={{ transform: `translateY(${k * 10}px) scale(${1 - k * 0.04})`, opacity: 1 - k * 0.3 }} />
            ))}
            <div className="flip-scene relative">
              <button
                type="button"
                onClick={revealed ? advance : reveal}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); revealed ? advance() : reveal(); } }}
                aria-label={revealed ? "Card back. Press Enter or Right arrow for next card" : "Card front. Press Space or Enter to reveal"}
                className={cn("flip-inner block w-full text-left", revealed && "is-flipped")}
                data-testid="flashcard"
              >
                <div className="flip-face glass-panel relative min-h-80 overflow-hidden rounded-[2rem] p-8">
                  <span className="absolute -right-6 -top-10 select-none font-display text-[10rem] leading-none text-copper/10" aria-hidden>?</span>
                  <span className="eyebrow">Question</span>
                  <p className="relative mt-4 font-display text-2xl leading-snug">{card.front}</p>
                  {card.code && <pre className="relative mt-4 overflow-x-auto rounded-xl bg-code p-4 font-mono text-xs leading-5 text-code-foreground">{highlightC(card.code)}</pre>}
                  <span className="absolute bottom-4 right-6 text-xs text-muted-foreground">Click / Space to reveal</span>
                </div>
                <div className="flip-face flip-back overflow-auto rounded-[2rem] p-8 text-pearl" style={{ background: "linear-gradient(140deg, oklch(0.62 0.15 160), oklch(0.55 0.12 200))" }}>
                  <span className="absolute -right-4 -top-8 select-none font-display text-[9rem] leading-none text-white/10" aria-hidden>✓</span>
                  <span className="eyebrow !text-white/90">Answer</span>
                  <p className="relative mt-4 font-display text-2xl leading-snug">{card.back}</p>
                  {card.code && card.id.endsWith("-syn") && <pre className="relative mt-4 overflow-x-auto rounded-xl bg-black/30 p-4 font-mono text-xs leading-5 text-code-foreground">{highlightC(card.code)}</pre>}
                  <span className="absolute bottom-4 right-6 text-xs text-pearl/70">Click / Enter / → for next</span>
                </div>
              </button>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            {!revealed ? <Button variant="ink" className="press rounded-full" onClick={reveal} data-testid="flashcard-reveal">Reveal</Button> : <Button variant="hero" className="press rounded-full" onClick={advance} data-testid="flashcard-next">Next card →</Button>}
          </div>
        </>
      )}
    </div>
  );
}
