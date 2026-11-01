import { allJudgeExercises, exerciseIdForTopic, topicIdForExercise } from "@/lib/academy/exercise-bank";
import { toPublicExercise } from "@/lib/academy/public-dto";
import { listLabs, listPapers } from "@/lib/content/ingest";
import { allPackages, packageForTopic, publicItem, unitAssessmentItems } from "@/lib/content/registry";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";
import { getTopic, loadCatalog, officialTopics, officialUnits } from "@/lib/curriculum/catalog";
import { dashboardPayload } from "@/lib/learning/recommend";
import { getPlacement } from "@/lib/learning/store";
import { topicState } from "@/lib/curriculum/progress";

const TOOLS = new Set<string>(VISUALIZER_IDS);

function mastery(studentId: string, topicId: string) {
  const placement = getPlacement(studentId, topicId);
  const state = topicState(studentId, topicId);
  if (state === "mastered") return "mastered";
  if (placement === "NEEDS_REVISION" || state === "practised") return "needs-practice";
  if (placement === "DEMONSTRATED" || state === "assessment_passed") return "demonstrated";
  if (state === "started") return "opened";
  return "not-started";
}

function lessonSections(lesson: { title: string; objectives?: string[]; body?: Record<string, unknown> }) {
  const sections: Array<{ id: string; kind: string; title: string; body?: string; items?: string[]; code?: string }> = [];
  if (lesson.objectives?.length) {
    sections.push({ id: "objectives", kind: "objectives", title: "Objectives", items: lesson.objectives });
  }
  const body = lesson.body ?? {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string" && value.trim()) {
      sections.push({ id: key, kind: key === "syntax" ? "syntax" : "concept", title: key, body: value });
    }
  }
  if (!sections.length) sections.push({ id: "lesson", kind: "intro", title: lesson.title, body: lesson.title });
  return sections;
}

function publicTopics() {
  return officialTopics().map((topic, index) => {
    const found = getTopic(topic.id);
    const pkg = packageForTopic(topic.id);
    const example = pkg?.examples[0];
    const exerciseId = pkg?.practice?.exerciseId ?? exerciseIdForTopic(topic.id);
    return {
      id: topic.id,
      unitId: found?.unit.id ?? "unit-1",
      order: topic.ordinal ?? index + 1,
      title: topic.title,
      summary: topic.sourceLabel ?? found?.unit.sourceLabel ?? "",
      concepts: (pkg?.concepts ?? []).map((row) => ({ term: row.prompt, definition: row.explanation })),
      example: {
        code: example?.code ?? "",
        output: example?.output ?? "",
        explanation: example?.problem ?? "",
      },
      tools: (pkg?.visualizerIds ?? []).filter((id) => TOOLS.has(id)),
      exerciseIds: exerciseId ? [exerciseId] : [],
      source: "original" as const,
    };
  });
}

export function publicCatalog() {
  const catalog = loadCatalog();
  return {
    units: officialUnits().map((unit) => ({
      id: unit.id,
      number: unit.ordinal ?? 0,
      title: unit.title,
      shortTitle: unit.title,
      summary: unit.overview?.teaches ?? unit.sourceLabel,
    })),
    topics: publicTopics(),
    packageCount: allPackages().length,
    visualiserCount: VISUALIZER_IDS.length,
    foundation: {
      title: catalog.foundation.title,
      notAnOfficialUnit: true,
      topics: catalog.foundation.topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        classification: topic.classification,
      })),
    },
  };
}

export function learnGraph(studentId: string, rollIdentifier: string) {
  const dash = dashboardPayload(studentId, rollIdentifier);
  const topics = publicTopics();
  const units = officialUnits().map((unit) => ({
    id: unit.id,
    number: unit.ordinal ?? 0,
    title: unit.title,
    shortTitle: unit.title,
    summary: unit.overview?.teaches ?? unit.sourceLabel,
  }));
  const lessons = allPackages().map((pkg) => ({
    topicId: pkg.topicId,
    lesson: {
      topicId: pkg.topicId,
      title: pkg.lesson.title,
      sections: lessonSections(pkg.lesson),
      source: "original" as const,
    },
    notes: {
      topicId: pkg.topicId,
      title: pkg.lesson.title,
      sections: [
        { heading: "Definitions", points: pkg.notes.definitions.map((row) => `${row.term}: ${row.meaning}`) },
        { heading: "Explanation", points: [pkg.notes.explanation].filter(Boolean) },
        { heading: "Distinctions", points: pkg.notes.distinctions },
        ...(pkg.notes.syntax ? [{ heading: "Syntax", points: [pkg.notes.syntax], code: pkg.notes.syntax }] : []),
      ],
      source: "original" as const,
    },
    oneShot: {
      topicId: pkg.topicId,
      title: pkg.lesson.title,
      keyPoints: pkg.oneShot.takeaways.length ? pkg.oneShot.takeaways : pkg.oneShot.sequence,
      syntax: pkg.notes.syntax || undefined,
      pitfalls: pkg.notes.mistakes,
      quickCheck: pkg.oneShot.endCheck?.prompt
        ? [{ q: pkg.oneShot.endCheck.prompt, a: pkg.oneShot.endCheck.answer }]
        : [],
      source: "original" as const,
    },
    flashcards: pkg.flashcards.map((card) => ({
      id: card.id,
      topicId: pkg.topicId,
      front: card.front,
      back: card.back,
    })),
    assessment: {
      id: `topic:${pkg.topicId}`,
      kind: "topic" as const,
      title: pkg.lesson.title,
      scopeId: pkg.topicId,
      questionCount: pkg.assessment.length,
      source: "original" as const,
      questions: pkg.assessment.map((item) => {
        const pub = publicItem(item);
        return {
          id: pub.id,
          type: "single-choice" as const,
          prompt: pub.prompt,
          options: (pub.choices ?? []).map((choice) => ({ id: choice, label: choice })),
        };
      }),
    },
  }));
  const unitAssessments = officialUnits().map((unit) => {
    const items = unitAssessmentItems(unit.id);
    return {
      id: `unit:${unit.id}`,
      kind: "unit" as const,
      title: unit.title,
      scopeId: unit.id,
      questionCount: items.length,
      source: "original" as const,
      questions: items.map((item) => {
        const pub = publicItem(item);
        return {
          id: pub.id,
          type: "single-choice" as const,
          prompt: pub.prompt,
          options: (pub.choices ?? []).map((choice) => ({ id: choice, label: choice })),
        };
      }),
    };
  });
  const progress = {
    studentId,
    recommendedTopicId: dash.recommendedNext.topicId,
    topics: topics.map((topic) => ({ topicId: topic.id, state: mastery(studentId, topic.id) })),
    attempts: dash.analytics.assessmentHistory.map((row) => ({
      assessmentId: row.assessmentId,
      title: row.label,
      date: row.completedAt.slice(0, 10),
      correct: row.earned,
      total: row.total,
    })),
    recent: [
      ...(dash.continueLearning
        ? [{ topicId: dash.continueLearning.topicId, resource: dash.continueLearning.kind, date: dash.continueLearning.at.slice(0, 10) }]
        : []),
      ...dash.analytics.recentlyOpened.map((row) => ({
        topicId: row.topicId,
        resource: row.kind,
        date: row.at.slice(0, 10),
      })),
    ],
  };
  const maps = allPackages().map((pkg) => {
    const children = pkg.lesson.mindMap?.children ?? [];
    const nodes = [
      { id: pkg.topicId, label: pkg.lesson.mindMap?.title ?? pkg.lesson.title, kind: "root" },
      ...children.map((child, index) => {
        const row = child as { title?: string; topicId?: string };
        return {
          id: `${pkg.topicId}-${index}`,
          label: row.title ?? "Topic",
          kind: "topic",
          href: row.topicId ? `/learn/topics/${row.topicId}` : undefined,
        };
      }),
    ];
    return {
      topicId: pkg.topicId,
      map: {
        id: pkg.topicId,
        title: pkg.lesson.mindMap?.title ?? pkg.lesson.title,
        nodes,
        edges: nodes.slice(1).map((node) => ({ from: pkg.topicId, to: node.id })),
      },
    };
  });
  const unitMaps = officialUnits().map((unit) => ({
    unitId: unit.id,
    map: {
      id: unit.id,
      title: unit.title,
      nodes: [
        { id: unit.id, label: unit.title, kind: "root" },
        ...unit.topics.map((topic) => ({
          id: topic.id,
          label: topic.title,
          kind: "topic",
          href: `/learn/topics/${topic.id}`,
        })),
      ],
      edges: unit.topics.map((topic) => ({ from: unit.id, to: topic.id })),
    },
  }));
  return {
    me: {
      id: studentId,
      rollNumber: rollIdentifier,
      name: dash.displayName ?? rollIdentifier,
      cohort: "",
    },
    units,
    topics,
    progress,
    lessons,
    maps,
    unitMaps,
    assessments: [...lessons.map((row) => row.assessment), ...unitAssessments],
    exercises: allJudgeExercises().map((row) => {
      const pub = toPublicExercise(row);
      return {
        id: pub.id,
        title: pub.title,
        topicId: topicIdForExercise(pub.id) ?? "",
        difficulty: "core" as const,
        statement: pub.statement,
        inputFormat: pub.inputFormat,
        outputFormat: pub.outputFormat,
        constraints: [pub.constraints],
        samples: [{ input: pub.sample.stdin, output: pub.sample.stdout }],
        starterCode: pub.starterCode,
        hiddenTestCount: row.tests.filter((test) => test.visibility === "hidden").length,
      };
    }),
    labs: listLabs(),
    papers: listPapers(),
    pending: dash.pendingAssessments,
    weakConcepts: dash.weakConcepts,
  };
}
