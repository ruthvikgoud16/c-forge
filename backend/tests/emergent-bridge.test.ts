import { describe, expect, it } from "vitest";
import { learnGraph, publicCatalog } from "@/lib/integration/emergent-bridge";
import { seedRoster } from "@/lib/roster/store";

describe("emergent bridge", () => {
  it("publishes the official catalog without treating foundation as a unit", () => {
    const catalog = publicCatalog();
    expect(catalog.units).toHaveLength(5);
    expect(catalog.topics.length).toBeGreaterThan(0);
    expect(catalog.topics.every((topic) => topic.unitId && topic.title)).toBe(true);
    expect(catalog.foundation.notAnOfficialUnit).toBe(true);
    expect(catalog.foundation.topics).toHaveLength(17);
    expect(JSON.stringify(catalog)).not.toMatch(/"answer"\s*:/);
  });

  it("builds a student graph without answer keys or hidden judge output", () => {
    seedRoster();
    const graph = learnGraph("bridge-test-student", "26EG104G55");
    const encoded = JSON.stringify(graph);
    expect(encoded).not.toMatch(/"answer"\s*:/);
    expect(encoded).not.toContain("expectedStdout");
    expect(graph.me.rollNumber).toBe("26EG104G55");
    expect(graph.me.name).toBe("26EG104G55");
    expect(graph.progress.recommendedTopicId).toBeTruthy();
    expect(graph.exercises.length).toBeGreaterThan(0);
    expect(graph.exercises.every((row) => !("tests" in row))).toBe(true);
  });
});
