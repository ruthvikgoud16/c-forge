import { json } from "@/lib/academy/http";
import { readStudentProfile } from "@/lib/academy/profile";
import { requireStudent } from "@/lib/learning/authz";
import { ensureVerifiedRosterNames } from "@/lib/roster/import";
import { displayLabel } from "@/lib/roster/rolls";
import { getRosterRow, seedRoster } from "@/lib/roster/store";

export async function GET() {
  const session = await requireStudent();
  if (!session) return json(401, { error: "unauthorized" });
  seedRoster();
  ensureVerifiedRosterNames();
  const row = getRosterRow(session.rollIdentifier);
  const profile = await readStudentProfile(session.studentId);
  const displayName = row?.displayName ?? null;
  return json(200, {
    studentId: session.studentId,
    rollIdentifier: session.rollIdentifier,
    displayName,
    greeting: `Welcome, ${displayLabel(session.rollIdentifier, displayName)}`,
    dateOfBirth: profile.dateOfBirth,
    appearance: profile.appearance,
    profileComplete: Boolean(displayName && profile.dateOfBirth),
    rosterNameIsOfficial: true,
    rosterPresenceDoesNotActivate: true,
  });
}
