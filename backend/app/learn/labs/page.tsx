import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { listLabs } from "@/lib/content/ingest";

export default async function LabsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const labs = listLabs();
  return (
    <>
      <p className="brand">
        <Link href="/learn">Dashboard</Link>
      </p>
      <h1>Official laboratory</h1>
      <p>
        Official experiment sheets have not been supplied. Status: <strong>UNAVAILABLE</strong> until
        faculty uploads a verified sheet. CForge supplementary exercises on topic pages are not
        college laboratory requirements.
      </p>
      {labs.length === 0 ? (
        <p className="meta">No verified lab records. Nothing is invented here.</p>
      ) : (
        <ul>
          {labs.map((lab) => (
            <li key={lab.id}>
              {lab.title} — {lab.verified ? "verified" : "unverified"} — {lab.sourceRef}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
