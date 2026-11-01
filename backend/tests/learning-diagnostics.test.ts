import { beforeEach, describe, expect, it } from "vitest";
import { familiesForTopic, loadDiagnosticBank, methodFamily, publicItem, selectDiagnosticItems } from "@/lib/learning/bank";
import {
  getDiagnosticPublic,
  listDiagnostics,
  startDiagnostic,
  submitDiagnostic,
} from "@/lib/learning/diagnostics";
import { resetLearningStore, getPlacement } from "@/lib/learning/store";
import { topicState } from "@/lib/curriculum/progress";
import { PLACEMENT_RULES_VERSION } from "@/lib/learning/types";

beforeEach(() => {
  resetLearningStore();
});

describe("diagnostic bank", () => {
  it("loads only existing Unit 1 lesson items and hides keys in the public DTO", () => {
    const bank = loadDiagnosticBank();
    expect(bank.length).toBeGreaterThan(10);
    expect(bank.every((i) => i.topicId.startsWith("u1-"))).toBe(true);
    const pub = publicItem(bank[0]);
    expect(JSON.stringify(pub)).not.toContain(String(bank[0].answer));
    expect(pub).not.toHaveProperty("answer");
  });

  it("selects two different methods per topic when the lesson has them", () => {
    const items = selectDiagnosticItems();
    const byTopic = new Map<string, Set<string>>();
    for (const item of items) {
      const set = byTopic.get(item.topicId) ?? new Set();
      set.add(item.method);
      byTopic.set(item.topicId, set);
    }
    expect(byTopic.get("u1-t2")?.size).toBeGreaterThanOrEqual(2);
    expect(familiesForTopic("u1-t2").size).toBeGreaterThanOrEqual(2);
    const pair = selectDiagnosticItems().filter((i) => i.topicId === "u1-t6");
    expect(new Set(pair.map((i) => methodFamily(i.method))).size).toBeGreaterThanOrEqual(2);
  });
});

describe("diagnostic sessions", () => {
  it("creates a session, rejects unknown items, and blocks duplicate answers", async () => {
    const started = await startDiagnostic("s-a");
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const sessionId = started.session.id;
    expect(JSON.stringify(started.session)).not.toMatch(/"answer"/);

    const bad = await submitDiagnostic("s-a", sessionId, [{ itemId: "not-real", value: 0 }]);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("unknown_item");

    const item = started.session.items[0];
    const bankItem = loadDiagnosticBank().find((i) => i.id === item.id)!;
    const first = await submitDiagnostic("s-a", sessionId, [{ itemId: item.id, value: bankItem.answer }]);
    expect(first.ok).toBe(true);

    const again = await submitDiagnostic("s-a", sessionId, [{ itemId: item.id, value: bankItem.answer }]);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error).toBe("already_submitted");
  });

  it("hides another student's session as not_found", async () => {
    const started = await startDiagnostic("s-owner");
    if (!started.ok) return;
    const peek = getDiagnosticPublic("s-intruder", started.session.id);
    expect(peek.ok).toBe(false);
    if (!peek.ok) expect(peek.status).toBe(404);
  });

  it("computes DEMONSTRATED only after two methods and keeps mastery separate", async () => {
    const started = await startDiagnostic("s-place");
    if (!started.ok) return;
    const topicItems = started.session.items.filter((i) => i.topicId === "u1-t6");
    expect(topicItems.length).toBeGreaterThanOrEqual(2);
    const answers = topicItems.map((item) => ({
      itemId: item.id,
      value: loadDiagnosticBank().find((b) => b.id === item.id)!.answer,
    }));
    const result = await submitDiagnostic("s-place", started.session.id, answers);
    expect(result.ok).toBe(true);
    expect(getPlacement("s-place", "u1-t6")).toBe("DEMONSTRATED");
    expect(topicState("s-place", "u1-t6")).not.toBe("mastered");
  });

  it("preserves history on retake and keeps the rubric version", async () => {
    const first = await startDiagnostic("s-retake");
    if (!first.ok) return;
    const item = first.session.items[0];
    const bankItem = loadDiagnosticBank().find((i) => i.id === item.id)!;
    await submitDiagnostic("s-retake", first.session.id, [{ itemId: item.id, value: bankItem.answer }]);
    const second = await startDiagnostic("s-retake");
    expect(second.ok).toBe(true);
    const history = listDiagnostics("s-retake");
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(first.session.id);
    expect(history[0].status).toBe("submitted");
    expect(history[1].status).toBe("open");
    expect(first.session.rubricVersion).toBe(PLACEMENT_RULES_VERSION);
  });

  it("does not treat an outdated rubric version as the live rule", () => {
    expect(PLACEMENT_RULES_VERSION).toBe("2d1-placement-v1");
    expect(PLACEMENT_RULES_VERSION).not.toBe("legacy-unspecified");
  });
});
