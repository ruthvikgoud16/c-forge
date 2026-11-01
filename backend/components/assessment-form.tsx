"use client";

import { useState } from "react";

type Item = { id: string; prompt: string; family: string; marks: number; topicId: string; choices?: string[] };

export function AssessmentForm({
  assessmentId,
  items,
}: {
  assessmentId: string;
  items: Item[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<null | {
    earned: number;
    total: number;
    review: Array<{ id: string; correct: boolean; marks: number; max: number }>;
    byTopic: Record<string, { earned: number; max: number }>;
  }>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/v1/assessments/${encodeURIComponent(assessmentId)}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ responses: values }),
    });
    const body = await res.json();
    if (res.ok) setResult(body);
  }
  return (
    <form className="learn-assess" onSubmit={(e) => void submit(e)}>
      {items.map((item, index) => (
        <fieldset key={item.id} className="card">
          <legend>
            Question {index + 1} of {items.length} · {item.family} · {item.marks} mark{item.marks === 1 ? "" : "s"}
          </legend>
          <p>{item.prompt}</p>
          {item.choices?.length ? (
            <div className="learn-assess__choices">
              {item.choices.map((choice) => (
                <label key={choice}>
                  <input
                    type="radio"
                    name={item.id}
                    value={choice}
                    checked={values[item.id] === choice}
                    onChange={() => setValues({ ...values, [item.id]: choice })}
                  />
                  {choice}
                </label>
              ))}
            </div>
          ) : null}
          <input
            aria-label={`Answer for question ${index + 1}`}
            value={values[item.id] ?? ""}
            onChange={(e) => setValues({ ...values, [item.id]: e.target.value })}
            required
          />
        </fieldset>
      ))}
      <button type="submit">Submit for server scoring</button>
      <p className="meta">You cannot send your own score. Answers stay on the server until you submit.</p>
      {result ? (
        <section className="card" role="status">
          <h2>
            Score {result.earned} / {result.total}
          </h2>
          <p>CForge practice assessment — not a university examination.</p>
          {result.review.map((r) => (
            <p key={r.id}>
              <span className={r.correct ? "status-ok" : "status-bad"}>{r.correct ? "Correct" : "Review"}</span>
              {" — "}
              {r.marks}/{r.max}
            </p>
          ))}
          <h3>By topic</h3>
          <ul>
            {Object.entries(result.byTopic).map(([id, s]) => (
              <li key={id}>
                {id}: {s.earned}/{s.max}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </form>
  );
}
