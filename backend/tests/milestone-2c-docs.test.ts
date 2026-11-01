import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { officialTopics } from "@/lib/curriculum/catalog";

const MATRIX = "docs/FIVE_UNIT_RESOURCE_MATRIX.md";
const BLUEPRINT = "CFORGE_PRODUCT_BLUEPRINT.md";
const ADAPTIVE = "docs/ADAPTIVE_LEARNING_ARCHITECTURE.md";
const PROGRESS = "docs/STUDENT_PROGRESS_AND_MASTERY.md";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("Milestone 2C documentation consistency", () => {
  it("lists every official catalog topic id in the coverage matrix", () => {
    const matrix = read(MATRIX);
    const topics = officialTopics();
    expect(topics).toHaveLength(35);
    for (const topic of topics) {
      expect(matrix, `missing ${topic.id}`).toContain(`| ${topic.id} |`);
      expect(matrix, `missing source label for ${topic.id}`).toContain(topic.sourceLabel ?? "");
    }
  });

  it("does not invent examination weightage or previous-year banks", () => {
    const blob = [read(MATRIX), read(BLUEPRINT), read(ADAPTIVE)].join("\n");
    expect(blob).not.toMatch(/weightage \d+%/i);
    expect(blob).not.toMatch(/previous-year question bank/i);
    expect(blob).toMatch(/Do not invent examination weightage/i);
  });

  it("keeps placement distinct from mastery", () => {
    const text = `${read(BLUEPRINT)}\n${read(PROGRESS)}\n${read(ADAPTIVE)}`;
    expect(text).toMatch(/Placement is not mastery/i);
    expect(text).toMatch(/NEEDS_FOUNDATION/);
    expect(text).toMatch(/DEMONSTRATED/);
    expect(text).toMatch(/started/);
    expect(text).toMatch(/mastered/);
  });

  it("traces brief sections 1–19 and the twenty acceptance criteria", () => {
    const trace = read("docs/M2C_SECTION_TRACE.md");
    for (let n = 1; n <= 19; n += 1) {
      expect(trace).toContain(`## ${n}.`);
    }
    expect(trace).toContain("| 20 |");
    expect(read("docs/VISUAL_SIMULATOR_CATALOG.md")).toContain("**2E priority.**");
    expect(read("docs/FACULTY_ANALYTICS.md")).toContain("A public leaderboard");
  });

  it("records laboratory topics as pending unknown source", () => {
    const matrix = read(MATRIX);
    for (const id of ["u1-t8", "u2-t7", "u3-t6", "u4-t6", "u5-t8"]) {
      const row = matrix.split("\n").find((line) => line.includes(`| ${id} |`));
      expect(row, id).toBeTruthy();
      expect(row).toMatch(/\| U \|/);
    }
  });
});
