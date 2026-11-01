import { redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { AcademyNav } from "@/components/academy-nav";
import { ThemeScope } from "@/components/ui/theme-scope";
import "../styles/student.css";
import "../styles/learn.css";
import { displayLabel } from "@/lib/roster/rolls";
import { getRosterRow, seedRoster } from "@/lib/roster/store";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/login");
  seedRoster();
  const row = getRosterRow(session.rollIdentifier);
  const greeting = displayLabel(session.rollIdentifier, row?.displayName);
  return (
    <ThemeScope theme="student" fill className="student-app">
      <main className="shell">
        <AcademyNav roll={session.rollIdentifier} greeting={greeting} />
        {children}
      </main>
    </ThemeScope>
  );
}
