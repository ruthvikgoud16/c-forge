import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { services } from "@/services";
import { rethrowIfRedirect } from "@/services/cforge-api";
import {
  checkResultMessage,
  publicCheckPayload,
  type CheckItem,
  type LessonCheckFailure,
  type LessonCheckResult,
  type LessonCheckSlot,
  type SlotPrompt,
} from "@/lib/teaching";

function resultCopy(result: LessonCheckResult | LessonCheckFailure) {
  if (!result.ok) {
    if (result.error === "session_expired") return "Your session expired. Sign in again to submit.";
    if (result.error === "demo_unscored") return "Demo mode does not score lesson checks. The original API grades these.";
    if (result.error === "unknown_item") return "This item is not on the original lesson.";
    if (result.error === "not_found") return "The original lesson was not found.";
    return "The original checker could not grade this attempt.";
  }
  return checkResultMessage(result);
}

export function SlotCheck({
  lessonId,
  item,
  source,
}: {
  lessonId: string | null;
  item: SlotPrompt;
  source: "demo" | "original";
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LessonCheckResult | LessonCheckFailure | null>(null);
  const locked = Boolean(result && (result.ok || result.error === "demo_unscored"));

  async function submit() {
    if (locked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const graded = publicCheckPayload(await services.teaching.check({
        lessonId: lessonId ?? "",
        slot: item.slot,
        value,
      }));
      setResult(graded);
    } catch (cause) {
      rethrowIfRedirect(cause);
      setError(cause instanceof Error ? cause.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-panel rounded-2xl p-5">
      <p className="eyebrow">{item.slot}</p>
      <p className="mt-2 leading-7">{item.prompt}</p>
      {item.hint ? <p className="mt-2 text-sm text-muted-foreground">Learning-mode hint (not a score): {item.hint}</p> : null}
      <Input className="mt-4" value={value} disabled={locked || busy} onChange={(event) => setValue(event.target.value)} aria-label={`${item.slot} answer`} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="hero" size="sm" disabled={locked || busy || source === "demo"} onClick={() => void submit()}>
          {busy ? "Checking…" : locked ? "Submitted" : "Check with original"}
        </Button>
        {error ? <Button type="button" variant="quiet" size="sm" onClick={() => void submit()}>Retry</Button> : null}
      </div>
      {source === "demo" ? <p className="mt-3 text-sm text-muted-foreground">Demo material is not scored locally.</p> : null}
      {error ? <p className="mt-3 text-sm text-ember" role="alert">{error}</p> : null}
      {result ? <p className="mt-3 text-sm" role="status">{resultCopy(result)}</p> : null}
    </section>
  );
}

export function KnowledgeChecks({
  lessonId,
  items,
  source,
}: {
  lessonId: string | null;
  items: CheckItem[];
  source: "demo" | "original";
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, LessonCheckResult | LessonCheckFailure>>({});
  const submitted = Object.keys(results).length > 0;

  async function submit() {
    if (submitted || busy || !lessonId) return;
    setBusy(true);
    setError(null);
    try {
      const next: Record<string, LessonCheckResult | LessonCheckFailure> = {};
      for (const item of items) {
        next[item.id] = publicCheckPayload(await services.teaching.check({
          lessonId,
          slot: "check" satisfies LessonCheckSlot,
          value: item.kind === "mcq" ? Number(values[item.id]) : (values[item.id] ?? ""),
          itemId: item.id,
        }));
      }
      setResults(next);
    } catch (cause) {
      rethrowIfRedirect(cause);
      setError(cause instanceof Error ? cause.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) return null;

  return (
    <section className="glass-panel rounded-2xl p-5">
      <h2 className="font-display text-xl">Knowledge check</h2>
      <p className="mt-1 text-sm text-muted-foreground">Scores come from the original lesson-check API. This is not placement or mastery.</p>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            <p className="font-medium">{item.prompt}</p>
            {item.kind === "mcq" && item.choices ? (
              <select
                className="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={values[item.id] ?? ""}
                disabled={submitted || busy}
                onChange={(event) => setValues({ ...values, [item.id]: event.target.value })}
                aria-label={item.prompt}
              >
                <option value="">Choose</option>
                {item.choices.map((choice, index) => (
                  <option key={choice} value={String(index)}>{choice}</option>
                ))}
              </select>
            ) : (
              <Input className="mt-2" value={values[item.id] ?? ""} disabled={submitted || busy} onChange={(event) => setValues({ ...values, [item.id]: event.target.value })} aria-label={item.prompt} />
            )}
            {results[item.id] ? <p className="mt-2 text-sm" role="status">{resultCopy(results[item.id]!)}</p> : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="hero" size="sm" disabled={submitted || busy || source === "demo" || !lessonId} onClick={() => void submit()}>
          {busy ? "Checking…" : submitted ? "Submitted" : "Check answers"}
        </Button>
        {error ? <Button type="button" variant="quiet" size="sm" onClick={() => { setResults({}); void submit(); }}>Retry</Button> : null}
      </div>
      {source === "demo" ? <p className="mt-3 text-sm text-muted-foreground">Demo mode never scores these locally.</p> : null}
      {error ? <p className="mt-3 text-sm text-ember" role="alert">{error}</p> : null}
    </section>
  );
}
