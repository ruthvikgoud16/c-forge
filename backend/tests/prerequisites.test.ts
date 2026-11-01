import { describe, expect, it } from "vitest";
import {
  loadPrerequisiteGraph,
  prerequisitesOf,
  unmetPrerequisites,
  validatePrerequisiteEdges,
} from "@/lib/curriculum/prerequisites";

describe("prerequisite graph", () => {
  it("has no missing topics or cycles", () => {
    const { edges, errors } = loadPrerequisiteGraph();
    expect(errors).toEqual([]);
    expect(edges.length).toBeGreaterThan(10);
  });

  it("supports multiple recommended prerequisites", () => {
    const edges = prerequisitesOf("u2-t2");
    expect(edges.map((e) => e.prerequisiteId).sort()).toEqual(["u1-t5", "u2-t1"]);
    expect(edges.every((e) => e.kind === "recommended")).toBe(true);
  });

  it("lists a foundation dependency for the first official topic", () => {
    expect(prerequisitesOf("u1-t1").some((e) => e.prerequisiteId === "f-basic-computer")).toBe(true);
  });

  it("reports unmet recommended prerequisites without inventing completion", () => {
    const unmet = unmetPrerequisites("u1-t3", new Set(["u1-t1"]));
    expect(unmet.map((e) => e.prerequisiteId)).toContain("u1-t2");
  });

  it("rejects missing topics and cycles", () => {
    const missing = validatePrerequisiteEdges([["no-such", "u1-t1", "recommended", "x"]]);
    expect(missing.errors.some((e) => e.includes("unknown topic"))).toBe(true);
    const cycle = validatePrerequisiteEdges([
      ["u1-t1", "u1-t2", "hard", "loop"],
      ["u1-t2", "u1-t1", "hard", "loop"],
    ]);
    expect(cycle.errors.some((e) => e.startsWith("cycle"))).toBe(true);
  });
});
