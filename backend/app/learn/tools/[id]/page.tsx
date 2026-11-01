import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { VisualTool } from "@/components/visualizers/tools";
import { StudyLinks } from "@/components/learn/study-links";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";
import { recordProgress } from "@/lib/curriculum/progress";

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const { topic } = await searchParams;
  if (topic) {
    recordProgress({
      studentId: session.studentId,
      topicId: topic,
      kind: "simulator_used",
      dimension: "concept",
      assisted: false,
    });
  }
  return (
    <>
      {topic ? <StudyLinks topicId={topic} current={id} /> : null}
      <p className="brand">
        <Link href="/learn">Dashboard</Link>
        {topic ? (
          <>
            {" · "}
            <Link href={`/learn/topics/${topic}`}>Topic hub</Link>
          </>
        ) : null}
      </p>
      <h1>Interactive tools</h1>
      <p className="meta">
        Working models with reset and step controls. They do not compile your C. The isolated judge
        still runs programs.
      </p>
      <nav className="row">
        {VISUALIZER_IDS.map((tool) => (
          <Link key={tool} href={`/learn/tools/${tool}${topic ? `?topic=${topic}` : ""}`}>
            {tool}
          </Link>
        ))}
      </nav>
      <VisualTool id={id} />
    </>
  );
}
