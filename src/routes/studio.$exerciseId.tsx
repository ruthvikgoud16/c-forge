import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Loader2, Play, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DemoBadge } from "@/components/common/bits";
import { services } from "@/services";
import type { JudgeResult } from "@/domain/types";
import { topicHead } from "@/lib/topic-loader";
import { highlightC } from "@/components/common/CodeBlock";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/studio/$exerciseId")({
  loader: async ({ params }) => {
    const ex = await services.exercises.get(params.exerciseId);
    if (!ex) throw notFound();
    const all = await services.exercises.list();
    const i = all.findIndex((e) => e.id === ex.id);
    return { ex, prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
  },
  head: ({ loaderData }) => topicHead(loaderData?.ex.title ?? "Exercise", loaderData?.ex.statement ?? "CForge exercise"),
  component: Workspace,
});

function Workspace() {
  const { ex, prev, next } = Route.useLoaderData();
  const [code, setCode] = useState(ex.starterCode);
  const [stdin, setStdin] = useState(ex.samples[0]?.input ?? "");
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [res, setRes] = useState<JudgeResult | null>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLPreElement>(null);
  const lines = code.split("\n").length;

  async function go(mode: "run" | "submit") {
    setBusy(mode);
    setRes(mode === "run" ? await services.judge.run(ex.id, code, stdin) : await services.judge.submit(ex.id, code));
    setBusy(null);
  }

  return (
    <div key={ex.id} className="grid lg:h-[calc(100vh-3rem)] lg:grid-cols-[minmax(20rem,0.8fr)_1.2fr]">
      <section className="overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between text-sm">
          {prev ? <Link to="/studio/$exerciseId" params={{ exerciseId: prev.id }} className="text-muted-foreground hover:text-foreground">← Prev</Link> : <span />}
          {next && <Link to="/studio/$exerciseId" params={{ exerciseId: next.id }} className="text-muted-foreground hover:text-foreground">Next →</Link>}
        </div>
        <span className="mt-4 inline-block rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">{ex.difficulty}</span>
        <h1 className="mt-2 font-display text-3xl">{ex.title}</h1>
        <p className="mt-3 leading-7">{ex.statement}</p>
        <h2 className="mt-6 text-sm font-semibold">Input</h2><p className="text-sm text-muted-foreground">{ex.inputFormat}</p>
        <h2 className="mt-4 text-sm font-semibold">Output</h2><p className="text-sm text-muted-foreground">{ex.outputFormat}</p>
        <h2 className="mt-4 text-sm font-semibold">Constraints</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">{ex.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
        {ex.samples.map((s, i) => (
          <div key={i} className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
            <div><p className="mb-1 text-muted-foreground">Sample input</p><pre className="rounded-lg bg-code p-3">{s.input || "(none)"}</pre></div>
            <div><p className="mb-1 text-muted-foreground">Sample output</p><pre className="rounded-lg bg-code p-3">{s.output}</pre></div>
          </div>
        ))}
        <p className="mt-6 text-xs text-muted-foreground">{ex.hiddenTestCount} hidden tests run on submit. Their inputs are never shown.</p>
      </section>
      <section className="flex min-h-[80vh] flex-col lg:min-h-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">C · main.c</span>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => { setCode(ex.starterCode); setRes(null); }}><RotateCcw /> Reset</Button>
          <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => go("run")}>{busy === "run" ? <Loader2 className="animate-spin" /> : <Play />} Run</Button>
          <Button size="sm" disabled={!!busy} onClick={() => go("submit")}>{busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />} Submit</Button>
        </div>
        <div className="relative flex min-h-72 flex-1 overflow-hidden bg-code">
          {busy && <div className="cf-shine pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-ember/60" aria-hidden />}
          <div ref={gutter} aria-hidden className="select-none overflow-hidden py-3 pl-3 pr-2 text-right font-mono text-[13px] leading-6 text-code-comment/60">
            {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <div className="relative flex-1">
          <pre ref={hl} aria-hidden className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre py-3 pr-4 font-mono text-[13px] leading-6 text-code-foreground"><code>{highlightC(code)}{"\n"}</code></pre>
          <textarea aria-label="C code editor" data-testid="studio-editor" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; if (hl.current) { hl.current.scrollTop = e.currentTarget.scrollTop; hl.current.scrollLeft = e.currentTarget.scrollLeft; } }}
            onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, s = t.selectionStart; setCode(code.slice(0, s) + "    " + code.slice(t.selectionEnd)); requestAnimationFrame(() => t.setSelectionRange(s + 4, s + 4)); } }}
            className="absolute inset-0 h-full w-full resize-none whitespace-pre bg-transparent py-3 pr-4 font-mono text-[13px] leading-6 text-transparent caret-[var(--ember)] outline-none selection:bg-ember/30" wrap="off" />
          </div>
        </div>
        <div className="grid border-t border-border md:grid-cols-2">
          <div className="border-b border-border p-3 md:border-b-0 md:border-r">
            <label htmlFor="stdin" className="text-xs font-semibold text-muted-foreground">Standard input</label>
            <Textarea id="stdin" value={stdin} onChange={(e) => setStdin(e.target.value)} className="mt-1 h-28 resize-none font-mono text-xs" />
          </div>
          <div className="max-h-56 overflow-y-auto p-3" aria-live="polite">
            <div className="flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">Output</span>{res && <DemoBadge>Simulated result</DemoBadge>}</div>
            {!res ? <p className="mt-2 text-sm text-muted-foreground">Run your code to see compiler feedback here.</p> : (
              <div className="mt-2 space-y-2 font-mono text-xs">
                <div className={`cf-pop flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${res.verdict === "accepted" ? "bg-success/15 text-success" : res.verdict === "compile-error" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`} data-testid="studio-verdict">
                  {res.verdict === "accepted" ? <CheckCircle2 className="size-4" /> : res.verdict === "compile-error" ? <AlertTriangle className="size-4" /> : <XCircle className="size-4" />}{res.verdict.replace("-", " ").toUpperCase()}
                  {res.tests && <span className="ml-auto font-mono text-xs font-normal">{res.tests.filter((t) => t.passed).length}/{res.tests.length} tests</span>}
                </div>
                <pre className="whitespace-pre-wrap text-muted-foreground">{res.compilerOutput}</pre>
                {res.stdout && <pre className="whitespace-pre-wrap">{res.stdout}</pre>}
                {res.tests && <ul className="grid grid-cols-2 gap-1.5">{res.tests.map((t, k) => <li key={t.name} style={{ animationDelay: `${k * 120}ms` }} className={`cf-pop flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${t.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{t.passed ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />} {t.name}</li>)}</ul>}
                <p className="text-muted-foreground">Not real execution — the secure CForge judge will be connected later.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
