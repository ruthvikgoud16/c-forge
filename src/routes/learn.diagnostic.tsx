import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, EmptyState } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/art/motion";
import { PlacementResults } from "@/components/learning/PlacementResults";
import { StudentJourney } from "@/components/learning/StudentJourney";
import { assertNoAnswerKey, buildDiagnosticAnswers } from "@/lib/diagnostic";
import { IS_DEMO, services } from "@/services";
import { rethrowIfRedirect } from "@/services/cforge-api";
import type { DiagnosticSession, DiagnosticSubmitResult, PlacementSnapshot } from "@/domain/types";

export const Route = createFileRoute("/learn/diagnostic")({
  loader: async () => {
    const [sessions, placement] = await Promise.all([
      services.diagnostics.list(),
      services.placement.get().catch(() => ({ rubricVersion: "2d1-placement-v1", placementIsNotMastery: true as const, topics: [] })),
    ]);
    const open = sessions.find((session) => session.status === "open");
    const submitted = [...sessions].reverse().find((session) => session.status === "submitted");
    const active = open ? await services.diagnostics.get(open.id) : null;
    if (active) active.items.forEach(assertNoAnswerKey);
    return { sessions, placement, active, submitted };
  },
  head: () => ({ meta: [{ title: "Diagnostic — CForge" }] }),
  component: DiagnosticPage,
});

function DiagnosticPage() {
  const data = Route.useLoaderData();
  const [phase, setPhase] = useState<"intro" | "run" | "done">(data.active ? "run" : "intro");
  const [session, setSession] = useState<DiagnosticSession | null>(data.active);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticSubmitResult | null>(null);
  const [placement, setPlacement] = useState<PlacementSnapshot>(data.placement);
  const [showPlacement, setShowPlacement] = useState(false);
  const submittedOnce = useMemo(() => Boolean(result), [result]);
  const recordedPlacement = placement.topics.some((topic) => topic.placement && topic.placement !== "NOT_ASSESSED");

  const item = session?.items[index];

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const next = await services.diagnostics.start();
      next.items.forEach(assertNoAnswerKey);
      setSession(next);
      setIndex(0);
      setValues({});
      setPhase("run");
    } catch (cause) {
      rethrowIfRedirect(cause);
      setError(cause instanceof Error ? cause.message : "Could not start the diagnostic.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!session || submittedOnce) return;
    const missing = session.items.some((row) => values[row.id] == null || values[row.id] === "");
    if (missing) return setError("Answer every question before submitting.");
    setBusy(true);
    setError(null);
    try {
      const submitted = await services.diagnostics.submit(session.id, buildDiagnosticAnswers(session.items, values));
      const latest = await services.placement.get();
      setResult(submitted);
      setPlacement(latest);
      setPhase("done");
    } catch (cause) {
      rethrowIfRedirect(cause);
      const message = cause instanceof Error ? cause.message : "Could not submit.";
      setError(message === "already_submitted" ? "This diagnostic was already submitted." : message);
    } finally {
      setBusy(false);
    }
  }

  if (showPlacement && !result) {
    return <PlacementResults snapshot={placement} />;
  }

  if (IS_DEMO) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Diagnostic" title="Unit 1 placement check" lede="This is not a practice quiz. In demo mode the original diagnostic bank is not loaded." />
        <EmptyState title="Diagnostic unavailable in demo" body="Start the isolated CForge API to use the Unit 1 lesson bank. No sample questions are shown here." action={<Button asChild variant="hero"><Link to="/learn">Back to dashboard</Link></Button>} />
      </div>
    );
  }

  if (phase === "done" && result) {
    return <PlacementResults snapshot={placement} submit={result} />;
  }

  if (phase === "run" && session && item) {
    const total = session.items.length;
    return (
      <div className="space-y-8">
        <StudentJourney />
        <PageHeader
          eyebrow="Diagnostic"
          title="Show what you can do"
          lede="Questions come from existing Unit 1 lessons. Answer keys stay on the server. Placement is not mastery."
        />
        <div className="h-2 overflow-hidden rounded-full bg-foreground/8" aria-hidden>
          <div className="h-full rounded-full bg-copper transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">Question {index + 1} of {total} · {item.topicId} · {item.method}</p>
        <Reveal>
          <Panel>
            <p className="font-display text-2xl" data-testid="diagnostic-prompt">{item.prompt}</p>
            <fieldset className="mt-6 space-y-3">
              <legend className="sr-only">Your answer</legend>
              {item.kind === "mcq" && item.choices?.length ? (
                item.choices.map((choice, choiceIndex) => (
                  <label key={choice} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border px-4 py-3">
                    <input
                      type="radio"
                      name={item.id}
                      value={choiceIndex}
                      checked={values[item.id] === String(choiceIndex)}
                      onChange={() => setValues((current) => ({ ...current, [item.id]: String(choiceIndex) }))}
                    />
                    <span>{choice}</span>
                  </label>
                ))
              ) : (
                <Input
                  value={values[item.id] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [item.id]: event.target.value }))}
                  aria-label="Short answer"
                />
              )}
            </fieldset>
          </Panel>
        </Reveal>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="quiet" disabled={index === 0} onClick={() => setIndex((n) => n - 1)}>Previous</Button>
          {index < total - 1 ? (
            <Button variant="hero" onClick={() => setIndex((n) => n + 1)}>Next</Button>
          ) : (
            <Button variant="hero" onClick={submit} disabled={busy || submittedOnce} data-testid="diagnostic-submit">
              {busy ? "Submitting…" : "Submit to the server"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentJourney />
      <PageHeader
        eyebrow="Diagnostic"
        title={<>A short check, not a <em className="text-copper">test score</em></>}
        lede="The original backend builds this from Unit 1 lesson items. You may retake later. Earlier attempts stay on the server."
      />
      {data.submitted && (
        <Panel>
          <p className="font-medium">You already have a submitted diagnostic.</p>
          <p className="mt-1 text-sm text-muted-foreground">Starting again creates a new session. Placement is still not mastery.</p>
          <Button asChild variant="quiet" className="mt-4"><Link to="/learn">Review later from the dashboard</Link></Button>
        </Panel>
      )}
      {data.active && <p className="text-sm text-muted-foreground">An open session is waiting. Continue below.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button variant="hero" onClick={() => (data.active ? setPhase("run") : start())} disabled={busy} data-testid="diagnostic-start">
          {busy ? "Starting…" : data.active ? "Continue open session" : "Start diagnostic"}
        </Button>
        <Button asChild variant="quiet"><Link to="/learn">Not now</Link></Button>
        {recordedPlacement ? <Button variant="quiet" onClick={() => setShowPlacement(true)}>See recorded placement</Button> : null}
        <Button asChild variant="quiet"><Link to="/learn/foundation">Foundation labels</Link></Button>
      </div>
    </div>
  );
}
