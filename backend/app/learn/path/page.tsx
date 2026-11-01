import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { learningPath, recommendNext } from "@/lib/learning/recommend";
import { hydrateStudent } from "@/lib/learning/persist";

export default async function LearningPathPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  await hydrateStudent(session.studentId);
  const next = recommendNext(session.studentId);
  const units = learningPath(session.studentId);
  return (
    <>
      <p className="brand">
        <Link href="/learn">Dashboard</Link>
      </p>
      <h1>Learning path</h1>
      <p className="meta">This is guidance, not a lock. You may open any official topic.</p>
      <div className="card">
        <h2>Recommended next action</h2>
        <p>{next.reason}</p>
        <Link href={next.href}>Continue</Link>
      </div>
      {units.map((unit) => (
        <section className="card" key={unit.id}>
          <h2>{unit.title}</h2>
          <ul>
            {unit.topics.map((t) => (
              <li key={t.id}>
                <Link href={t.href}>{t.sourceLabel}</Link>
                <span className="meta">
                  {" "}
                  placement {t.placement} · mastery {t.mastery ?? "none"} · lesson {t.lesson}
                  {t.prerequisites.length
                    ? ` · recommended first: ${t.prerequisites.map((p) => p.id).join(", ")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
