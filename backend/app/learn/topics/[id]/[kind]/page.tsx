import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { packageForTopic } from "@/lib/content/registry";
import { recordProgress } from "@/lib/curriculum/progress";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { StudyLinks } from "@/components/learn/study-links";
import { MindMap } from "@/components/mind-map";
import { VisualTool } from "@/components/visualizers/tools";

const KINDS = [
  "notes",
  "oneshot",
  "mind-map",
  "quick",
  "concepts",
  "flashcards",
  "examples",
  "trace",
  "predict",
  "syntax",
  "practice",
] as const;

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string; kind: string }>;
}) {
  const { id, kind } = await params;
  if (!KINDS.includes(kind as (typeof KINDS)[number])) notFound();
  const session = await readSession();
  if (!session) redirect("/login");
  const pkg = packageForTopic(id);
  if (!pkg) notFound();
  if (kind === "notes") {
    recordProgress({ studentId: session.studentId, topicId: id, kind: "notes_viewed", dimension: "concept", assisted: false });
  }
  if (kind === "oneshot") {
    recordProgress({
      studentId: session.studentId,
      topicId: id,
      kind: "oneshot_completed",
      dimension: "revision",
      assisted: false,
    });
  }
  return (
    <>
      <StudyLinks topicId={id} current={kind} />
      <p className="brand">
        <Link href={`/learn/topics/${id}`}>Topic hub</Link>
      </p>
      <h1 className="learn-read">
        {pkg.lesson.title} — {kind}
      </h1>
      {kind === "notes" ? (
        <article className="card learn-read">
          <p>{pkg.notes.introduction}</p>
          <h2>Definitions</h2>
          <ul>
            {pkg.notes.definitions.map((d) => (
              <li key={d.term}>
                <strong>{d.term}</strong>: {d.meaning}
              </li>
            ))}
          </ul>
          <h2>Explanation</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{pkg.notes.explanation}</p>
          <h2>Syntax</h2>
          <pre>{pkg.notes.syntax}</pre>
          <h2>Distinctions</h2>
          <ul>
            {pkg.notes.distinctions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h2>Mistakes</h2>
          <ul>
            {pkg.notes.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <h2>Short-answer revision</h2>
          <ul>
            {pkg.notes.examShort.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <h2>Long-answer revision</h2>
          <p>{pkg.notes.examLong}</p>
          <p className="meta">These are CForge study notes, not official university marks.</p>
        </article>
      ) : null}
      {kind === "oneshot" ? (
        <article className="card">
          <p>{pkg.oneShot.overview}</p>
          <ol>
            {pkg.oneShot.sequence.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h2>Definitions</h2>
          <ul>
            {pkg.oneShot.definitions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h2>Rules</h2>
          <ul>
            {pkg.oneShot.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h2>Walkthrough</h2>
          <p>{pkg.oneShot.walkthrough}</p>
          <h2>Takeaways</h2>
          <ul>
            {pkg.oneShot.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p>
            Self-check: {pkg.oneShot.endCheck.prompt} — think first, then open the topic assessment.
          </p>
          <p>
            <Link href={`/learn/lessons/${pkg.lesson.id}`}>Deep lesson</Link>
          </p>
        </article>
      ) : null}
      {kind === "mind-map" ? (
        <MindMap
          title={pkg.lesson.mindMap?.title ?? pkg.lesson.title}
          children={(
            (pkg.lesson.mindMap?.children as Array<{ title: string; topicId?: string }> | undefined) ?? []
          ).map((child) => ({
            id: `${child.title}-${child.topicId ?? "node"}`,
            title: child.title,
            href: child.topicId ? `/learn/topics/${child.topicId}` : undefined,
          }))}
        />
      ) : null}
      {kind === "quick" ? (
        <ul>
          {pkg.quickNotes.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      ) : null}
      {kind === "concepts" ? (
        <ul>
          {pkg.concepts.map((c) => (
            <li key={c.id}>
              <strong>{c.prompt}</strong>
              <p>{c.explanation}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {kind === "flashcards" ? <FlashcardDeck cards={pkg.flashcards} topicId={id} /> : null}
      {kind === "examples" ? (
        pkg.examples.map((ex) => (
          <article key={ex.title} className="card">
            <h2>{ex.title}</h2>
            <p>{ex.problem}</p>
            <ol>
              {ex.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {ex.code ? <pre>{ex.code}</pre> : null}
            {ex.output ? <p>Output: {ex.output}</p> : null}
          </article>
        ))
      ) : null}
      {kind === "trace" ? (
        <article className="card">
          <p>{pkg.oneShot.endCheck.prompt}</p>
          <p className="meta">Submit the topic assessment to see the checked answer. Keys stay server-side there.</p>
        </article>
      ) : null}
      {kind === "predict" ? (
        <article className="card">
          <p>{String((pkg.lesson.body.predict as { prompt?: string })?.prompt ?? "")}</p>
        </article>
      ) : null}
      {kind === "syntax" ? (
        <ul>
          {pkg.syntaxRows.map((r) => (
            <li key={r.token}>
              <code>{r.token}</code> — {r.meaning}
            </li>
          ))}
        </ul>
      ) : null}
      {kind === "practice" ? (
        <article className="card">
          <h2>Guided</h2>
          <p>{pkg.practice?.guided}</p>
          <h2>Independent</h2>
          <p>{pkg.practice?.independent}</p>
          {pkg.practice?.exerciseId ? (
            <p>
              <Link href={`/studio/${pkg.practice.exerciseId}`}>Open judge exercise</Link>
            </p>
          ) : (
            <p className="meta">Write the program on paper or in the studio later. This is CForge supplementary practice, not an official lab.</p>
          )}
        </article>
      ) : null}
      {pkg.visualizerIds[0] && kind === "notes" ? <VisualTool id={pkg.visualizerIds[0]} /> : null}
    </>
  );
}
