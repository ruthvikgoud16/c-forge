"use client";

import { useState } from "react";

const OPTIONS = [
  { id: "from_scratch", label: "Start learning from scratch" },
  { id: "test_knowledge", label: "Test my existing knowledge" },
  { id: "theory_weak_coding", label: "I understand theory but struggle with coding" },
  { id: "exam_revision", label: "I want to revise for examinations" },
  { id: "problem_solving", label: "I want to improve problem-solving" },
];

export function PreferenceForm() {
  const [done, setDone] = useState("");
  return (
    <form
      className="card"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const startIntent = String(data.get("startIntent") ?? "");
        const res = await fetch("/api/v1/onboarding/preferences", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ startIntent }),
        });
        setDone(res.ok ? "Saved. This is not a skill label." : "Could not save.");
      }}
    >
      {OPTIONS.map((opt) => (
        <p key={opt.id}>
          <label>
            <input type="radio" name="startIntent" value={opt.id} required /> {opt.label}
          </label>
        </p>
      ))}
      <button type="submit">Save preference</button>
      {done ? <p className="meta">{done}</p> : null}
    </form>
  );
}
