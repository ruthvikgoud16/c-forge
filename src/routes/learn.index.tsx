import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Brain, Sparkles } from "lucide-react";
import { DemoBadge } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { services } from "@/services";
import { UnitArt, unitGradient } from "@/components/art/UnitArt";
import { ToolPreview, TOOL_TINT } from "@/components/art/ToolPreview";
import { Donut, Meter, Ring } from "@/components/art/Ring";
import { CountUp, Reveal } from "@/components/art/motion";
import { AdaptiveLink } from "@/components/learning/AdaptiveLink";
import { StudentJourney } from "@/components/learning/StudentJourney";
import { dashboardIntro, nextActionLabel } from "@/lib/adaptive";
import { placementText } from "@/lib/diagnostic";
import type { UnitId } from "@/domain/types";

export const Route = createFileRoute("/learn/")({
  loader: async () => {
    const me = await services.student.me();
    const [dashboard, next, tools, sessions] = await Promise.all([
      services.adaptive.dashboard(),
      services.adaptive.next(),
      services.visualizers.list(),
      services.diagnostics.list().catch(() => []),
    ]);
    return { me, dashboard, next, tools, sessions };
  },
  head: () => ({ meta: [{ title: "Dashboard — CForge" }, { name: "description", content: "Your CForge learning dashboard." }, { property: "og:title", content: "Dashboard — CForge" }, { property: "og:description", content: "Continue learning C with CForge." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { me, dashboard, next, tools, sessions } = Route.useLoaderData();
  const recommendation = next ?? dashboard.recommendedNext;
  const analytics = dashboard.analytics;
  const teaching = analytics.unitProgress.reduce((sum, unit) => sum + unit.teachingTopics, 0);
  const demonstrated = analytics.demonstrated.length;
  const mastered = analytics.mastered.length;
  const opened = analytics.unitProgress.reduce((sum, unit) => sum + unit.opened, 0);
  const practised = analytics.unitProgress.reduce((sum, unit) => sum + unit.practised, 0);
  const intro = dashboardIntro({
    startIntent: dashboard.startIntent,
    openDiagnostic: sessions.some((session) => session.status === "open"),
    submittedDiagnostic: sessions.some((session) => session.status === "submitted"),
    empty: analytics.empty,
  });
  const firstName = (dashboard.displayName || me.name || me.rollNumber).split(" ")[0];

  const continueTitle = dashboard.continueLearning
    ? dashboard.path.flatMap((unit) => unit.topics).find((topic) => topic.id === dashboard.continueLearning?.topicId)?.title
      ?? dashboard.analytics.recentlyOpened.find((row) => row.topicId === dashboard.continueLearning?.topicId)?.title
      ?? dashboard.continueLearning.title
    : "";

  return (
    <div className="space-y-10">
      <StudentJourney />
      {intro && (
        <section className="glass-panel rounded-3xl p-5" data-testid="first-run-banner">
          <p className="eyebrow">Getting started</p>
          {intro === "onboarding" ? (
            <>
              <h2 className="mt-1 font-display text-2xl">Tell us how you want to begin</h2>
              <p className="mt-1 text-sm text-muted-foreground">This is a preference, not a skill label.</p>
              <Button asChild variant="hero" className="mt-4"><Link to="/learn/onboarding">Open onboarding</Link></Button>
            </>
          ) : intro === "resume-diagnostic" ? (
            <>
              <h2 className="mt-1 font-display text-2xl">You have an open diagnostic</h2>
              <p className="mt-1 text-sm text-muted-foreground">An unfinished session is not a placement result.</p>
              <Button asChild variant="hero" className="mt-4"><Link to="/learn/diagnostic">Continue diagnostic</Link></Button>
            </>
          ) : (
            <>
              <h2 className="mt-1 font-display text-2xl">Optional Unit 1 diagnostic</h2>
              <p className="mt-1 text-sm text-muted-foreground">Placement is not mastery. You can keep learning without it.</p>
              <Button asChild variant="hero" className="mt-4"><Link to="/learn/diagnostic">Start diagnostic</Link></Button>
            </>
          )}
        </section>
      )}

      <section className="glass-panel cf-rise relative overflow-hidden rounded-[2rem] p-6 md:p-8" data-testid="dashboard-welcome">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-ember/25 blur-3xl cf-drift" aria-hidden />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="eyebrow">{dashboard.rollIdentifier || me.rollNumber}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{dashboard.greeting || `Good to see you, ${firstName}.`}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{dashboard.note || "Placement, mastery, and readiness are not one percentage."}</p>
            {dashboard.source === "demo" && <div className="mt-4"><DemoBadge>Fictional student · demo progress</DemoBadge></div>}
          </div>
          {teaching > 0 ? (
            <Ring value={demonstrated} max={teaching} size={136} stroke={13} label={`${demonstrated} of ${teaching} teaching topics have diagnostic placement DEMONSTRATED`}>
              <span><span className="block font-display text-3xl"><CountUp to={demonstrated} /></span><span className="text-[10px] text-muted-foreground">placed, not mastered</span></span>
            </Ring>
          ) : (
            <Ring value={0} max={1} size={136} stroke={13} label="No teaching topics counted yet">
              <span className="text-[10px] text-muted-foreground">No history</span>
            </Ring>
          )}
          <div className="hidden w-56 md:block"><ToolPreview id="recursion" ms={1000} className="h-40" /></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {dashboard.continueLearning ? (
          <Reveal className="glass-dark lift relative grid overflow-hidden rounded-[1.75rem] md:grid-cols-[13rem_1fr]">
            <UnitArt unitId="unit-1" label={false} className="h-40 rounded-none md:h-full" />
            <div className="relative p-6 md:p-8">
              <p className="eyebrow !text-ember">Continue from last activity</p>
              <h2 className="mt-2 font-display text-3xl">{continueTitle}</h2>
              <p className="mt-2 text-sm text-white/70">{dashboard.continueLearning.kind} · {dashboard.continueLearning.at}</p>
              {dashboard.continueLearning.dest ? (
                <Button asChild variant="hero" className="press mt-6 rounded-full">
                  <AdaptiveLink dest={dashboard.continueLearning.dest} testId="dashboard-resume-lesson">Resume <ArrowRight /></AdaptiveLink>
                </Button>
              ) : (
                <p className="mt-6 text-sm text-white/70">The last activity has no matching screen in this app yet.</p>
              )}
            </div>
          </Reveal>
        ) : (
          <Reveal className="glass-dark relative overflow-hidden rounded-[1.75rem] p-6 md:p-8">
            <p className="eyebrow !text-ember">Continue learning</p>
            <h2 className="mt-2 font-display text-3xl">No recorded activity yet</h2>
            <p className="mt-2 max-w-lg text-sm text-white/70">Opening a lesson is not mastery. When you start, the server will remember the last event.</p>
          </Reveal>
        )}

        <Reveal delay={120} className="glass-panel lift flex flex-col rounded-[1.75rem] p-5" data-testid="dashboard-next">
          <ToolPreview id="syntax" className="h-32" />
          <p className="eyebrow mt-4">What should I do next?</p>
          {recommendation ? (
            <>
              <h2 className="mt-1 font-display text-2xl">{dashboard.path.flatMap((unit) => unit.topics).find((topic) => topic.id === recommendation.topicId)?.title ?? recommendation.topicId}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{recommendation.reason}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Placement: {placementText(recommendation.placement).title}. Mastery: {recommendation.mastery ?? "none"}. Readiness is not computed.
              </p>
              {recommendation.availability !== "AVAILABLE" && (
                <p className="mt-2 text-xs text-muted-foreground">Resource status: {recommendation.availability}.</p>
              )}
              {recommendation.dest && recommendation.availability === "AVAILABLE" ? (
                <Button asChild variant="ink" className="press mt-auto self-start rounded-full">
                  <AdaptiveLink dest={recommendation.dest} testId="dashboard-start-next">{nextActionLabel(recommendation.resourceType)}</AdaptiveLink>
                </Button>
              ) : (
                <p className="mt-auto pt-4 text-sm text-muted-foreground">No Emergent destination is available for this recommendation yet.</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">The server did not return a next action.</p>
          )}
        </Reveal>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><h2 className="font-display text-2xl">Five units</h2><Link to="/learn/units" className="text-sm text-copper hover:underline">All units</Link></div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {analytics.unitProgress.map((unit, i) => (
            <Reveal key={unit.id} delay={i * 70} className="min-w-52 snap-start">
              <Link to="/learn/units/$unitId" params={{ unitId: unit.id as UnitId }} className="lift glass-panel group block overflow-hidden rounded-3xl" data-testid={`dashboard-unit-${unit.id}`}>
                <UnitArt unitId={unit.id} label={false} className="h-28 rounded-none" />
                <div className="p-4">
                  <h3 className="font-semibold leading-snug">{unit.title}</h3>
                  <Meter value={unit.opened} max={Math.max(1, unit.teachingTopics)} color={unitGradient(unit.id)} className="mt-3" />
                  <p className="mt-2 text-xs text-muted-foreground">{unit.opened} opened · {unit.demonstrated} placed · {unit.mastered} mastered</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Opened is not mastered. Demonstrated is diagnostic placement.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Reveal className="glass-panel rounded-3xl p-5">
          <h2 className="font-display text-xl">Recorded vs demonstrated</h2>
          <div className="mt-4 flex items-center gap-5">
            <Donut size={124} stroke={16} parts={[
              { label: "mastered", value: mastered, color: "var(--color-success)" },
              { label: "placed", value: demonstrated, color: "var(--color-gold)" },
              { label: "practised", value: practised, color: "var(--color-copper)" },
              { label: "opened", value: opened, color: "var(--color-ember)" },
            ]}>
              <span className="font-display text-xl">{teaching}</span>
            </Donut>
            <ul className="flex-1 space-y-2 text-sm">
              <li className="flex justify-between"><span>Mastered</span><span className="font-mono">{mastered}</span></li>
              <li className="flex justify-between"><span>Placed</span><span className="font-mono">{demonstrated}</span></li>
              <li className="flex justify-between"><span>Practised</span><span className="font-mono">{practised}</span></li>
              <li className="flex justify-between"><span>Opened</span><span className="font-mono">{opened}</span></li>
            </ul>
          </div>
          <Link to="/learn/progress" className="mt-4 inline-block text-sm text-copper hover:underline">Full progress</Link>
        </Reveal>

        <Reveal delay={100} className="glass-panel rounded-3xl p-5">
          <h2 className="font-display text-xl">Recent activity</h2>
          {analytics.recentlyOpened.length ? (
            <ol className="relative mt-4 space-y-4 border-l-2 border-copper/20 pl-5">
              {analytics.recentlyOpened.map((row) => (
                <li key={`${row.topicId}-${row.at}`} className="relative">
                  <span className="absolute -left-[31px] grid size-6 place-items-center rounded-full bg-copper text-pearl shadow"><BookOpen className="size-3" /></span>
                  <AdaptiveLink dest={row.dest} className="font-medium hover:text-copper">{row.title}</AdaptiveLink>
                  <p className="font-mono text-[11px] text-muted-foreground">{row.kind} · {row.at}</p>
                </li>
              ))}
            </ol>
          ) : <p className="mt-4 text-sm text-muted-foreground">No activity yet. Missing events are not treated as zero knowledge.</p>}
        </Reveal>

        <Reveal delay={200} className="relative overflow-hidden rounded-3xl p-5 text-white">
          <div className="absolute inset-0" style={{ background: "linear-gradient(140deg, oklch(0.72 0.16 40), oklch(0.68 0.17 10))" }} aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-2"><Brain className="size-5" /><h2 className="font-display text-xl">Needs attention</h2></div>
            {analytics.needPractice.length || dashboard.weakConcepts.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {(analytics.needPractice.length ? analytics.needPractice : dashboard.weakConcepts).slice(0, 5).map((row) => (
                  <li key={row.topicId}>
                    <AdaptiveLink dest={row.dest} className="hover:underline">{row.title} →</AdaptiveLink>
                    <p className="text-xs text-white/75">{row.evidence}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-white/80">Nothing flagged. Unassessed is not failed.</p>}
            <Link to="/learn/revision" className="mt-4 inline-block rounded-full bg-white/25 px-3 py-1 text-sm hover:bg-white/35">Go to revision</Link>
          </div>
        </Reveal>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Reveal className="glass-panel rounded-3xl p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl">Assessment history</h2>{dashboard.source === "demo" && <DemoBadge>Preview</DemoBadge>}</div>
          {analytics.assessmentHistory.length ? (
            <ul className="mt-4 space-y-3 text-sm">
              {analytics.assessmentHistory.slice(0, 5).map((row) => (
                <li key={`${row.assessmentId}-${row.attempt}`}>
                  <div className="flex justify-between gap-2">
                    <AdaptiveLink dest={row.dest} className="truncate hover:text-copper">{row.label}</AdaptiveLink>
                    <span className="font-mono">{row.earned}/{row.total}</span>
                  </div>
                  <Meter value={row.earned} max={Math.max(1, row.total)} color={row.earned / Math.max(1, row.total) >= 0.7 ? "var(--color-success)" : "var(--color-copper)"} className="mt-1" />
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-muted-foreground">No stored attempts yet.</p>}
          {dashboard.pendingAssessments.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {dashboard.pendingAssessments.map((item) => (
                <li key={`${item.kind}-${item.label}`}>
                  {item.dest && item.availability === "AVAILABLE" ? (
                    <AdaptiveLink dest={item.dest} className="text-copper hover:underline">{item.label}</AdaptiveLink>
                  ) : (
                    <span>{item.label} · {item.availability}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <Link to="/learn/assessments" className="mt-4 inline-block text-sm text-copper hover:underline">All assessments</Link>
        </Reveal>
        <Reveal delay={120} className="glass-dark rounded-3xl p-5">
          <div className="flex items-center gap-2"><Sparkles className="size-4 text-ember" /><h2 className="font-display text-xl">Visual learning</h2></div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tools.map((t) => (
              <Link key={t.id} to="/learn/tools/$tool" params={{ tool: t.id }} className="lift press group rounded-2xl p-3 text-sm text-white" style={{ background: TOOL_TINT[t.id] }} data-testid={`dashboard-tool-${t.id}`}>
                <span className="inline-block font-mono text-lg transition-transform group-hover:scale-125">{t.glyph}</span>
                <span className="mt-1 block leading-tight">{t.name}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}

