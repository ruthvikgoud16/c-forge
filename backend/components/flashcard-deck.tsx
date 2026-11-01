"use client";

import { useEffect, useState } from "react";
import { trackClient } from "@/lib/content/track";
import type { Flashcard } from "@/lib/content/types";

export function FlashcardDeck({ cards, topicId }: { cards: Flashcard[]; topicId: string }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const card = cards[i];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowRight" && cards.length > 0) {
        event.preventDefault();
        void advance();
      }
      if ((event.key === "Enter" || event.key === " ") && !show) {
        event.preventDefault();
        setShow(true);
      }
    }
    function advance() {
      setShow(false);
      setI((current) => {
        const n = (current + 1) % cards.length;
        if (n === 0) void trackClient(topicId, "flashcards_reviewed");
        return n;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length, show, topicId]);

  if (!card) return <p>No cards.</p>;

  async function next() {
    setShow(false);
    const n = (i + 1) % cards.length;
    setI(n);
    if (n === 0) await trackClient(topicId, "flashcards_reviewed");
  }

  return (
    <div className="card flashcard">
      <p className="meta">
        Card {i + 1} / {cards.length}
      </p>
      <div className={show ? "flashcard__face flashcard__face--back" : "flashcard__face"} aria-live="polite">
        <p className="brand">{show ? "Answer" : "Prompt"}</p>
        <p>
          <strong>{show ? card.back : card.front}</strong>
        </p>
        {show ? null : <p className="meta">Think, then reveal.</p>}
      </div>
      <div className="flashcard__actions">
        <button type="button" onClick={() => setShow(true)}>
          Reveal
        </button>
        <button type="button" className="secondary" onClick={() => void next()}>
          Next
        </button>
      </div>
      <p className="meta">Space or Enter reveals. Right arrow moves to the next card.</p>
    </div>
  );
}
