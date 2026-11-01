import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { IS_DEMO, services } from "@/services";
import { Panel, PageHeader, DemoBadge, EmptyState } from "@/components/common/bits";
import { FacultyCharts } from "@/components/art/FacultyCharts";
import { CountUp } from "@/components/art/motion";
import { unitGradient } from "@/components/art/UnitArt";
import type { Unit } from "@/domain/types";

export const Route = createFileRoute("/faculty/")({
  loader: () => services.faculty.summary(),
  component: FacultyDashboard,
});

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
  const initial = Route.useLoaderData();
  const { data: summary, isLoading, isError, error } = useQuery({
    queryKey: ["faculty-summary"],
    queryFn: () => services.faculty.summary(),
    initialData: initial,
    refetchOnMount: "always",
    retry: false,
  });

  if (isLoading) {
    return <p className="animate-pulse text-sm text-muted-foreground">Loading faculty overview…</p>;
  }
  if (isError || !summary) {
    return (
      <EmptyState
        title="Overview unavailable"
        body={error instanceof Error ? error.message : "The faculty overview API did not return a cohort summary. No counts were invented."}
      />
    );
  }

  const units: Unit[] = summary.unitProgress.map((row, index) => ({
    id: row.unitId,
    number: Number(String(row.unitId).replace("unit-", "")) || index + 1,
    title: row.title || row.unitId,
    shortTitle: row.title || row.unitId,
    summary: "",
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Faculty · overview"
        title={<>Cohort <em className="text-copper">overview</em></>}
        lede={IS_DEMO ? "Demo cohort summary. All numbers below are generated from fictional roster data for preview purposes only." : "Counts come from GET /api/v1/faculty/overview. There is no cohort name on the server, and individual student progress is not listed here."}
        actions={IS_DEMO ? <DemoBadge>Demo data — not persisted</DemoBadge> : undefined}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/faculty/roster" className="glass-dark lift rounded-[1.75rem] p-5" data-testid="faculty-roster-entry">
          <p className="eyebrow !text-ember">Official roster</p>
          <h2 className="mt-2 font-display text-2xl">Roster</h2>
          <p className="mt-2 text-sm text-white/75">{summary.rosterCount} approved entries. Rename is supported. Individual progress is not.</p>
        </Link>
        <Link to="/faculty/invitations" className="glass-dark lift rounded-[1.75rem] p-5" data-testid="faculty-invitations-entry">
          <p className="eyebrow !text-ember">Access</p>
          <h2 className="mt-2 font-display text-2xl">Invitations</h2>
          <p className="mt-2 text-sm text-white/75">{summary.invited} pending. Tokens are not listed here.</p>
        </Link>
        <Link to="/faculty/labs" className="glass-dark lift rounded-[1.75rem] p-5" data-testid="faculty-labs-entry">
          <p className="eyebrow !text-ember">Resource ingest</p>
          <h2 className="mt-2 font-display text-2xl">Labs</h2>
          <p className="mt-2 text-sm text-white/75">JSON ingest only. Held in process memory.</p>
        </Link>
        <Link to="/faculty/papers" className="glass-dark lift rounded-[1.75rem] p-5" data-testid="faculty-papers-entry">
          <p className="eyebrow !text-ember">Resource ingest</p>
          <h2 className="mt-2 font-display text-2xl">Papers</h2>
          <p className="mt-2 text-sm text-white/75">JSON ingest only. No PDF upload or invented paper bank.</p>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat testId="stat-capacity" label="Approved roster capacity" value={summary.capacity} hint="Maximum entries this cohort can hold" />
        <Stat testId="stat-active" label="Active student accounts" value={summary.active} hint={`${summary.active} of ${summary.rosterCount} roster entries`} />
        <Stat testId="stat-invited" label="Invitations outstanding" value={summary.invited} hint="Pending invitations from the overview" />
        <Stat testId="stat-not-invited" label="Not yet invited" value={summary.notInvited} hint="Approved roster minus active and pending" />
      </section>

      <FacultyCharts s={summary} units={units} />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="glass-panel rounded-[1.75rem]">
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
            {summary.unitProgress.length === 0 ? (
              <EmptyState title="No unit counts yet" body="The overview did not return unit progress. Missing counts are not treated as zero learning." />
            ) : summary.unitProgress.map((up) => (
              <div key={up.unitId} data-testid={`unit-progress-${up.unitId}`}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="font-medium">{up.title || up.unitId}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {IS_DEMO ? `${up.mastered} mastered · ${up.demonstrated} demonstrated · ${up.needsPractice} need practice` : `${up.needsPractice} opened · ${up.demonstrated} practised · ${up.mastered} mastered`}
                  </p>
                </div>
                <Bar value={up.mastered} max={Math.max(1, summary.active)} id={up.unitId} />
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{up.mastered} of {summary.active} active students have a mastered topic in this unit</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="glass-panel rounded-[1.75rem]">
          <p className="eyebrow">Assessment distribution</p>
          <h2 className="mt-1 font-display text-2xl">Stored attempt buckets</h2>
          <p className="mt-1 text-xs text-muted-foreground">Buckets with fewer than three students are hidden to protect privacy.</p>
          {summary.assessmentBuckets.length === 0 ? (
            <div className="mt-5"><EmptyState title="No score buckets" body="The server omitted the distribution. That is not a fabricated zero." /></div>
          ) : (
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
          )}
          <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            {IS_DEMO ? "Preview attempts are computed client-side and not stored as official results." : "Buckets come from stored attempts. Distributions with fewer than three students are omitted."}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel className="glass-panel rounded-[1.75rem]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-copper" />
            <p className="eyebrow">Topics needing revision</p>
          </div>
          <h2 className="mt-1 font-display text-2xl">Where the cohort is stuck</h2>
          {summary.revisitTopics.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No revision pressure yet" body="No topic was returned by the overview. A missing list is not invented." />
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {summary.revisitTopics.map((r) => (
                <li key={r.topicId} className="flex items-center justify-between py-3" data-testid={`revisit-${r.topicId}`}>
                  <div>
                    <p className="font-medium">{r.topicId}</p>
                    <p className="text-xs text-muted-foreground">{r.students === null ? "Count suppressed (fewer than 3 students)" : `${r.students} students flagged`}</p>
                  </div>
                  <Link to="/faculty/roster" className="font-mono text-xs text-copper hover:underline">Roster →</Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="glass-panel rounded-[1.75rem]">
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
            {IS_DEMO ? "Engagement figures reflect the fictional demonstration data in this preview." : "Engagement counts recorded learning events. They are not a ranking."}
          </p>
        </Panel>
      </section>
    </div>
  );
}
