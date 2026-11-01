import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTopic } from "@/lib/curriculum/catalog";
import { readSession } from "@/lib/academy/session";
import { getPlacement } from "@/lib/learning/store";
import { topicState } from "@/lib/curriculum/progress";
import { hubCards, topicAvailability } from "@/lib/learning/resources";
import { prerequisitesOf } from "@/lib/curriculum/prerequisites";
import { packageForTopic } from "@/lib/content/registry";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";
import { recommendNext } from "@/lib/learning/recommend";

export default async function TopicHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = getTopic(id);
  if (!found) notFound();
  const session = await readSession();
  if (!session) redirect("/login");
  const { unit, topic } = found;
  const pkg = packageForTopic(topic.id);
  const avail = topicAvailability(topic.id);
  const placement = getPlacement(session.studentId, topic.id);
  const mastery = topicState(session.studentId, topic.id);
  const prereqs = prerequisitesOf(topic.id);
  const next = recommendNext(session.studentId);
  const cards = hubCards(topic.id);
  return (
    <>
      <p className="brand">
        <Link href={`/learn/units/${unit.slug}`}>{unit.title}</Link>
      </p>
      <h1>{topic.title}</h1>
      <p className="meta">{topic.classification} · Topic Resource Hub</p>
      <p>Official wording: {topic.sourceLabel ?? topic.sourceLabels?.join(" / ")}</p>
      <section className="card">
        <h2>Overview</h2>
        <p>{pkg?.notes.introduction ?? unit.overview?.teaches ?? "This official topic is listed on the syllabus."}</p>
        {pkg ? (
          <ul>
            {pkg.lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        ) : (
          <p>Teaching package pending. Official laboratory sheets are not invented.</p>
        )}
      </section>
      <section className="card">
        <h2>Your status</h2>
        <p>
          Placement {placement} · mastery {mastery ?? "none"} · readiness none until you sit a real
          assessment. These are not one percentage.
        </p>
        <p>
          Recommended next (server): {next.reason}{" "}
          <Link href={next.href}>Open</Link>
        </p>
        {prereqs.length ? (
          <p className="meta">
            Recommended first:{" "}
            {prereqs.map((p) => (
              <Link key={p.prerequisiteId} href={`/learn/topics/${p.prerequisiteId}`}>
                {p.prerequisiteId}{" "}
              </Link>
            ))}
          </p>
        ) : null}
      </section>
      <section className="card">
        <h2>Resources</h2>
        <ul className="hub-grid">
          {cards.map((c) => (
            <li key={c.type}>
              <strong>{c.title}</strong>{" "}
              <span className="meta">{c.availability}</span>
              {c.href && c.availability === "AVAILABLE" ? (
                <>
                  {" "}
                  <Link href={c.href}>Open</Link>
                </>
              ) : (
                <span className="meta"> — no fake page.</span>
              )}
              {c.note ? <p className="meta">{c.note}</p> : null}
              {c.type === "visualisation" && pkg && pkg.visualizerIds.length > 1 ? (
                <p className="learn-links">
                  {pkg.visualizerIds.filter((tool) => (VISUALIZER_IDS as readonly string[]).includes(tool)).map((tool) => (
                    <Link key={tool} href={`/learn/tools/${tool}?topic=${topic.id}`}>
                      {tool}
                    </Link>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {topic.accuracyNotes?.map((n) => (
        <p key={n} className="meta">
          {n}
        </p>
      ))}
      {avail.laboratory !== "UNAVAILABLE" ? (
        <p className="meta">Laboratory: {avail.laboratory}. A roster of 51 students is not a lab sheet.</p>
      ) : null}
    </>
  );
}
