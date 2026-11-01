import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/art/motion";
import { INTENT_COPY, START_INTENTS, type StartIntent } from "@/lib/onboarding";
import { StudentJourney } from "@/components/learning/StudentJourney";
import { IS_DEMO, services } from "@/services";
import { rethrowIfRedirect } from "@/services/cforge-api";

export const Route = createFileRoute("/learn/onboarding")({
  loader: () => services.onboarding.get(),
  head: () => ({ meta: [{ title: "How do you want to start? — CForge" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const saved = Route.useLoaderData();
  const nav = useNavigate();
  const [intent, setIntent] = useState<StartIntent | null>(saved.startIntent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save() {
    if (!intent) return setError("Choose how you want to start.");
    setBusy(true);
    setError(null);
    try {
      await services.onboarding.save(intent);
      setOk(true);
      if (!IS_DEMO) {
        await nav({ to: "/learn/diagnostic" });
        return;
      }
    } catch (cause) {
      rethrowIfRedirect(cause);
      setError(cause instanceof Error ? cause.message : "Could not save preference.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <StudentJourney />
      <PageHeader
        eyebrow="Onboarding"
        title={<>How do you want to <em className="text-copper">start</em>?</>}
        lede="This is a preference, not a beginner or advanced label. CForge uses it to greet you. You can change it later."
      />
      {saved.startIntent && (
        <p className="text-sm text-muted-foreground" data-testid="onboarding-existing">
          Current preference: {INTENT_COPY[saved.startIntent].title}. Saving replaces it.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {START_INTENTS.map((id) => (
          <Reveal key={id}>
            <button
              type="button"
              onClick={() => setIntent(id)}
              aria-pressed={intent === id}
              data-testid={`intent-${id}`}
              className={`glass-panel w-full rounded-3xl p-5 text-left transition ${intent === id ? "ring-2 ring-copper" : "hover:bg-white/40"}`}
            >
              <p className="font-display text-xl">{INTENT_COPY[id].title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{INTENT_COPY[id].lede}</p>
            </button>
          </Reveal>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {ok && IS_DEMO && (
        <Panel>
          <p className="font-medium">Preference saved in this demo session.</p>
          <p className="mt-1 text-sm text-muted-foreground">The Unit 1 diagnostic is not available in demo mode.</p>
          <Button asChild variant="hero" className="mt-4"><Link to="/learn">Continue to dashboard</Link></Button>
        </Panel>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="hero" onClick={save} disabled={busy} data-testid="onboarding-save">
          {busy ? "Saving…" : saved.startIntent ? "Update preference" : "Save and continue"}
        </Button>
        <Button asChild variant="quiet"><Link to="/learn">Skip to dashboard</Link></Button>
        <Button asChild variant="quiet"><Link to="/learn/units">Browse units</Link></Button>
      </div>
    </div>
  );
}
