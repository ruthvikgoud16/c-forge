import Link from "next/link";
import { loadCatalog } from "@/lib/curriculum/catalog";

export default function FoundationPage() {
  const { foundation } = loadCatalog();
  return (
    <>
      <p className="brand">Not an official sixth unit</p>
      <h1>{foundation.title}</h1>
      <p>{foundation.sourceNote}</p>
      <p className="meta">Source label kept: {foundation.sourceLabel}</p>
      <ol>
        {foundation.topics.map((topic) => (
          <li key={topic.id} id={topic.id}>
            <strong>{topic.title}</strong>
            <span className="meta"> · {topic.classification}</span>
            <div className="meta">Source: {topic.sourceLabels?.join(" ")}</div>
            {topic.needsHumanVerification ? <div className="meta">Needs human verification.</div> : null}
            {topic.accuracyNotes?.map((n) => (
              <div key={n} className="meta">
                {n}
              </div>
            ))}
          </li>
        ))}
      </ol>
      <p>
        <Link href="/learn/lessons/u1-t1-computers-and-binary">Return to the Unit 1 first lesson</Link>
      </p>
    </>
  );
}
