import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUnit, mindMapForUnit } from "@/lib/curriculum/catalog";
import { topicState } from "@/lib/curriculum/progress";
import { readSession } from "@/lib/academy/session";
import { MindMap } from "@/components/mind-map";

export default async function UnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { slug } = await params;
  const unit = getUnit(slug);
  if (!unit) notFound();
  const map = mindMapForUnit(unit);
  return (
    <>
      <p className="brand">{unit.kind === "foundation" ? "Foundation" : "Official unit"}</p>
      <h1>{unit.title}</h1>
      <p className="meta">{unit.sourceLabel}</p>
      {unit.overview ? (
        <section className="card">
          <h2>Unit overview</h2>
          <p>
            <strong>What it teaches.</strong> {unit.overview.teaches}
          </p>
          <p>
            <strong>Why it matters.</strong> {unit.overview.why}
          </p>
          <p>
            <strong>Prerequisites.</strong> {unit.overview.prerequisites.join(" ")}
          </p>
          <p>
            <strong>Outcomes.</strong>
          </p>
          <ul>
            {unit.overview.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p>
            <strong>Connection.</strong> {unit.overview.connectsTo}
          </p>
        </section>
      ) : null}
      <MindMap title={map.title} children={map.children} />
      <section className="card">
        <h2>Topics</h2>
        <ol>
          {unit.topics.map((topic) => (
            <li key={topic.id}>
              <Link href={topic.lessonId ? `/learn/lessons/${topic.lessonId}` : `/learn/topics/${topic.id}`}>
                {topic.title}
              </Link>
              <span className="meta">
                {" "}
                · {topic.classification} · {topicState(session.studentId, topic.id) ?? "not started"}
              </span>
              <div className="meta">{topic.sourceLabel ?? topic.sourceLabels?.join(" ")}</div>
            </li>
          ))}
        </ol>
      </section>
      <section className="card">
        <h2>Notes, lessons, practice, revision, assessment</h2>
        <p>
          The first complete package is Unit 1 topic 1. Other official topics are listed with source wording
          and wait for lesson documents. Laboratory lines are recorded; extra lab tasks were not invented.
        </p>
      </section>
    </>
  );
}
