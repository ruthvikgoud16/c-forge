// Builds demonstration study material from the structured topic fixture.
// Replace with original teaching-package content when integrated with the CForge API.
import type { AssessmentWithQuestions, Flashcard, Lesson, MindMap, Notes, OneShot, Question, Topic, Unit } from "@/domain/types";
import { TOOL_META } from "./tools";

export function buildLesson(t: Topic): Lesson {
  return {
    topicId: t.id,
    title: t.title,
    source: "demo",
    sections: [
      { id: "intro", kind: "intro", title: "Introduction", body: t.summary },
      { id: "objectives", kind: "objectives", title: "Learning objectives", items: t.concepts.map((c) => `Explain ${c.term.toLowerCase()} and recognise it in C code.`).concat("Trace the worked example and predict its output.") },
      ...t.concepts.map((c, i) => ({ id: `concept-${i}`, kind: "concept" as const, title: c.term, body: c.definition })),
      ...(t.syntax ? [{ id: "syntax", kind: "syntax" as const, title: "Syntax", code: t.syntax }] : []),
      { id: "example", kind: "example", title: "Worked example", code: t.example.code, output: t.example.output, body: t.example.explanation },
      { id: "trace", kind: "trace", title: "Trace and predict", body: "Before revealing the output, trace the example line by line and write down what you expect it to print.", code: t.example.code, output: t.example.output },
      { id: "guided", kind: "guided", title: "Guided practice", items: [`Modify the worked example so it uses a different input value, then re-trace it.`, `Identify where "${t.concepts[0]!.term}" appears in the example.`] },
      { id: "independent", kind: "independent", title: "Independent practice", items: [`Write a short program of your own that demonstrates ${t.concepts[1]!.term.toLowerCase()}.`] },
      { id: "check", kind: "check", title: "Knowledge check", items: t.concepts.map((c) => `In one sentence, what is ${c.term}?`) },
    ],
  };
}

export function buildNotes(t: Topic): Notes {
  return {
    topicId: t.id,
    title: t.title,
    source: "demo",
    sections: [
      { heading: "Overview", points: [t.summary] },
      { heading: "Key concepts", points: t.concepts.map((c) => `${c.term} — ${c.definition}`) },
      ...(t.syntax ? [{ heading: "Syntax", points: [], code: t.syntax }] : []),
      { heading: "Example", points: [t.example.explanation, `Output: ${t.example.output}`], code: t.example.code },
      ...(t.note ? [{ heading: "Important", points: [t.note] }] : []),
    ],
  };
}

export function buildOneShot(t: Topic): OneShot {
  return {
    topicId: t.id,
    title: t.title,
    source: "demo",
    keyPoints: t.concepts.map((c) => `${c.term}: ${c.definition}`),
    syntax: t.syntax,
    pitfalls: [t.note ?? `Confusing ${t.concepts[0]!.term.toLowerCase()} with ${t.concepts[1]!.term.toLowerCase()}.`, "Skipping the trace step — always predict output before running."],
    quickCheck: [
      { q: `What does the worked example print?`, a: t.example.output },
      ...t.concepts.slice(0, 2).map((c) => ({ q: `Define ${c.term}.`, a: c.definition })),
    ],
  };
}

export function buildFlashcards(t: Topic): Flashcard[] {
  const cards: Flashcard[] = t.concepts.map((c, i) => ({ id: `${t.id}-c${i}`, topicId: t.id, front: `What is ${c.term}?`, back: c.definition }));
  cards.push({ id: `${t.id}-out`, topicId: t.id, front: "Predict the output of this code.", back: t.example.output, code: t.example.code });
  cards.push({ id: `${t.id}-why`, topicId: t.id, front: "Why does the worked example behave this way?", back: t.example.explanation });
  cards.push(
    t.syntax
      ? { id: `${t.id}-syn`, topicId: t.id, front: `Recall the general syntax for ${t.title}.`, back: "Compare with the form below.", code: t.syntax }
      : { id: `${t.id}-sum`, topicId: t.id, front: `Summarise "${t.title}" in one sentence.`, back: t.summary },
  );
  return cards; // 6 per topic → 186 across 31 topics
}

export function buildTopicMindMap(t: Topic): MindMap {
  const nodes: MindMap["nodes"] = [{ id: "root", label: t.title, kind: "root", detail: t.summary }];
  const edges: MindMap["edges"] = [];
  t.concepts.forEach((c, i) => {
    nodes.push({ id: `c${i}`, label: c.term, kind: "concept", detail: c.definition });
    edges.push({ from: "root", to: `c${i}` });
  });
  nodes.push({ id: "ex", label: "Worked example", kind: "resource", detail: `Output: ${t.example.output}`, href: `/learn/topics/${t.id}/lesson` });
  edges.push({ from: "root", to: "ex" });
  t.tools.forEach((tool) => {
    nodes.push({ id: `tool-${tool}`, label: TOOL_META[tool].name, kind: "resource", detail: TOOL_META[tool].blurb, href: `/learn/tools/${tool}` });
    edges.push({ from: "root", to: `tool-${tool}` });
  });
  return { id: `mm-${t.id}`, title: t.title, nodes, edges };
}

export function buildUnitMindMap(u: Unit, ts: Topic[]): MindMap {
  const nodes: MindMap["nodes"] = [{ id: "root", label: `Unit ${u.number}`, kind: "root", detail: u.title }];
  const edges: MindMap["edges"] = [];
  ts.forEach((t) => {
    nodes.push({ id: t.id, label: t.title, kind: "topic", detail: t.summary, href: `/learn/topics/${t.id}` });
    edges.push({ from: "root", to: t.id });
    t.concepts.forEach((c, i) => {
      nodes.push({ id: `${t.id}-c${i}`, label: c.term, kind: "concept", detail: c.definition });
      edges.push({ from: t.id, to: `${t.id}-c${i}` });
    });
  });
  return { id: `mm-${u.id}`, title: u.title, nodes, edges };
}

/** Demo questions + answer key. In production the key must stay server-side. */
export function buildQuestions(scope: Topic[], pool: Topic[], count: number): { questions: Question[]; key: Record<string, string> } {
  const questions: Question[] = [];
  const key: Record<string, string> = {};
  const allDefs = pool.flatMap((t) => t.concepts);
  let qi = 0;
  for (const t of scope) {
    for (const c of t.concepts) {
      if (questions.length >= count) break;
      const distractors = allDefs.filter((d) => d.term !== c.term).filter((_, i) => (i + qi) % 7 === 0).slice(0, 3);
      const opts = [c, ...distractors];
      const rot = qi % opts.length;
      const ordered = [...opts.slice(rot), ...opts.slice(0, rot)];
      const id = `q${qi}`;
      questions.push({ id, type: "single-choice", prompt: `Which statement best describes “${c.term}”?`, options: ordered.map((o, i) => ({ id: `${id}-${i}`, label: o.definition })) });
      key[id] = `${id}-${ordered.indexOf(c)}`;
      qi++;
    }
    if (questions.length < count) {
      const id = `q${qi}`;
      const wrong = pool.filter((p) => p.id !== t.id).slice(qi % 5, (qi % 5) + 2).map((p) => p.example.output);
      const opts = [t.example.output, ...wrong, "Compilation error"];
      const rot = qi % opts.length;
      const ordered = [...opts.slice(rot), ...opts.slice(0, rot)];
      questions.push({ id, type: "predict-output", prompt: "What is the output of this program?", code: t.example.code, options: ordered.map((o, i) => ({ id: `${id}-${i}`, label: o })) });
      key[id] = `${id}-${ordered.indexOf(t.example.output)}`;
      qi++;
    }
    if (questions.length >= count) break;
  }
  return { questions, key };
}

export type BuiltAssessment = AssessmentWithQuestions & { key: Record<string, string> };
