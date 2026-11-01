import { dashboardPayload } from "@/lib/learning/recommend";
import { hydrateStudent } from "@/lib/learning/persist";
import { seedRoster } from "@/lib/roster/store";

/**
 * Server adapter for the student dashboard slice of the Emergent CForgeServices
 * contract (student.me, progress.forStudent, curriculum.units for the home
 * screen). It calls the existing dashboardPayload path. It does not import
 * emergent-source, demo fixtures, or sessionStorage.
 *
 * Not implemented here, on purpose: invitations, lessons, flashcards,
 * assessments.previewScore, visualiser content, exercises, judge, faculty.
 * Those stay on their existing server modules until their pages are ported.
 */
export const DASHBOARD_FIELD_GAPS = [
  "StudentProfile.cohort is not stored. The dashboard shows the official roll, not a cohort name.",
  "StudentProfile.name is the faculty-recorded display name when one exists, otherwise absent. The greeting falls back to the roll. No name is invented.",
  "Emergent mastery states (not-started, opened, demonstrated, mastered, needs-practice) are not the production topic states. Counts stay on the existing analytics: opened, practised, demonstrated placement, and mastered.",
  "AssessmentService.previewScore is not implemented. Scores come from stored server-scored attempts only.",
  "JudgeService is not part of this adapter. Run and Submit stay on the existing execute route.",
] as const;

export async function loadLearnDashboard(session: { studentId: string; rollIdentifier: string }) {
  seedRoster();
  await hydrateStudent(session.studentId);
  const dash = dashboardPayload(session.studentId, session.rollIdentifier);
  return {
    studentId: session.studentId,
    rollIdentifier: dash.rollIdentifier,
    displayName: dash.displayName,
    greeting: dash.greeting,
    note: dash.note,
    startIntent: dash.startIntent,
    continueLearning: dash.continueLearning,
    recommendedNext: dash.recommendedNext,
    path: dash.path,
    weakConcepts: dash.weakConcepts,
    pendingAssessments: dash.pendingAssessments,
    scoresAreSeparate: dash.scoresAreSeparate,
    analytics: dash.analytics,
    gaps: DASHBOARD_FIELD_GAPS,
  };
}

export type LearnDashboard = Awaited<ReturnType<typeof loadLearnDashboard>>;
