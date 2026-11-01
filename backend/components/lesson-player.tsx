"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LessonVisuals } from "./lesson-visuals";

type Lesson = {
  id: string;
  topicId: string;
  title: string;
  classification: string;
  mode: string;
  sourceLabel: string;
  exerciseId?: string;
  completionCriteria?: string[];
  prerequisites?: Array<{ id: string; label: string; href: string }>;
  objectives?: string[];
  notes?: {
    introduction?: string;
    beginner?: string;
    formal?: string;
    terms?: Array<{ term: string; meaning: string }>;
    revision?: string[];
    examAnswer?: string;
  };
  body: Record<string, unknown>;
};

export function LessonPlayer({ lesson, initialState }: { lesson: Lesson; initialState: string | null }) {
  const [state] = useState(initialState);
  const [checkLog, setCheckLog] = useState<string>("");
  const body = lesson.body;
  const visual = body.visual as Record<string, unknown> | undefined;
  const guided = body.guided as { hint?: string; prompt?: string; task?: string; expected?: string[] } | undefined;
  const guidedHint = String(guided?.hint ?? "");
  const guidedPrompt = String(guided?.prompt ?? guided?.task ?? "");
  const independent = body.independent as { prompt?: string; task?: string; answer?: string; dimension?: string } | undefined;
  const checks = (body.check as Array<Record<string, unknown>>) ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const sections = useMemo(
    () => [
      ["Learning objectives", lesson.objectives?.map((o) => `• ${o}`).join("\n")],
      ["Prerequisite check", body.prerequisiteCheck],
      ["Concept introduction", body.introduction],
      ["Analogy", body.analogy],
      ["Detailed explanation", body.explanation],
      ["Syntax and terminology", body.syntax],
    ],
    [lesson, body],
  );

  async function checkSlot(slot: string, value: string, itemId?: string) {
    const response = await fetch(`/api/v1/curriculum/lessons/${encodeURIComponent(lesson.id)}/check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slot, value, itemId }),
    });
    const payload = await response.json();
    return { correct: Boolean(payload.correct), unscored: Boolean(payload.unscored) };
  }

  async function submitChecks() {
    let all = true;
    const lines: string[] = [];
    for (const item of checks) {
      const id = String(item.id);
      const given = answers[id] ?? "";
      const graded = await checkSlot("check", given, id);
      if (!graded.correct) all = false;
      lines.push(`${id}: ${graded.correct ? "correct" : "not yet"}`);
    }
    setCheckLog(lines.join("\n") + (all ? "\nKnowledge check passed. Mastery still needs independent work." : ""));
  }

  const present = sections.filter(([, text]) => Boolean(text));

  return (
    <article className="learn-read">
      <p className="brand">
        {lesson.classification} · {lesson.mode} mode · topic state: {state ?? "not started"}
      </p>
      <h1>{lesson.title}</h1>
      <p className="meta">Source wording: {lesson.sourceLabel}</p>
      {present.length ? (
        <nav className="learn-sections" aria-label="In this lesson">
          {present.map(([title]) => (
            <a key={String(title)} href={`#${slug(String(title))}`}>
              {title}
            </a>
          ))}
        </nav>
      ) : null}
      {lesson.prerequisites?.length ? (
        <p>
          If this feels new, repair the gap first:{" "}
          {lesson.prerequisites.map((p) => (
            <Link key={p.id} href={p.href}>
              {p.label}
            </Link>
          ))}
        </p>
      ) : null}

      {lesson.objectives?.length ? (
        <section className="card" id="learning-objectives">
          <h2>Learning objectives</h2>
          <ul>
            {lesson.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {sections
        .filter(([title]) => title !== "Learning objectives")
        .map(([title, text]) =>
          text ? (
            <section className="card" id={slug(String(title))} key={title}>
              <h2>{title}</h2>
              <Prose text={String(text)} />
            </section>
          ) : null,
        )}

      <LessonVisuals visual={visual} />

      {lesson.notes ? (
        <section className="card" id="notes">
          <h2>Notes</h2>
          <p>{lesson.notes.beginner}</p>
          <p>
            <strong>Formal definition.</strong> {lesson.notes.formal}
          </p>
          <ul>
            {lesson.notes.terms?.map((t) => (
              <li key={t.term}>
                <strong>{t.term}.</strong> {t.meaning}
              </li>
            ))}
          </ul>
          <p>
            <strong>Examination-ready answer.</strong> {lesson.notes.examAnswer}
          </p>
        </section>
      ) : null}

      {Array.isArray(body.examples)
        ? (body.examples as Array<{ title: string; problem?: string; steps: string[]; code?: string; output?: string }>).map(
            (ex) => (
              <section className="card" key={ex.title}>
                <h2>Worked example: {ex.title}</h2>
                {ex.problem ? <p>{ex.problem}</p> : null}
                <ol>
                  {ex.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {ex.code ? <pre>{ex.code}</pre> : null}
                {ex.output ? <p>Output: {ex.output}</p> : null}
              </section>
            ),
          )
        : null}

      {body.execution ? (
        <section className="card">
          <h2>Step-by-step execution</h2>
          <p>{String(body.execution)}</p>
        </section>
      ) : null}

      <PredictBox
        title="Code tracing"
        item={body.trace as { prompt: string; dimension: string }}
        onCheck={(value) => checkSlot("trace", value)}
      />
      <PredictBox
        title="Output prediction"
        item={body.predict as { prompt: string; dimension: string }}
        onCheck={(value) => checkSlot("predict", value)}
      />

      {Array.isArray(body.mistakes) ? (
        <section className="card">
          <h2>Common misconceptions</h2>
          <ul>
            {(body.mistakes as Array<string | { wrong?: string; why?: string }>).map((m) => {
              const text = typeof m === "string" ? m : `${m.wrong ?? ""} — ${m.why ?? ""}`;
              return <li key={text}>{text}</li>;
            })}
          </ul>
        </section>
      ) : null}

      <PredictBox
        title="Guided practice"
        item={{
          prompt: guidedPrompt,
          dimension: "concept",
        }}
        onCheck={(value) => checkSlot("guided", value)}
        hint={guidedHint || undefined}
      />
      {lesson.exerciseId ? (
        <p className="card">
          Coding uses the existing judge, not the academy process.{" "}
          <Link href={`/studio/${lesson.exerciseId}`}>Open the linked C exercise</Link>
        </p>
      ) : null}

      <PredictBox
        title="Independent practice"
        item={{
          prompt: String(independent?.prompt ?? independent?.task ?? ""),
          dimension: String(independent?.dimension ?? "independent_write"),
        }}
        onCheck={(value) => checkSlot("independent", value)}
      />

      <section className="card">
        <h2>Knowledge check</h2>
        {checks.map((item) => (
          <label key={String(item.id)}>
            {String(item.prompt)}
            {item.kind === "mcq" ? (
              <select
                value={answers[String(item.id)] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [String(item.id)]: e.target.value })}
              >
                <option value="">Choose</option>
                {(item.choices as string[]).map((c, i) => (
                  <option key={c} value={String(i)}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={answers[String(item.id)] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [String(item.id)]: e.target.value })}
              />
            )}
          </label>
        ))}
        <button type="button" onClick={submitChecks}>
          Check answers
        </button>
        {checkLog ? <pre>{checkLog}</pre> : null}
      </section>

      {lesson.completionCriteria?.length ? (
        <section className="card">
          <h2>Completion criteria</h2>
          <ul>
            {lesson.completionCriteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="meta">Opening this page is not completion.</p>
        </section>
      ) : null}

      <section className="card">
        <h2>Lesson summary</h2>
        <p>{String(body.summary ?? "")}</p>
        <h3>Revision prompts</h3>
        <ul>
          {((body.revision as string[]) ?? []).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Prose({ text }: { text: string }) {
  const code = /;\s*$|#include|\{/.test(text);
  if (code) return <pre>{text}</pre>;
  return (
    <div className="learn-prose">
      {text.split(/\n\n+/).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function PredictBox({
  title,
  item,
  onCheck,
  hint,
}: {
  title: string;
  item?: { prompt: string; dimension: string };
  onCheck: (value: string) => Promise<{ correct: boolean; unscored: boolean }>;
  hint?: string;
}) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  if (!item?.prompt) return null;
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{item.prompt}</p>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button
        type="button"
        onClick={() => {
          void onCheck(value).then((graded) => {
            if (graded.unscored) {
              setMsg("Write your attempt here. The topic assessment is where answers are scored.");
              return;
            }
            setMsg(graded.correct ? "That matches the expected idea." : "Not yet. Read the diagram again.");
          });
        }}
      >
        Check
      </button>
      {hint ? <p className="meta">Learning mode hint (no penalty): {hint}</p> : null}
      {msg ? <p>{msg}</p> : null}
    </section>
  );
}
