import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, DemoBadge } from "@/components/common/bits";
import { highlightC } from "@/components/common/CodeBlock";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { services } from "@/services";
import type { PreviewResult } from "@/domain/types";
import { topicHead } from "@/lib/topic-loader";
import { Ring } from "@/components/art/Ring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/assessments/$assessmentId")({
  loader: async ({ params }) => {
    const a = await services.assessments.get(params.assessmentId);
    if (!a) throw notFound();
    return a;
  },
  head: ({ loaderData }) => topicHead(`Assessment: ${loaderData?.title ?? "Assessment"}`, "CForge preview assessment."),
  component: Runner,
});

const TYPE_LABEL = { "single-choice": "Single choice", "predict-output": "Predict the output", "true-false": "True / false" };

function Runner() {
  const a = Route.useLoaderData();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const q = a.questions[i]!;
  const answered = Object.keys(answers).length;

  async function submit() {
    setResult(await services.assessments.previewScore(a.id, answers));
    setConfirm(false);
  }

  const crumbs = [{ label: "Assessments", to: "/learn/assessments" }, { label: a.title }];

  if (result) {
    return (
      <>
        <PageHeader crumbs={crumbs} eyebrow={`${a.kind} assessment · preview result`} title={`${result.correct} of ${result.total} correct`} lede="This score was calculated in your browser for preview only. It is not authoritative and has not been saved." actions={<DemoBadge>Preview result</DemoBadge>} />
        <section className="glass-panel cf-pop mb-8 grid items-center gap-6 rounded-[2rem] p-6 md:grid-cols-[auto_1fr]" data-testid="assessment-result-summary">
          <Ring value={result.correct} max={result.total} size={150} stroke={14} color={result.correct / result.total >= 0.7 ? "var(--color-success)" : result.correct / result.total >= 0.4 ? "var(--color-gold)" : "var(--color-destructive)"}>
            <span><span className="block font-display text-4xl">{Math.round((result.correct / result.total) * 100)}%</span><span className="text-[11px] text-muted-foreground">{result.correct}/{result.total}</span></span>
          </Ring>
          <div>
            <p className="eyebrow">Question by question</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.perQuestion.map((r, n) => <span key={r.questionId} className={cn("cf-pop grid size-9 place-items-center rounded-xl font-mono text-xs text-pearl", r.correct ? "bg-success" : "bg-destructive")} style={{ animationDelay: `${n * 60}ms` }}>{n + 1}</span>)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{result.correct === result.total ? "Every answer correct. Try the unit assessment next." : `${result.total - result.correct} to review below. Revisit the lesson or flashcards for those ideas.`}</p>
          </div>
        </section>
        <ol className="space-y-4">
          {a.questions.map((qq, n) => {
            const r = result.perQuestion[n]!;
            return (
              <li key={qq.id} className={`cf-pop glass-panel rounded-2xl border-l-4 p-4 ${r.correct ? "!border-l-success" : "!border-l-destructive"}`} style={{ animationDelay: `${n * 50}ms` }}>
                <p className="flex items-start gap-2 font-medium">{r.correct ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}{n + 1}. {qq.prompt}</p>
                <p className="mt-2 text-sm text-muted-foreground">Correct answer: <span className="text-foreground">{qq.options.find((o) => o.id === r.correctOptionId)?.label}</span></p>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex gap-2">
          <Button variant="hero" className="press rounded-full" onClick={() => { setResult(null); setAnswers({}); setI(0); }} data-testid="assessment-retry">Retry</Button>
          <Button asChild variant="quiet"><Link to="/learn/assessments">All assessments</Link></Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader crumbs={crumbs} eyebrow={`${a.kind} assessment`} title={a.title} actions={<DemoBadge>Demonstration questions</DemoBadge>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section key={q.id} className="glass-panel cf-pop relative overflow-hidden rounded-[2rem] p-6 md:p-8" aria-labelledby="qprompt" data-testid="assessment-question">
          <span className="pointer-events-none absolute -bottom-12 right-2 select-none font-display text-[8rem] leading-none text-copper/10" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
          <div className="relative flex items-center justify-between text-sm"><span className="font-mono">Question {i + 1} / {a.questions.length}</span><span className="rounded-full bg-copper/10 px-3 py-0.5 text-xs text-copper">{TYPE_LABEL[q.type]}</span></div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/8"><div className="h-full rounded-full bg-gradient-to-r from-copper to-ember transition-all duration-500" style={{ width: `${((i + 1) / a.questions.length) * 100}%` }} /></div>
          <h2 id="qprompt" className="relative mt-5 font-display text-2xl">{q.prompt}</h2>
          {q.code && <pre className="mt-4 overflow-x-auto rounded-xl bg-code p-4 font-mono text-xs leading-5 text-code-foreground">{highlightC(q.code)}</pre>}
          <fieldset className="mt-6 space-y-2">
            <legend className="sr-only">Options</legend>
            {q.options.map((o, k) => {
              const sel = answers[q.id] === o.id;
              return (
                <label key={o.id} className={`press flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all duration-300 ${sel ? "translate-x-1 border-copper bg-copper/10 shadow-md" : "border-white bg-white/50 hover:bg-white/80"}`}>
                  <input type="radio" name={q.id} checked={sel} onChange={() => setAnswers((s) => ({ ...s, [q.id]: o.id }))} className="sr-only" />
                  <span className={`grid size-8 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold transition-colors ${sel ? "bg-copper text-pearl" : "bg-foreground/8"}`}>{String.fromCharCode(65 + k)}</span>
                  <span className={q.type === "predict-output" ? "font-mono text-sm" : ""}>{o.label}</span>
                </label>
              );
            })}
          </fieldset>
          <div className="mt-6 flex justify-between">
            <Button variant="quiet" disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</Button>
            {i < a.questions.length - 1 ? <Button variant="ink" onClick={() => setI(i + 1)}>Next →</Button> : <Button variant="hero" onClick={() => setConfirm(true)}>Submit</Button>}
          </div>
        </section>
        <aside className="glass-panel h-fit rounded-3xl p-4">
          <div className="mb-3 flex justify-center"><Ring value={answered} max={a.questions.length} size={96} stroke={10}><span className="font-mono text-sm">{answered}/{a.questions.length}</span></Ring></div>
          <p className="eyebrow mb-2">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {a.questions.map((qq, n) => (
              <button key={qq.id} onClick={() => setI(n)} aria-label={`Question ${n + 1}${answers[qq.id] ? ", answered" : ""}`} aria-current={n === i} className={`press h-9 rounded-xl border font-mono text-xs transition-all ${n === i ? "scale-110 border-copper ring-2 ring-copper/40" : "border-white"} ${answers[qq.id] ? "bg-copper text-pearl" : "bg-white/60"}`}>{n + 1}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{answered} of {a.questions.length} answered</p>
          <Button variant="hero" className="press mt-4 w-full rounded-full" onClick={() => setConfirm(true)} data-testid="assessment-submit">Submit</Button>
        </aside>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit assessment?</AlertDialogTitle>
            <AlertDialogDescription>{answered < a.questions.length ? `${a.questions.length - answered} question(s) are unanswered. ` : ""}In demo mode the result is a preview and is not saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep working</AlertDialogCancel><AlertDialogAction onClick={submit}>Submit</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
