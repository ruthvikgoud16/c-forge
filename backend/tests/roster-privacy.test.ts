import { beforeEach, describe, expect, it } from "vitest";
import { recommendNext } from "@/lib/learning/recommend";
import { resetLearningStore, setPlacement } from "@/lib/learning/store";
import { stripClientStudentId } from "@/lib/learning/authz";
import { listRosterAdmin, resetRoster } from "@/lib/roster/store";

beforeEach(() => {
  resetLearningStore();
  resetRoster();
});

describe("roster and recommendation privacy", () => {
  it("does not let student A inherit student B's placement recommendation", () => {
    setPlacement("student-a", "u1-t6", "NEEDS_REVISION");
    setPlacement("student-b", "u1-t1", "DEMONSTRATED");
    expect(recommendNext("student-a").topicId).toBe("u1-t6");
    expect(recommendNext("student-b").topicId).not.toBe("u1-t6");
  });

  it("does not expose the full roster on a student-shaped payload", () => {
    const admin = listRosterAdmin();
    expect(admin).toHaveLength(55);
    const cleaned = stripClientStudentId({ studentId: "attacker", startIntent: "from_scratch" });
    expect(cleaned.studentId).toBeUndefined();
  });
});
