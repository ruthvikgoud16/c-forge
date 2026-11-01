import { beforeEach, describe, expect, it } from "vitest";
import { startDiagnostic, submitDiagnostic, listDiagnostics } from "@/lib/learning/diagnostics";
import { loadDiagnosticBank } from "@/lib/learning/bank";
import { eventsForStudent, getPlacement, resetLearningStore, setPreference } from "@/lib/learning/store";
import { getPreference } from "@/lib/learning/store";
import { stripClientStudentId } from "@/lib/learning/authz";

beforeEach(() => {
  resetLearningStore();
});

describe("student record isolation", () => {
  it("never copies one student's diagnostic onto another", async () => {
    const a = await startDiagnostic("student-a");
    const b = await startDiagnostic("student-b");
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const item = a.session.items[0];
    const bankItem = loadDiagnosticBank().find((i) => i.id === item.id)!;
    await submitDiagnostic("student-a", a.session.id, [{ itemId: item.id, value: bankItem.answer }]);
    expect(listDiagnostics("student-b").some((s) => s.status === "submitted")).toBe(false);
    expect(eventsForStudent("student-b")).toHaveLength(0);
    expect(getPlacement("student-b", item.topicId)).toBe("NOT_ASSESSED");
  });

  it("strips client-supplied student ids before persistence", () => {
    const cleaned = stripClientStudentId({
      startIntent: "from_scratch",
      studentId: "attacker",
      student_id: "attacker",
    });
    expect(cleaned.studentId).toBeUndefined();
    expect(cleaned.student_id).toBeUndefined();
    expect(cleaned.startIntent).toBe("from_scratch");
  });

  it("stores a preference, not a global skill label", () => {
    setPreference("s-pref", "test_knowledge");
    expect(getPreference("s-pref")).toBe("test_knowledge");
    expect(JSON.stringify(getPreference("s-pref"))).not.toMatch(/beginner|intermediate|advanced/i);
  });
});
