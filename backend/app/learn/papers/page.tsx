import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { frequencyClaimsAllowed, listPapers } from "@/lib/content/ingest";

export default async function PapersPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const papers = listPapers();
  const trends = frequencyClaimsAllowed(papers);
  return (
    <>
      <p className="brand">
        <Link href="/learn">Dashboard</Link>
      </p>
      <h1>Previous-year papers</h1>
      {papers.length === 0 ? (
        <p>
          No papers have been uploaded. Historical frequency and expected weightage are{" "}
          <strong>unavailable</strong>. CForge will not invent a paper bank.
        </p>
      ) : (
        <ul>
          {papers.map((p) => (
            <li key={p.id}>
              {p.academicYear} {p.examType} — {p.verified ? "faculty-verified" : "pending"} — {p.sourceRef} —{" "}
              {p.questions.length} extracted questions
            </li>
          ))}
        </ul>
      )}
      {!trends ? (
        <p className="meta">Trend analysis stays off until at least three verified papers exist.</p>
      ) : null}
    </>
  );
}
