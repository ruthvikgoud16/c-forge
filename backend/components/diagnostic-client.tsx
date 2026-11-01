"use client";

import { useState } from "react";

type Item = {
  id: string;
  topicId: string;
  method: string;
  kind: string;
  prompt: string;
  choices?: string[];
};

export function DiagnosticClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");

  async function start() {
    const res = await fetch("/api/v1/diagnostics", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Could not start");
      return;
    }
    setSessionId(data.id);
    setItems(data.items ?? []);
    setMessage("Session started. Keys are not in this page.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const answers = items.map((item) => ({
      itemId: item.id,
      value: item.kind === "mcq" ? Number(form.get(item.id)) : String(form.get(item.id) ?? ""),
    }));
    const res = await fetch(`/api/v1/diagnostics/${sessionId}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setMessage(res.ok ? `Saved. Placement updated for ${data.placements?.length ?? 0} topics.` : data.error);
  }

  return (
    <div className="card">
      <button type="button" onClick={start}>
        Start or retake diagnostic
      </button>
      {items.length ? (
        <form onSubmit={submit}>
          {items.map((item) => (
            <fieldset key={item.id}>
              <legend>
                {item.topicId} · {item.method}
              </legend>
              <p>{item.prompt}</p>
              {item.choices?.length ? (
                item.choices.map((choice, index) => (
                  <label key={choice} style={{ display: "block" }}>
                    <input type="radio" name={item.id} value={index} required /> {choice}
                  </label>
                ))
              ) : (
                <input name={item.id} required />
              )}
            </fieldset>
          ))}
          <button type="submit">Submit answers</button>
        </form>
      ) : null}
      {message ? <p className="meta">{message}</p> : null}
    </div>
  );
}
