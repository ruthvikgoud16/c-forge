// DEMONSTRATION FIXTURE — fictional students only. No real cohort data.
import type { Invitation, RosterEntry, StudentProfile, StudentProgress, MasteryState } from "@/domain/types";
import { topics } from "./curriculum";

const first = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Isha", "Vihaan", "Anaya", "Arjun", "Sara", "Dev", "Tara", "Nikhil", "Priya", "Yash", "Kavya", "Aditya", "Riya", "Om", "Neha"];
const last = ["Rao", "Iyer", "Shah", "Nair", "Menon", "Reddy", "Kapoor", "Das", "Pillai", "Verma", "Joshi"];

// Deterministic pseudo-random so the demo is stable across reloads.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export const ROSTER_CAPACITY = 55;

export const roster: RosterEntry[] = Array.from({ length: ROSTER_CAPACITY }, (_, i) => {
  const roll = `DEMO-${String(i + 1).padStart(3, "0")}`;
  const status: RosterEntry["status"] = i < 34 ? "active" : i < 46 ? "invited" : "not-invited";
  let invitation: Invitation | undefined;
  if (status !== "not-invited") {
    const invStatus: Invitation["status"] = status === "active" ? "accepted" : i % 5 === 0 ? "expired" : i % 7 === 0 ? "revoked" : "pending";
    invitation = { id: `inv-${i + 1}`, rollNumber: roll, status: invStatus, createdAt: "2026-09-01", expiresAt: invStatus === "expired" ? "2026-09-15" : "2026-11-30" };
  }
  const finalStatus: RosterEntry["status"] = invitation?.status === "revoked" ? "not-invited" : status;
  return { id: `stu-${i + 1}`, rollNumber: roll, name: `${first[i % first.length]} ${last[(i * 3) % last.length]}`, status: finalStatus, invitation };
});

export const demoStudent: StudentProfile = { id: "stu-1", rollNumber: "DEMO-001", name: "Aarav Rao", cohort: "Demo Cohort — C Programming" };

export function progressFor(studentId: string): StudentProgress {
  const n = Number(studentId.replace(/\D/g, "")) || 1;
  const r = rng(n * 17);
  const entry = roster.find((s) => s.id === studentId);
  const active = entry?.status === "active";
  const reach = active ? Math.floor(6 + r() * 18) : 0;
  const states: MasteryState[] = ["opened", "demonstrated", "mastered", "needs-practice"];
  return {
    studentId,
    topics: topics.map((t, i) => {
      if (i >= reach) return { topicId: t.id, state: "not-started" as const };
      const state = states[Math.floor(r() * states.length)] ?? "opened";
      return { topicId: t.id, state, lastOpened: `2026-10-${String(1 + ((i * 3) % 28)).padStart(2, "0")}` };
    }),
    attempts: active
      ? topics.slice(0, Math.max(2, Math.floor(reach / 3))).map((t, i) => ({ assessmentId: `ta-${t.id}`, title: `${t.title} — topic assessment`, date: `2026-10-${String(2 + i * 2).padStart(2, "0")}`, correct: Math.floor(2 + r() * 4), total: 6 }))
      : [],
    recent: active
      ? topics.slice(Math.max(0, reach - 4), reach).reverse().map((t, i) => ({ topicId: t.id, resource: ["Lesson", "Flashcards", "Notes", "Mind map"][i % 4], date: `2026-10-${String(28 - i).padStart(2, "0")}` }))
      : [],
  };
}
