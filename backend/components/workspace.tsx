"use client";

import { useState } from "react";
import { CEditor } from "./c-editor";

type PublicExercise = {
  id: string;
  title: string;
  objective: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCode: string;
  language: string;
  sample: { stdin: string; stdout: string };
};

export function Workspace({ exercise }: { exercise: PublicExercise }) {
  const [source, setSource] = useState(exercise.starterCode);
  const [stdin, setStdin] = useState(exercise.sample.stdin);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(mode: "run" | "submit") {
    setBusy(true);
    setLog("");
    const response = await fetch("/api/v1/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exerciseId: exercise.id, source, mode, stdin }),
    });
    const payload = await response.json();
    setLog(JSON.stringify(payload, null, 2));
    setBusy(false);
  }

  return (
    <div>
      <section className="card">
        <h1>{exercise.title}</h1>
        <p><strong>Objective.</strong> {exercise.objective}</p>
        <p><strong>Problem.</strong> {exercise.statement}</p>
        <p><strong>Input format.</strong> {exercise.inputFormat}</p>
        <p><strong>Output format.</strong> {exercise.outputFormat}</p>
        <p><strong>Constraints.</strong> {exercise.constraints}</p>
        <p><strong>Sample input.</strong> <code>{exercise.sample.stdin || "(empty)"}</code></p>
        <pre><strong>Sample output.</strong>{"\n"}{exercise.sample.stdout}</pre>
      </section>
      <section className="card">
        <p className="mono">Language: C</p>
        <CEditor value={source} onChange={setSource} />
        <label>
          Custom standard input (Run only)
          <textarea rows={4} value={stdin} onChange={(e) => setStdin(e.target.value)} />
        </label>
        <button disabled={busy} onClick={() => send("run")}>Run</button>
        <button className="secondary" disabled={busy} onClick={() => send("submit")}>
          Submit
        </button>
      </section>
      <section className="card">
        <p className="mono">Compilation, tests, status</p>
        <pre>{log || "No run yet."}</pre>
      </section>
    </div>
  );
}
