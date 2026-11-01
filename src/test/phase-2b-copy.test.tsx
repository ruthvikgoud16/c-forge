import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SourceNotice } from "@/components/common/bits";
import { unitAxisLabel } from "@/components/art/FacultyCharts";
import type { Unit } from "@/domain/types";

describe("SourceNotice", () => {
  it("keeps demonstration copy for demo material", () => {
    const html = renderToStaticMarkup(createElement(SourceNotice, { what: "This lesson", source: "demo" }));
    expect(html).toContain("Demonstration material");
    expect(html).toContain("pending integration of the original teaching package");
  });

  it("names official CForge content when source is original", () => {
    const html = renderToStaticMarkup(createElement(SourceNotice, { what: "This lesson", source: "original" }));
    expect(html).toContain("Official material");
    expect(html).toContain("This lesson comes from the official CForge teaching package.");
    expect(html).not.toContain("Demonstration material");
  });
});

describe("Faculty unit labels", () => {
  const units: Unit[] = [
    {
      id: "unit-1",
      number: 1,
      title: "Introduction, C Preliminaries and Operators",
      shortTitle: "Introduction, C Preliminaries and Operators",
      summary: "",
    },
  ];

  it("uses the official catalog unit number", () => {
    expect(unitAxisLabel("unit-1", units)).toBe("U1");
  });

  it("does not invent a title when the catalog has no match", () => {
    expect(unitAxisLabel("unit-1", [])).toBe("unit-1");
  });
});
