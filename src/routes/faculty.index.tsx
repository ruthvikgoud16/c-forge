import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { services } from "@/services";
import { Panel, PageHeader, DemoBadge, EmptyState } from "@/components/common/bits";
import { units, topics } from "@/data/fixtures/curriculum";
import { FacultyCharts } from "@/components/art/FacultyCharts";
import { CountUp } from "@/components/art/motion";
import { unitGradient } from "@/components/art/UnitArt";

export const Route = createFileRoute("/faculty/")({ component: FacultyDashboard });

function Stat({ label, value, hint, testId }: { label: string; value: string | number; hint?: string; testId: string }) {
  return (
    <div className="glass-panel lift relative overflow-hidden rounded-3xl p-5" data-testid={testId}>
      <span className="absolute -right-6 -top-6 size-20 rounded-full bg-copper/15 blur-xl" aria-hidden />
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-4xl text-copper">{typeof value === "number" ? <CountUp to={value} /> : value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Bar({ value, max, id }: { value: number; max: number; id: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-foreground/8">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: unitGradient(id) }} />
    </div>
  );
}

function FacultyDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["faculty-summary"],
    queryFn: () => services.faculty.summary(),
  });

  if (isLoading || !summary) {
    return <div className="animate-pulse text-muted-foreground">Loading cohort overview…</div>;
  }

  const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Faculty · overview"
        title={<>Cohort <em className="text-copper">overview</em></>}
        lede="Demo cohort summary. All numbers below are generated from fictional roster data for preview purposes only."
        actions={<DemoBadge>Demo data — not persisted</DemoBadge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat testId="stat-capacity" label="Approved roster capacity" value={summary.capacity} hint="Maximum entries this cohort can hold" />
        <Stat testId="stat-active" label="Active student accounts" value={summary.active} hint={`${summary.active} of ${summary.rosterCount} roster entries`} />
        <Stat testId="stat-invited" label="Invitations outstanding" value={summary.invited} hint="Pending or expiring invitations" />
        <Stat testId="stat-not-invited" label="Not yet invited" value={summary.notInvited} hint="Roster entries without an invitation" />
      </section>

      <FacultyCharts s={summary} />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Unit-level progress</p>
              <h2 className="mt-1 font-display text-2xl">How the cohort is tracking</h2>
            </div>
            <Link to="/faculty/roster" className="text-sm text-copper hover:underline" data-testid="dashboard-view-roster">
              View roster <ArrowRight className="inline size-3.5" />
            </Link>
          </div>
          <div className="mt-5 space-y-5">
            {summary.unitProgress.map((up) => {
              const u = unitMap[up.unitId];
              return (
                <div key={up.unitId} data-testid={`unit-progress-${up.unitId}`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="font-medium">Unit {u?.number}. {u?.shortTitle}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {up.mastered} mastered · {up.demonstrated} demonstrated · {up.needsPractice} need practice
                    </p>
                  </div>
                  <Bar value={up.mastered} max={Math.max(1, summary.active)} id={up.unitId} />
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{up.mastered} of {summary.active} active students have mastered at least one topic</p>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <p className="eyebrow">Assessment distribution</p>
          <h2 className="mt-1 font-display text-2xl">Preview score buckets</h2>
          <p className="mt-1 text-xs text-muted-foreground">Buckets with fewer than three students are hidden to protect privacy.</p>
          <ul className="mt-5 space-y-3">
            {summary.assessmentBuckets.map((b) => (
              <li key={b.label} className="flex items-center justify-between gap-3" data-testid={`bucket-${b.label}`}>
                <span className="font-mono text-sm">{b.label}</span>
                <span className="font-display text-lg">
                  {b.count === null ? <span className="text-muted-foreground">—</span> : b.count}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            Preview attempts are computed client-side and not stored as official results.
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-copper" />
            <p className="eyebrow">Topics needing revision</p>
          </div>
          <h2 className="mt-1 font-display text-2xl">Where the cohort is stuck</h2>
          {summary.revisitTopics.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No revision pressure yet" body="No topic has three or more students flagged as needing practice." />
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {summary.revisitTopics.map((r) => {
                const t = topicMap[r.topicId];
                return (
                  <li key={r.topicId} className="flex items-center justify-between py-3" data-testid={`revisit-${r.topicId}`}>
                    <div>
                      <p className="font-medium">{t?.title ?? r.topicId}</p>
                      <p className="text-xs text-muted-foreground">{r.students} students flagged for practice</p>
                    </div>
                    <Link to="/faculty/roster" className="font-mono text-xs text-copper hover:underline">
                      Review →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-copper" />
            <p className="eyebrow">Engagement</p>
          </div>
          <h2 className="mt-1 font-display text-2xl">Learning activity</h2>
          <dl className="mt-5 space-y-4">
            {summary.engagement.map((e) => (
              <div key={e.label} className="flex items-end justify-between gap-3 border-b border-border pb-3" data-testid={`engagement-${e.label}`}>
                <dt className="text-sm text-muted-foreground">{e.label}</dt>
                <dd className="font-display text-2xl text-copper">{e.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Engagement figures reflect the fictional demonstration data in this preview. Real activity will replace these numbers once the CForge backend is connected.
          </p>
        </Panel>
      </section>
    </div>
  );
}
