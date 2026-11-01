import Link from "next/link";
import { DiagnosticClient } from "@/components/diagnostic-client";

export default function DiagnosticPage() {
  return (
    <>
      <p className="brand">
        <Link href="/learn">Dashboard</Link>
      </p>
      <h1>Diagnostic</h1>
      <p>
        Questions come from existing Unit 1 lessons. Answer keys stay on the server. You may retake;
        earlier attempts are kept. Placement is not mastery.
      </p>
      <DiagnosticClient />
    </>
  );
}
