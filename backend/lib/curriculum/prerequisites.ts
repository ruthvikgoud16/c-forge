import { loadCatalog, officialTopics } from "./catalog";

export type DependencyKind = "recommended" | "hard";

export type PrerequisiteEdge = {
  topicId: string;
  prerequisiteId: string;
  kind: DependencyKind;
  justification: string;
};

/** Instructional graph from the accepted 2C architecture. Official order stays in catalog.ordinal. */
const RAW_EDGES: Array<[string, string, DependencyKind, string]> = [
  ["u1-t1", "f-basic-computer", "recommended", "Block diagram is easier after basic computer vocabulary."],
  ["u1-t2", "u1-t1", "recommended", "Algorithms assume you know a computer follows steps."],
  ["u1-t3", "u1-t2", "recommended", "Names in C are easier after you can list steps."],
  ["u1-t4", "u1-t3", "recommended", "Types sit on variables."],
  ["u1-t5", "u1-t4", "recommended", "A program uses types and I/O."],
  ["u1-t6", "u1-t5", "recommended", "Operators appear inside a full program."],
  ["u1-t7", "u1-t6", "recommended", "Later operators reuse earlier operator ideas."],
  ["u2-t1", "u1-t6", "recommended", "Precedence is about the operators already listed."],
  ["u2-t2", "u1-t5", "recommended", "if statements live in a C program."],
  ["u2-t2", "u2-t1", "recommended", "Conditions use expression values."],
  ["u2-t3", "u2-t2", "recommended", "else-if and switch extend simple if."],
  ["u2-t5", "u2-t2", "recommended", "Loops decide whether to repeat."],
  ["u2-t5", "u2-t4", "recommended", "break/continue are usually taught with loops."],
  ["u2-t6", "u2-t5", "recommended", "for is another loop form."],
  ["u3-t1", "u2-t6", "recommended", "Walking an array uses a loop."],
  ["u3-t2", "u3-t1", "recommended", "More dimensions reuse one-dimensional indexing."],
  ["u3-t3", "u3-t1", "recommended", "A string is a char array with a terminator."],
  ["u3-t4", "u3-t3", "recommended", "Library string work needs string I/O first."],
  ["u3-t5", "u3-t3", "recommended", "Manual string work needs the same memory picture."],
  ["u4-t2", "u1-t5", "recommended", "Functions sit in a C program."],
  ["u4-t1", "u4-t2", "recommended", "Storage classes are about where function data lives."],
  ["u4-t3", "u4-t2", "recommended", "Parameter passing is about calling a function."],
  ["u4-t4", "u4-t3", "recommended", "Arrays as arguments reuse passing ideas."],
  ["u4-t4", "u3-t1", "recommended", "You must already index an array."],
  ["u4-t5", "u4-t2", "recommended", "Recursion is a function that calls itself."],
  ["u5-t1", "u3-t1", "recommended", "Search walks an array."],
  ["u5-t1", "u2-t6", "recommended", "Search uses a loop."],
  ["u5-t2", "u5-t1", "recommended", "Binary search is a second search method."],
  ["u5-t3", "u5-t1", "recommended", "Sorts also walk arrays."],
  ["u5-t4", "u5-t1", "recommended", "Sorts also walk arrays."],
  ["u5-t5", "u5-t1", "recommended", "Sorts also walk arrays."],
  ["u5-t6", "u5-t1", "recommended", "Quick sort needs array + some function ideas."],
  ["u5-t6", "u4-t5", "recommended", "Quick sort is usually taught with recursion."],
  ["u5-t7", "u5-t1", "recommended", "Merge sort needs array + some function ideas."],
  ["u5-t7", "u4-t5", "recommended", "Merge sort is usually taught with recursion."],
];

function knownIds() {
  const catalog = loadCatalog();
  const ids = new Set<string>();
  for (const topic of officialTopics()) ids.add(topic.id);
  for (const topic of catalog.foundation.topics) ids.add(topic.id);
  return ids;
}

export function validatePrerequisiteEdges(
  raw: Array<[string, string, DependencyKind, string]>,
  ids = knownIds(),
) {
  const edges: PrerequisiteEdge[] = [];
  const errors: string[] = [];
  for (const [topicId, prerequisiteId, kind, justification] of raw) {
    if (!ids.has(topicId)) errors.push(`unknown topic ${topicId}`);
    if (!ids.has(prerequisiteId)) errors.push(`unknown prerequisite ${prerequisiteId}`);
    if (topicId === prerequisiteId) errors.push(`self edge ${topicId}`);
    edges.push({ topicId, prerequisiteId, kind, justification });
  }
  const cycle = detectCycle(edges);
  if (cycle) errors.push(`cycle ${cycle.join(" -> ")}`);
  return { edges, errors };
}

export function loadPrerequisiteGraph() {
  return validatePrerequisiteEdges(RAW_EDGES);
}

export function assertPrerequisiteGraph() {
  const { errors } = loadPrerequisiteGraph();
  if (errors.length) throw new Error(errors.join("; "));
}

export function prerequisitesOf(topicId: string) {
  return loadPrerequisiteGraph().edges.filter((e) => e.topicId === topicId);
}

export function unmetPrerequisites(
  topicId: string,
  demonstrated: Set<string>,
) {
  return prerequisitesOf(topicId).filter((e) => !demonstrated.has(e.prerequisiteId));
}

function detectCycle(edges: PrerequisiteEdge[]) {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.prerequisiteId) ?? [];
    list.push(e.topicId);
    adj.set(e.prerequisiteId, list);
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const stack: string[] = [];
  const visit = (node: string): string[] | null => {
    if (done.has(node)) return null;
    if (visiting.has(node)) return [...stack, node];
    visiting.add(node);
    stack.push(node);
    for (const next of adj.get(node) ?? []) {
      const hit = visit(next);
      if (hit) return hit;
    }
    stack.pop();
    visiting.delete(node);
    done.add(node);
    return null;
  };
  for (const node of new Set([...edges.map((e) => e.topicId), ...edges.map((e) => e.prerequisiteId)])) {
    const hit = visit(node);
    if (hit) return hit;
  }
  return null;
}
