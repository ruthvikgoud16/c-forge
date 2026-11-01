import { describe, expect, it } from "vitest";
import { destFromAcademyHref } from "@/lib/adaptive";
import {
  demoFoundationLibrary,
  findFoundationTopic,
  mapFoundationLibrary,
  mapFoundationTopic,
} from "@/lib/foundation";
import { demoServices } from "@/services/demo-adapter";
import { IS_DEMO } from "@/services";

const catalogTopic = {
  id: "f-basic-computer",
  sourceLabels: ["Basic computer knowledge."],
  title: "Basic computer knowledge",
  classification: "SUPPORTING",
};

describe("foundation catalog mapping", () => {
  it("keeps the 17 readable labels and the missing count without inventing titles", () => {
    const library = mapFoundationLibrary({
      id: "foundation",
      title: "Foundation & Remediation Library",
      sourceLabel: "UNIT 999: Custom Unit",
      sourceNote: "Screenshots showed 37 entries. Only the 17 labels below were readable. The remaining 20 are not invented.",
      notAnOfficialUnit: true,
      missingEntryCount: 20,
      topics: [catalogTopic, { id: "f-overview-pic", title: "Overview of PIC", classification: "LEGACY_UNVERIFIED", needsHumanVerification: true, accuracyNotes: ["PIC is unclear in this C-academy context. Do not invent a meaning."] }],
    }, "original");
    expect(library.notAnOfficialUnit).toBe(true);
    expect(library.missingEntryCount).toBe(20);
    expect(library.topics).toHaveLength(2);
    expect(library.topics.map((topic) => topic.title)).not.toContain("Invented lesson");
    expect(library.topics.every((topic) => topic.hasLessonBody === false)).toBe(true);
  });

  it("does not treat a label as a lesson body", () => {
    const topic = mapFoundationTopic(catalogTopic);
    expect(topic.hasLessonBody).toBe(false);
    expect(topic.lessonId).toBeNull();
  });

  it("only marks a lesson when the catalog supplies a lessonId", () => {
    expect(mapFoundationTopic({ ...catalogTopic, lessonId: "f-basic-computer-notes" }).hasLessonBody).toBe(true);
  });

  it("returns null for unknown identifiers", () => {
    const library = mapFoundationLibrary({ topics: [catalogTopic] }, "original");
    expect(findFoundationTopic(library, "f-does-not-exist")).toBeNull();
    expect(findFoundationTopic(library, "")).toBeNull();
  });

  it("does not fabricate descriptions for empty or unavailable libraries", () => {
    const empty = mapFoundationLibrary({ title: "Foundation", topics: [], missingEntryCount: 20 }, "original");
    expect(empty.topics).toEqual([]);
    expect(empty.missingEntryCount).toBe(20);
    const demo = demoFoundationLibrary();
    expect(demo.available).toBe(false);
    expect(demo.topics).toEqual([]);
    expect(demo.sourceNote).toMatch(/not load the original foundation catalog/i);
  });
});

describe("foundation destinations and demo separation", () => {
  it("routes official foundation hrefs to the Emergent library", () => {
    expect(destFromAcademyHref("/learn/foundation")).toEqual({ to: "/learn/foundation" });
    expect(destFromAcademyHref("/learn/foundation/f-binary")).toEqual({
      to: "/learn/foundation/$topicId",
      params: { topicId: "f-binary" },
    });
  });

  it("keeps demo foundation empty and labelled", async () => {
    const library = await demoServices.foundation.library();
    expect(library.source).toBe("demo");
    expect(library.topics).toEqual([]);
    expect(await demoServices.foundation.topic("f-basic-computer")).toBeNull();
    expect(IS_DEMO === true ? library.source : "original").toBe(IS_DEMO ? "demo" : "original");
  });
});
