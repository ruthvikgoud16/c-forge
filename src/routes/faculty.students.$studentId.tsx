import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { services } from "@/services";
import { PageHeader, Panel, DemoBadge, StateChip, EmptyState } from "@/components/common/bits";
import { units, topics } from "@/data/fixtures/curriculum";
import type { AccountStatus } from "@/domain/types";
import { Ring, Meter } from "@/components/art/Ring";
import { UnitArt, unitGradient } from "@/components/art/UnitArt";

export const Route = createFileRoute("/faculty/students/$studentId")({ component: StudentDetail });

const STATUS_META: Record<AccountStatus, { label: string; cls: string }> = {
  active: { label: "Active account", cls: "bg-success/15 text-success" },
  invited: { label: "Invited — not yet active", cls: "bg-info/15 text-info" },
  "not-invited": { label: "Not yet invited", cls: "bg-muted text-muted-foreground" },
};

function StudentDetail() {
  const { studentId } = useParams({ from: "/faculty/students/$studentId" });
  const { data: student, isLoading } = useQuery({
    queryKey: ["faculty-student", studentId],
    queryFn: () => services.faculty.student(studentId),
  });
  const { data: progress } = useQuery({
    queryKey: ["faculty-student-progress", studentId],
    queryFn: () => services.progress.forStudent(studentId),
    enabled: !!student && student.status === "active",
  });

  if (isLoading) return <p className="animate-pulse text-muted-foreground">Loading student…</p>;
  if (!student) {
    return (
      <div>
        <Link to="/faculty/roster" className="inline-flex items-center gap-1 text-sm text-copper hover:underline"><ArrowLeft className="size-4" /> Back to roster</Link>
        <div className="mt-6"><EmptyState title="Student not found" body="This roster entry does not exist." /></div>
      </div>
    );
  }

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const statusMeta = STATUS_META[student.status];

  const unitStates = units.map((u) => {
    const unitTopics = topics.filter((t) => t.unitId === u.id);
    const states = (progress?.topics ?? []).filter((p) => unitTopics.some((t) => t.id === p.topicId));
    const mastered = states.filter((s) => s.state === "mastered").length;
    const demonstrated = states.filter((s) => s.state === "demonstrated").length;
    const needsPractice = states.filter((s) => s.state === "needs-practice").length;
    const started = states.filter((s) => s.state !== "not-started").length;
    return { unit: u, total: unitTopics.length, started, mastered, demonstrated, needsPractice };
  });

  const needsPractice = (progress?.topics ?? []).filter((p) => p.state === "needs-practice");

  return (
    <div className="space-y-8">
      <Link to="/faculty/roster" className="inline-flex items-center gap-1 text-sm text-copper hover:underline" data-testid="back-to-roster"><ArrowLeft className="size-4" /> Back to roster</Link>

      <PageHeader
        eyebrow="Faculty · student detail"
        title={<>{student.name}</>}
        lede={<span className="font-mono text-sm">{student.rollNumber}</span>}
        actions={
          <>
            <DemoBadge>Demo data</DemoBadge>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusMeta.cls}`} data-testid="student-status">
              {statusMeta.label}
            </span>
          </>
        }
      />

      {student.status !== "active" ? (
        <Panel>
          <EmptyState
            title="No learning activity yet"
            body="This student has not accepted their invitation yet. Progress, assessments and recent activity will appear here once the account is active."
          />
        </Panel>
      ) : (
        <>
          <section className="glass-panel grid items-center gap-6 rounded-[2rem] p-6 md:grid-cols-[auto_1fr]" data-testid="student-summary-visual">
            <Ring value={(progress?.topics ?? []).filter((p) => p.state === "mastered" || p.state === "demonstrated").length} max={topics.length} size={140} stroke={13}>
              <span><span className="block font-display text-3xl">{(progress?.topics ?? []).filter((p) => p.state === "mastered" || p.state === "demonstrated").length}</span><span className="text-[10px] text-muted-foreground">of {topics.length} topics</span></span>
            </Ring>
            <div className="grid grid-cols-5 gap-2">
              {unitStates.map((u) => (
                <div key={u.unit.id} className="text-center">
                  <UnitArt unitId={u.unit.id} number={u.unit.number} label={false} className="h-16" />
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{u.started}/{u.total}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel>
              <p className="eyebrow">Unit progress</p>
              <h2 className="mt-1 font-display text-2xl">Where this student stands</h2>
              <div className="mt-5 space-y-4">
                {unitStates.map((u) => {
                  const pct = u.total === 0 ? 0 : Math.round(((u.mastered + u.demonstrated) / u.total) * 100);
                  return (
                    <div key={u.unit.id} data-testid={`student-unit-${u.unit.id}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium">Unit {u.unit.number}. {u.unit.shortTitle}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {u.started}/{u.total} started · {u.mastered} mastered
                        </p>
                      </div>
                      <Meter value={pct} max={100} color={unitGradient(u.unit.id)} className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <p className="eyebrow">Topics needing revision</p>
              <h2 className="mt-1 font-display text-2xl">Follow-up list</h2>
              {needsPractice.length === 0 ? (
                <div className="mt-4"><EmptyState title="Nothing flagged" body="This student currently has no topics flagged for more practice." /></div>
              ) : (
                <ul className="mt-5 divide-y divide-border">
                  {needsPractice.map((tp) => {
                    const t = topicMap[tp.topicId];
                    return (
                      <li key={tp.topicId} className="py-3" data-testid={`needs-practice-${tp.topicId}`}>
                        <p className="font-medium">{t?.title ?? tp.topicId}</p>
                        <p className="text-xs text-muted-foreground">Last opened: {tp.lastOpened ?? "—"}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <p className="eyebrow">Assessment summary</p>
              <h2 className="mt-1 font-display text-2xl">Preview attempts</h2>
              {(progress?.attempts ?? []).length === 0 ? (
                <div className="mt-4"><EmptyState title="No attempts yet" body="Preview assessment attempts will appear here once this student completes them." /></div>
              ) : (
                <ul className="mt-5 divide-y divide-border">
                  {progress!.attempts.map((a) => {
                    const pct = Math.round((a.correct / a.total) * 100);
                    return (
                      <li key={a.assessmentId + a.date} className="flex items-center justify-between py-3" data-testid={`attempt-${a.assessmentId}`}>
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="font-mono text-xs text-muted-foreground">{a.date}</p>
                        </div>
                        <p className="font-display text-xl text-copper">{pct}%</p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                Preview attempts are not authoritative. The CForge backend will supply graded assessments once connected.
              </p>
            </Panel>

            <Panel>
              <p className="eyebrow">Recent learning activity</p>
              <h2 className="mt-1 font-display text-2xl">What they opened</h2>
              {(progress?.recent ?? []).length === 0 ? (
                <div className="mt-4"><EmptyState title="No recent activity" body="Lessons, flashcards, notes and mind maps opened recently will appear here." /></div>
              ) : (
                <ul className="mt-5 divide-y divide-border">
                  {progress!.recent.map((r, i) => {
                    const t = topicMap[r.topicId];
                    const tp = progress!.topics.find((x) => x.topicId === r.topicId);
                    return (
                      <li key={i} className="flex items-center justify-between gap-3 py-3" data-testid={`recent-${r.topicId}`}>
                        <div className="flex items-start gap-3">
                          <BookOpen className="mt-1 size-4 text-copper" />
                          <div>
                            <p className="font-medium">{t?.title ?? r.topicId}</p>
                            <p className="font-mono text-xs text-muted-foreground">{r.resource} · {r.date}</p>
                          </div>
                        </div>
                        {tp && <StateChip state={tp.state} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
