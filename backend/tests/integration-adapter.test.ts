import { describe, expect, it } from "vitest";
import { DASHBOARD_FIELD_GAPS } from "@/lib/integration/student-dashboard";
import { dashboardPayload } from "@/lib/learning/recommend";
import { seedRoster } from "@/lib/roster/store";

describe("student dashboard adapter", () => {
  it("builds the greeting from the roll when no faculty name is stored", () => {
    seedRoster();
    const dash = dashboardPayload("adapter-test-student", "26EG104G55");
    expect(dash.greeting).toBe("Welcome, 26EG104G55");
    expect(dash.displayName).toBeNull();
    expect(dash.analytics.unitProgress).toHaveLength(5);
    expect(dash.analytics.assessmentHistory).toEqual([]);
    expect(JSON.stringify(dash)).not.toMatch(/DEMO-|Fictional student|demo progress/i);
  });

  it("records fields the Emergent contract asks for that CForge does not store", () => {
    expect(DASHBOARD_FIELD_GAPS.join(" ")).toMatch(/cohort/);
    expect(DASHBOARD_FIELD_GAPS.join(" ")).toMatch(/previewScore/);
    expect(DASHBOARD_FIELD_GAPS.join(" ")).toMatch(/JudgeService/);
  });
});
