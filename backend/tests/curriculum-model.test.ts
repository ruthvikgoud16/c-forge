import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LESSON_SECTIONS } from "@/lib/curriculum/types";
import { loadCatalog, loadLesson, officialTopics, officialUnits } from "@/lib/curriculum/catalog";
import { getTeacherProvider } from "@/lib/ai/provider";
import { deriveState } from "@/lib/mastery/types";
import { recordProgress, topicState } from "@/lib/curriculum/progress";

const REQUIRED_OFFICIAL = [
  "Introduction: Block diagram of a computer and its components, Binary System.",
  "Algorithms and Flowcharts.",
  "C Preliminaries: Keywords, Identifiers, Constants, and Variables.",
  "C Preliminaries: Data Types, Formatted Input/Output Statements.",
  "C Preliminaries: Structure of a C Program — Examples.",
  "Operators: Arithmetic, Assignment, Relational and Logical Operators.",
  "Operators: Increment and Decrement, Bitwise, Ternary and Special Operators.",
  "Experiments / Laboratory for Unit I.",
  "Precedence and Associativity, Type Conversion with Examples.",
  "Conditional Statements: if, if-else, nested if-else and Examples.",
  "Conditional Statements: else-if ladder and switch statements with Examples.",
  "Unconditional Statements: break, continue and goto.",
  "Control Structures: while, do-while.",
  "Control Structures: for and its examples.",
  "Experiments / Laboratory for Unit II.",
  "Arrays: Introduction, One-Dimensional.",
  "Multi-Dimensional Array with suitable examples.",
  "Strings: Introduction, String I/O, Unformatted I/O.",
  "String operations with built-in functions: strlen(), strcmp(), strcat(), strcpy(), and strrev().",
  "String operations without built-in functions.",
  "Experiments / Laboratory for Unit III.",
  "Storage Classes: auto, static, register and extern with suitable examples.",
  "Functions: Introduction to Functions, Working with functions, Benefits and Types of Functions, return(), exit().",
  "Parameter Passing Mechanisms: Call by Value and Call by Reference.",
  "Passing Arrays to Functions.",
  "Recursion with suitable illustrative programs.",
  "Experiments / Laboratory for Unit IV.",
  "Searching: Linear Search.",
  "Searching: Binary Search.",
  "Sorting: Bubble Sort.",
  "Sorting: Insertion Sort.",
  "Sorting: Selection Sort.",
  "Sorting: Quick Sort.",
  "Sorting: Merge Sort.",
  "Competitive Programming Practice Problems using global coding platforms, Experiments / Laboratory for Unit V.",
];

describe("official syllabus ingestion", () => {
  it("has exactly five official units and every supplied topic wording", () => {
    const units = officialUnits();
    expect(units).toHaveLength(5);
    const labels = officialTopics().map((t) => t.sourceLabel);
    expect(labels).toHaveLength(35);
    expect(labels).toEqual(REQUIRED_OFFICIAL);
    expect(units.every((u) => u.classification === "OFFICIAL")).toBe(true);
    expect(JSON.stringify(loadCatalog())).not.toMatch(/previous-year|PYQ frequency|predicted marks/i);
  });

  it("keeps foundation separate and flags incomplete Unit 999", () => {
    const { foundation } = loadCatalog();
    expect(foundation.notAnOfficialUnit).toBe(true);
    expect(foundation.kind).toBe("foundation");
    expect(foundation.topics).toHaveLength(17);
    expect(foundation.missingEntryCount).toBe(20);
    const unverified = foundation.topics.filter((t) => t.classification === "LEGACY_UNVERIFIED");
    expect(unverified.map((t) => t.id)).toEqual(["f-overview-pic", "f-mid-paper", "f-grand-test-1"]);
    expect(officialUnits().some((u) => u.id === "foundation")).toBe(false);
  });

  it("labels strrev and call-by-reference accuracy notes", () => {
    const catalog = JSON.stringify(loadCatalog());
    expect(catalog).toMatch(/strrev/);
    expect(catalog).toMatch(/non-standard/);
    expect(catalog).toMatch(/pass-by-reference|Call by Reference/);
  });
});

describe("first Unit 1 lesson", () => {
  it("is a complete beginner journey with notes, visual, trace, predict, and checks", () => {
    const lesson = loadLesson("u1-t1-computers-and-binary");
    expect(lesson).toBeTruthy();
    const body = lesson!.body as Record<string, unknown>;
    for (const key of [
      "objectives",
      "explanation",
      "analogy",
      "visual",
      "execution",
      "trace",
      "predict",
      "mistakes",
      "guided",
      "independent",
      "check",
      "summary",
      "revision",
    ]) {
      expect(body[key], key).toBeTruthy();
    }
    expect(lesson!.notes).toBeTruthy();
    expect((body.check as unknown[]).length).toBeGreaterThanOrEqual(3);
    expect(LESSON_SECTIONS.length).toBe(14);
  });

  it("does not treat opening as mastery", () => {
    const studentId = "test-student-u1";
    recordProgress({
      studentId,
      topicId: "u1-t1",
      lessonId: "u1-t1-computers-and-binary",
      kind: "lesson_opened",
      dimension: "concept",
      assisted: false,
    });
    expect(topicState(studentId, "u1-t1")).toBe("started");
    expect(
      deriveState({
        opened: true,
        practised: true,
        assessmentPassed: true,
        independentOk: true,
        retentionOk: true,
      }),
    ).toBe("mastered");
  });
});

describe("teacher provider", () => {
  it("is model-agnostic and unconfigured", async () => {
    const provider = getTeacherProvider();
    expect(provider.id).toBe("unconfigured");
    const reply = await provider.complete({
      role: "explain",
      studentLevel: "beginner",
      messages: [],
      allowCompleteSolution: false,
    });
    expect(reply.text).toMatch(/not configured/i);
  });
});

describe("curriculum sql stays off the judge path", () => {
  it("does not rewrite seat-cap or hidden tests", () => {
    const sql = readFileSync(new URL("../db/schema-curriculum.sql", import.meta.url), "utf8");
    expect(sql).not.toMatch(/students_enforce_seat_cap/);
    expect(sql).toMatch(/classification/);
  });
});
