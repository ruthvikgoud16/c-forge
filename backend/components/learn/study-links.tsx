import Link from "next/link";
import { getTopic, officialTopics } from "@/lib/curriculum/catalog";
import { packageForTopic } from "@/lib/content/registry";
import { hubCards } from "@/lib/learning/resources";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";

const CURRENT: Record<string, string> = {
  lesson: "deep_lesson",
  notes: "complete_notes",
  oneshot: "one_shot",
  "mind-map": "mind_map",
  quick: "quick_notes",
  concepts: "concept_library",
  flashcards: "flashcards",
  examples: "worked_examples",
  trace: "code_tracing",
  predict: "output_prediction",
  syntax: "syntax_reference",
  practice: "guided_practice",
  topic_assessment: "topic_assessment",
};

const TOOL_LABELS: Record<string, string> = {
  binary: "Binary",
  syntax: "Syntax",
  algorithm: "Algorithm",
  flowchart: "Flowchart",
  "control-flow": "Control flow",
  "array-string": "Arrays and strings",
  recursion: "Functions and recursion",
  "search-sort": "Searching and sorting",
};

export function StudyLinks({ topicId, current }: { topicId: string; current: string }) {
  const found = getTopic(topicId);
  const pkg = packageForTopic(topicId);
  const cards = hubCards(topicId).filter(
    (card) => card.href && card.availability === "AVAILABLE" && card.type !== "laboratory" && card.type !== "related",
  );
  const sequence = officialTopics().filter((topic) => packageForTopic(topic.id)?.lesson.id);
  const index = sequence.findIndex((topic) => topic.id === topicId);
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 ? sequence[index + 1] : null;
  const tools = (pkg?.visualizerIds ?? []).filter((id) => (VISUALIZER_IDS as readonly string[]).includes(id));

  return (
    <nav className="study-links" aria-label="Topic resources">
      {found ? <Link href={`/learn/units/${found.unit.slug}`}>{found.unit.title}</Link> : null}
      <Link href={`/learn/topics/${topicId}`}>Topic</Link>
      {cards.map((card) => (
        <Link key={card.type} href={card.href!} aria-current={CURRENT[current] === card.type ? "page" : undefined}>
          {card.title}
        </Link>
      ))}
      {tools.map((id) => (
        <Link key={id} href={`/learn/tools/${id}?topic=${topicId}`} aria-current={current === id ? "page" : undefined}>
          {TOOL_LABELS[id] ?? id}
        </Link>
      ))}
      {prev ? (
        <Link href={`/learn/lessons/${packageForTopic(prev.id)!.lesson.id}`}>Previous lesson</Link>
      ) : null}
      {next ? (
        <Link href={`/learn/lessons/${packageForTopic(next.id)!.lesson.id}`}>Next lesson</Link>
      ) : null}
    </nav>
  );
}
