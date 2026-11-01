import { describe, expect, it } from "vitest";
import { allPackages, packageForTopic, publicItem, scoreResponses } from "@/lib/content/registry";
import { assertDraftQuality } from "@/lib/content/compile";
import { hubCards, topicAvailability } from "@/lib/learning/resources";
import { VISUALIZER_IDS } from "@/components/visualizers/tools";
import { frequencyClaimsAllowed } from "@/lib/content/ingest";
import { getTopic, loadLesson } from "@/lib/curriculum/catalog";

const UNIT_2_TO_5_TEACHING = [
  "u2-t1",
  "u2-t2",
  "u2-t3",
  "u2-t4",
  "u2-t5",
  "u2-t6",
  "u3-t1",
  "u3-t2",
  "u3-t3",
  "u3-t4",
  "u3-t5",
  "u4-t1",
  "u4-t2",
  "u4-t3",
  "u4-t4",
  "u4-t5",
  "u5-t1",
  "u5-t2",
  "u5-t3",
  "u5-t4",
  "u5-t5",
  "u5-t6",
  "u5-t7",
  "u5-t8",
] as const;

const TEACHING_CARD_TYPES = [
  "deep_lesson",
  "complete_notes",
  "one_shot",
  "mind_map",
  "quick_notes",
  "concept_library",
  "flashcards",
  "worked_examples",
  "code_tracing",
  "output_prediction",
  "syntax_reference",
  "visualisation",
  "guided_practice",
  "independent_practice",
  "topic_assessment",
  "revision",
  "related",
] as const;

describe("five-unit teaching packages", () => {
  it("covers every teaching topic with a complete package", () => {
    const pkgs = allPackages();
    expect(pkgs.length).toBeGreaterThanOrEqual(28);
    for (const pkg of pkgs) {
      const errors = assertDraftQuality(pkg);
      expect(errors, `${pkg.topicId}: ${errors.join("; ")}`).toEqual([]);
    }
    expect(packageForTopic("u2-t1")?.lesson.id).toBe("u2-t1-precedence");
    expect(packageForTopic("u4-t3")?.notes.explanation).toMatch(/value/i);
    expect(JSON.stringify(pkgs)).not.toMatch(/PYQ frequency|predicted marks|weightage \d+%/);
  });

  it("labels strrev and call-by-reference accurately", () => {
    const u3 = packageForTopic("u3-t4");
    expect(JSON.stringify(u3)).toMatch(/not.*standard|non-standard|ISO/i);
    const u4 = packageForTopic("u4-t3");
    expect(JSON.stringify(u4)).toMatch(/pass-by-value|passes arguments by value/i);
  });
});

describe("units 2–5 teaching drafts", () => {
  it("compiles all 24 topic IDs through the registry", () => {
    expect(UNIT_2_TO_5_TEACHING).toHaveLength(24);
    for (const topicId of UNIT_2_TO_5_TEACHING) {
      const pkg = packageForTopic(topicId);
      expect(pkg, topicId).toBeTruthy();
      const errors = assertDraftQuality(pkg!);
      expect(errors, `${topicId}: ${errors.join("; ")}`).toEqual([]);
      expect(pkg!.topicId).toBe(topicId);
      expect(allPackages().some((p) => p.topicId === topicId)).toBe(true);
      const catalog = getTopic(topicId);
      expect(catalog?.topic.sourceLabel).toBe(pkg!.lesson.sourceLabel);
    }
    const u5t8 = packageForTopic("u5-t8");
    expect(u5t8?.provenance).toBe("supplementary");
    expect(u5t8?.officialLab).toBe(false);
  });

  it("loads every compiled lesson by lessonId and keeps example code", () => {
    for (const topicId of UNIT_2_TO_5_TEACHING) {
      const pkg = packageForTopic(topicId)!;
      const lesson = loadLesson(pkg.lesson.id);
      expect(lesson, pkg.lesson.id).toBeTruthy();
      expect(lesson!.id).toBe(pkg.lesson.id);
      expect(lesson!.topicId).toBe(topicId);
      const examples = (lesson!.body as { examples?: Array<{ code?: string; problem?: string }> }).examples ?? [];
      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.some((ex) => Boolean(ex.code))).toBe(true);
      expect(examples.some((ex) => Boolean(ex.problem))).toBe(true);
    }
  });

  it("exposes real AVAILABLE hub hrefs and keeps official labs unpublished", () => {
    for (const topicId of UNIT_2_TO_5_TEACHING) {
      const avail = topicAvailability(topicId);
      expect(avail.lesson, topicId).toBe("AVAILABLE");
      expect(avail.notes, topicId).toBe("AVAILABLE");
      expect(avail.topicAssessment, topicId).toBe("AVAILABLE");
      expect(avail.laboratory, topicId).toMatch(/UNAVAILABLE|UNVERIFIED/);
      const cards = hubCards(topicId);
      const lab = cards.find((c) => c.type === "laboratory");
      expect(lab?.availability).not.toBe("AVAILABLE");
      for (const type of TEACHING_CARD_TYPES) {
        const card = cards.find((c) => c.type === type);
        expect(card, `${topicId} ${type}`).toBeTruthy();
        expect(card!.availability, `${topicId} ${type}`).toBe("AVAILABLE");
        expect(card!.href, `${topicId} ${type}`).toBeTruthy();
        expect(card!.href).toMatch(/^\//);
      }
      const lessonCard = cards.find((c) => c.type === "deep_lesson");
      expect(lessonCard?.href).toBe(`/learn/lessons/${packageForTopic(topicId)!.lesson.id}`);
    }
  });

  it("strips answers and explanations from every public assessment item", () => {
    for (const topicId of UNIT_2_TO_5_TEACHING) {
      const pkg = packageForTopic(topicId)!;
      expect(pkg.assessment.length).toBeGreaterThanOrEqual(4);
      for (const item of pkg.assessment) {
        const pub = publicItem(item);
        expect(Object.keys(pub).sort()).toEqual(
          ["choices", "family", "id", "marks", "method", "prompt", "topicId"].sort(),
        );
        expect(pub).not.toHaveProperty("answer");
        expect(pub).not.toHaveProperty("explanation");
        expect(pub.prompt).toBe(item.prompt);
        expect(pub.topicId).toBe(topicId);
      }
    }
  });
});

describe("official laboratory honesty", () => {
  it("keeps official labs unavailable", () => {
    expect(topicAvailability("u1-t8").laboratory).toMatch(/UNAVAILABLE|UNVERIFIED/);
    expect(topicAvailability("u1-t8").lesson).not.toBe("AVAILABLE");
    expect(hubCards("u1-t8").find((c) => c.type === "laboratory")?.availability).not.toBe("AVAILABLE");
  });

  it("exposes real hub links only when available", () => {
    const cards = hubCards("u2-t2");
    const notes = cards.find((c) => c.type === "complete_notes");
    expect(notes?.availability).toBe("AVAILABLE");
    expect(notes?.href).toBe("/learn/topics/u2-t2/notes");
    expect(topicAvailability("u2-t1").lesson).toBe("AVAILABLE");
    expect(topicAvailability("u2-t1").topicAssessment).toBe("AVAILABLE");
  });
});

describe("assessment scoring", () => {
  it("scores on the server and keeps keys off the public item", () => {
    const pkg = packageForTopic("u1-t1");
    expect(pkg).toBeTruthy();
    const pub = publicItem(pkg!.assessment[0]);
    expect(pub).not.toHaveProperty("answer");
    expect(pub).not.toHaveProperty("explanation");
    const right: Record<string, string> = {};
    for (const item of pkg!.assessment) right[item.id] = item.answer;
    const full = scoreResponses(pkg!.assessment, right);
    expect(full.earned).toBe(full.total);
    const empty = scoreResponses(pkg!.assessment, {});
    expect(empty.earned).toBe(0);
  });
});

describe("visualisers and ingest", () => {
  it("registers eight interactive tools", () => {
    expect(VISUALIZER_IDS).toEqual(
      expect.arrayContaining([
        "binary",
        "syntax",
        "algorithm",
        "flowchart",
        "control-flow",
        "array-string",
        "recursion",
        "search-sort",
      ]),
    );
  });

  it("refuses frequency claims without verified papers", () => {
    expect(frequencyClaimsAllowed([])).toBe(false);
  });
});
