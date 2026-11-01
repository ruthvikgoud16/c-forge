import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";
import { readSession } from "@/lib/academy/session";
import { loadLearnDashboard, type LearnDashboard } from "@/lib/integration/student-dashboard";
import "@/app/styles/emergent.css";

const TOOL_LABELS: Record<string, string> = {
  binary: "Binary",
  syntax: "Syntax",
  algorithm: "Algorithm",
  flowchart: "Flowchart",
  "control-flow": "Control flow",
  "array-string": "Arrays and strings",
  recursion: "Functions and recursion",
  "search-sort": "Searching and sorting",
};

function topicTitle(dash: LearnDashboard, topicId: string) {
  for (const unit of dash.path) {
    const topic = unit.topics.find((row) => row.id === topicId);
    if (topic) return topic.title;
  }
  return topicId;
}

export default async function LearnDashboardPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const dash = await loadLearnDashboard(session);
  const next = dash.recommendedNext;
  const analytics = dash.analytics;
  const continueHref = dash.continueLearning?.href ?? next.href;
  const continueLabel = dash.continueLearning
    ? `Continue ${topicTitle(dash, dash.continueLearning.topicId)}`
    : "Start recommended lesson";

  return (
    <div className="em em-dash">
      <header>
        <p className="em-eyebrow">Dashboard</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
          <h1 className="em-display">{dash.greeting}</h1>
          <SignOutButton />
        </div>
        <p className="em-muted">{dash.rollIdentifier}</p>
        <p className="em-lead">
          Your roll number is your login. Names stay empty until faculty records a verified name. No
          global beginner label is stored. Progress is computed on the server from your events and
          assessments. Opening a lesson is not mastery. This is not an examination-readiness score.
        </p>
      </header>

      <section className="em-split">
        <div className="em-ink em-continue">
          <p className="em-eyebrow">Continue learning</p>
          <h2 className="em-display">Continue learning</h2>
          {dash.continueLearning ? (
            <p>
              Last activity: {dash.continueLearning.kind} on {topicTitle(dash, dash.continueLearning.topicId)}.
            </p>
          ) : (
            <p>No lesson opened yet. The button still takes you to the recommended first step.</p>
          )}
          <p>
            <Link className="em-btn em-btn-hero learn-continue__action" href={continueHref}>
              {continueLabel}
            </Link>
          </p>
        </div>
        <section className="em-panel">
          <p className="em-eyebrow">Recommended next</p>
          <h2 className="em-display">Recommended next step</h2>
          <p>{next.reason}</p>
          <p className="em-meta">
            {next.topicId} · {next.resourceType} · {next.availability} · placement {next.placement} ·
            mastery {next.mastery ?? "none"}
          </p>
          <p className="em-actions">
            <Link className="em-btn em-btn-ink em-btn-sm" href={next.href}>
              Open this next step
            </Link>
            <Link href="/learn/path">See my learning path</Link>
            <Link href="/learn/diagnostic">Take or retake a diagnostic</Link>
          </p>
        </section>
      </section>

      <section>
        <h2 className="em-display">Unit progress</h2>
        <p className="em-meta">
          Counts use official teaching topics only (not laboratory sheets). Mastered requires
          practice, a passed check, independent write, and retained checks — not merely opening
          the lesson.
        </p>
        {analytics.empty ? <p>No recorded activity yet. Units stay listed so you can start anywhere.</p> : null}
        <div className="em-units-grid">
          {analytics.unitProgress.map((unit) => (
            <article className="em-unit-card" key={unit.id}>
              <h3>
                <Link href={unit.href}>{unit.title}</Link>
              </h3>
              <p className="em-meta">
                {unit.opened}/{unit.teachingTopics} opened · {unit.practised} practised ·{" "}
                {unit.demonstrated} demonstrated · {unit.mastered} mastered
              </p>
              <p className="em-meta">{unit.note}</p>
              <p>
                <Link href={unit.href}>Open unit and mind map</Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="em-three">
        <section className="em-panel">
          <h2 className="em-display">Recently opened</h2>
          {analytics.recentlyOpened.length ? (
            <ul className="em-list">
              {analytics.recentlyOpened.map((row) => (
                <li key={`open-${row.topicId}`}>
                  <Link href={row.href}>{row.title}</Link> <span className="em-meta">{row.kind}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have not opened a lesson yet.</p>
          )}
          <h3>Recently practised</h3>
          {analytics.recentlyPractised.length ? (
            <ul className="em-list">
              {analytics.recentlyPractised.map((row) => (
                <li key={`prac-${row.topicId}`}>
                  <Link href={row.href}>{row.title}</Link> <span className="em-meta">{row.kind}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No practice or in-lesson checks recorded yet.</p>
          )}
        </section>

        <section className="em-panel">
          <h2 className="em-display">Needs more practice</h2>
          {analytics.needPractice.length ? (
            <ul className="em-list">
              {analytics.needPractice.map((row) => (
                <li key={row.topicId}>
                  <Link href={row.href}>{row.title}</Link> <span className="em-meta">{row.evidence}</span>
                </li>
              ))}
            </ul>
          ) : analytics.empty ? (
            <p>Nothing to revise yet — there is no diagnostic or practice evidence.</p>
          ) : (
            <p>No weak topics are recorded from diagnostics, placement, or unfinished practice.</p>
          )}
        </section>

        <section className="em-panel">
          <h2 className="em-display">Demonstrated and mastered</h2>
          <p className="em-meta">Placement “demonstrated” is not mastery. Mastery is derived from your own events.</p>
          <h3>Mastered topics</h3>
          {analytics.mastered.length ? (
            <ul className="em-list">
              {analytics.mastered.map((row) => (
                <li key={row.topicId}>
                  <Link href={row.href}>{row.title}</Link> <span className="em-meta">{row.evidence}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No topic is mastered yet.</p>
          )}
          <h3>Demonstrated on diagnostic</h3>
          {analytics.demonstrated.length ? (
            <ul className="em-list">
              {analytics.demonstrated.map((row) => (
                <li key={row.topicId}>
                  <Link href={row.href}>{row.title}</Link> <span className="em-meta">{row.evidence}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No diagnostic placement of DEMONSTRATED is stored.</p>
          )}
        </section>
      </section>

      <section className="em-panel" id="assessments">
        <h2 className="em-display">Assessment history</h2>
        {analytics.assessmentHistory.length ? (
          <ul className="em-list">
            {analytics.assessmentHistory.map((row) => (
              <li key={`${row.assessmentId}-${row.attempt}`}>
                <Link href={row.href}>{row.label}</Link>{" "}
                <span className="em-meta">
                  attempt {row.attempt}: {row.earned}/{row.total} · {row.completedAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No practice assessments submitted yet. Marks appear here after a server-scored attempt.</p>
        )}
      </section>

      <section className="em-panel" id="official-units">
        <h2 className="em-display">My learning path</h2>
        <p className="em-meta">Guidance only. Every official topic stays open.</p>
        {dash.path.map((unit) => (
          <div key={unit.id}>
            <h3>{unit.title}</h3>
            <ul className="em-list">
              {unit.topics.map((topic) => (
                <li key={topic.id}>
                  <Link href={topic.href}>{topic.title}</Link>{" "}
                  <span className="em-meta">
                    {topic.placement} · lesson {topic.lesson}
                    {topic.laboratory !== "UNAVAILABLE" ? ` · lab ${topic.laboratory}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="em-panel">
        <h2 className="em-display">Weak concepts</h2>
        {dash.weakConcepts.length ? (
          <ul className="em-list">
            {dash.weakConcepts.map((row) => (
              <li key={row.topicId}>
                {row.title} — {row.evidence}
              </li>
            ))}
          </ul>
        ) : (
          <p>No diagnostic misses recorded yet. Weaknesses are not invented.</p>
        )}
      </section>

      <section className="em-panel">
        <h2 className="em-display">Pending assessments</h2>
        {dash.pendingAssessments.map((item) => (
          <p key={item.kind}>
            <Link href={item.href}>{item.label}</Link> <span className="em-meta">{item.availability}</span>
          </p>
        ))}
        <p className="em-meta">Unit tests and exam-mode papers are planned. No previous-year bank.</p>
      </section>

      <section className="em-panel" id="practice">
        <h2 className="em-display">How to begin</h2>
        <p>
          <Link href="/learn/onboarding">Choose a starting preference</Link> (not a permanent level).
        </p>
      </section>

      <section className="em-viz">
        <h2 className="em-display">Visualisers</h2>
        <p>Eight interactive models. Each link opens the working tool. They do not compile C.</p>
        <div className="em-tool-grid">
          {VISUALIZER_IDS.map((id) => (
            <Link key={id} href={`/learn/tools/${id}`}>
              {TOOL_LABELS[id] ?? id}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
