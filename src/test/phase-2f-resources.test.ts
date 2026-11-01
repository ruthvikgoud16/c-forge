import { describe, expect, it } from "vitest";
import {
  hrefIfHttp,
  labIngestPayload,
  mapLab,
  mapLabCollection,
  mapPaper,
  mapPaperCollection,
  MEMORY_NOTE,
  paperIngestPayload,
} from "@/lib/resources";
import { demoServices } from "@/services/demo-adapter";
import { IS_DEMO } from "@/services";

describe("lab and paper mapping", () => {
  it("maps a genuine lab and does not invent a source link", () => {
    const lab = mapLab({
      id: "lab-1",
      unitId: "unit-1",
      title: "I/O worksheet",
      objective: "Read scanf",
      verified: true,
      sourceRef: "Faculty note 3",
      uploadedAt: "t",
    });
    expect(lab?.title).toBe("I/O worksheet");
    expect(lab?.sourceHref).toBeNull();
    expect(hrefIfHttp("https://example.test/lab")).toBe("https://example.test/lab");
  });

  it("maps papers without claiming an official bank", () => {
    const paper = mapPaper({
      id: "p1",
      academicYear: "2025-26",
      semester: "",
      examType: "",
      sourceRef: "Internal extract",
      verified: true,
      uploadedAt: "t",
      questions: [{ id: "q1", text: "Trace this loop", kind: "faculty_extracted" }],
    });
    expect(paper?.questions).toHaveLength(1);
    expect(paper?.questions[0]?.kind).toBe("faculty_extracted");
  });

  it("treats empty collections as empty, not fabricated resources", () => {
    const labs = mapLabCollection({ labs: [], fabricated: false }, "original");
    const papers = mapPaperCollection({ papers: [], fabricated: false }, "original");
    expect(labs.labs).toEqual([]);
    expect(papers.papers).toEqual([]);
    expect(labs.fabricated).toBe(false);
    expect(labs.persistence).toBe("process-memory");
    expect(MEMORY_NOTE).toMatch(/process memory/i);
  });

  it("drops incomplete records instead of inventing titles", () => {
    expect(mapLab({ id: "", title: "" })).toBeNull();
    expect(mapPaper({ id: "x" })).toBeNull();
  });
});

describe("faculty ingest payloads", () => {
  it("accepts the official lab JSON shape", () => {
    const payload = labIngestPayload({ unitId: "unit-1", title: "Lab A", sourceRef: "note", objective: "Read input" });
    expect(payload.ok).toBe(true);
    if (payload.ok) expect(payload.body).toEqual({ unitId: "unit-1", title: "Lab A", sourceRef: "note", objective: "Read input" });
  });

  it("rejects invalid lab and paper payloads", () => {
    expect(labIngestPayload({ unitId: "", title: "A", sourceRef: "s" }).ok).toBe(false);
    expect(paperIngestPayload({ academicYear: "2025", sourceRef: "s", questions: [{ text: "" }] }).ok).toBe(false);
  });

  it("accepts the official paper JSON shape", () => {
    const payload = paperIngestPayload({
      academicYear: "2025-26",
      sourceRef: "Extract",
      questions: [{ text: "What is scanf?", topicId: "u1-t4", marks: "2" }],
    });
    expect(payload.ok).toBe(true);
    if (payload.ok) {
      expect(payload.body.questions[0]).toMatchObject({ text: "What is scanf?", topicId: "u1-t4", marks: 2 });
    }
  });
});

describe("demo versus production resources", () => {
  it("keeps demo ingest in the demo session and labels it", async () => {
    const before = await demoServices.resources.labs();
    expect(before.source).toBe("demo");
    expect(before.persistence).toBe("demo-session");
    const stored = await demoServices.facultyResources.addLab({ unitId: "unit-1", title: "Demo only", sourceRef: "session" });
    expect(stored.demo).toBe(true);
    const after = await demoServices.resources.labs();
    expect(after.labs.some((lab) => lab.title === "Demo only")).toBe(true);
    expect(IS_DEMO === true ? after.source : "original").toBe(IS_DEMO ? "demo" : "original");
  });

  it("does not treat student discovery as faculty authorization", async () => {
    const student = await demoServices.resources.papers();
    const faculty = await demoServices.facultyResources.papers();
    expect(student.source).toBe("demo");
    expect(faculty.source).toBe("demo");
    await expect(demoServices.facultyResources.addPaper({ academicYear: "", sourceRef: "", questions: [] })).rejects.toThrow(/required/i);
  });
});
