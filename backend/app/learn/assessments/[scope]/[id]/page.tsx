import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { packageForTopic, publicItem, unitAssessmentItems } from "@/lib/content/registry";
import { AssessmentForm } from "@/components/assessment-form";
import { StudyLinks } from "@/components/learn/study-links";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ scope: string; id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { scope, id } = await params;
  const assessmentId = scope === "unit" ? `unit:${id}` : `topic:${id}`;
  const items =
    scope === "unit"
      ? unitAssessmentItems(id)
      : packageForTopic(id)?.assessment;
  if (!items?.length) notFound();
  return (
    <>
      {scope === "topic" ? <StudyLinks topicId={id} current="topic_assessment" /> : (
        <p className="study-links">
          <Link href={`/learn/units/${id}`}>Unit</Link>
        </p>
      )}
      <p className="brand">
        <Link href={scope === "topic" ? `/learn/topics/${id}` : "/learn"}>Back</Link>
      </p>
      <h1>{scope === "unit" ? `${id} unit assessment` : "Topic assessment"}</h1>
      <p className="meta">
        CForge practice. Not a university examination. About {items.length * 3} minutes. Answers are
        scored on the server. Two or more question families are included.
      </p>
      <AssessmentForm assessmentId={assessmentId} items={items.map(publicItem)} />
    </>
  );
}
