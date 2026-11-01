// DEMO ADAPTER — in-memory, deterministic. No network, no real auth, no code execution.
import type { CForgeServices } from "./contracts";
import type { Invitation, RosterEntry, Session, StartIntent, UnitId } from "@/domain/types";
import { mapDashboard } from "@/lib/adaptive";
import { demoFoundationLibrary, findFoundationTopic } from "@/lib/foundation";
import {
  hrefIfHttp,
  labIngestPayload,
  mapLabCollection,
  mapPaperCollection,
  paperIngestPayload,
  type LabResource,
  type PaperResource,
} from "@/lib/resources";
import { topics, units } from "@/data/fixtures/curriculum";
import { topicAssessmentId, unitAssessmentId } from "@/lib/assessment";
import { mergeTeachingPackage } from "@/lib/teaching";
import { exercises } from "@/data/fixtures/exercises";
import { demoStudent, progressFor, roster as rosterFixture, ROSTER_CAPACITY } from "@/data/fixtures/people";
import { buildFlashcards, buildLesson, buildNotes, buildOneShot, buildQuestions, buildTopicMindMap, buildUnitMindMap, type BuiltAssessment } from "@/data/generators";
import { TOOL_IDS, TOOL_META } from "@/data/tools";

const roster: RosterEntry[] = rosterFixture.map((r) => ({ ...r }));
const SESSION_KEY = "cforge.demo.session";
const delay = <T,>(v: T) => Promise.resolve(v);
const demoLabs: LabResource[] = [];
const demoPapers: PaperResource[] = [];

const assessments: BuiltAssessment[] = [
  ...topics.map((t) => {
    const { questions, key } = buildQuestions([t], topics, 4);
    return { id: topicAssessmentId(t.id), kind: "topic" as const, title: `${t.title}`, scopeId: t.id, questionCount: questions.length, questions, key, source: "demo" as const };
  }),
  ...units.map((u) => {
    const scope = topics.filter((t) => t.unitId === u.id);
    const { questions, key } = buildQuestions(scope, topics, 10);
    return { id: unitAssessmentId(u.id), kind: "unit" as const, title: `Unit ${u.number}: ${u.title}`, scopeId: u.id, questionCount: questions.length, questions, key, source: "demo" as const };
  }),
];

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export const demoServices: CForgeServices = {
  auth: {
    async signIn({ rollNumber, password, role }) {
      const roll = rollNumber.trim().toUpperCase();
      if (role === "faculty") {
        if (!/^FAC-DEMO$/.test(roll) || password.length < 8) return { ok: false, error: "Faculty ID or password is incorrect. In demo mode use FAC-DEMO with any 8+ character password." };
        const s: Session = { role: "faculty", displayName: "Demo Faculty", isDemo: true };
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
        return { ok: true, session: s };
      }
      const entry = roster.find((r) => r.rollNumber === roll);
      if (!entry || entry.status !== "active" || password.length < 8) return { ok: false, error: "Roll number or password is incorrect." };
      const s: Session = { role: "student", displayName: entry.name, rollNumber: entry.rollNumber, isDemo: true };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      return { ok: true, session: s };
    },
    async signOut() {
      window.sessionStorage.removeItem(SESSION_KEY);
    },
    currentSession: readSession,
  },
  invitations: {
    async lookup(token) {
      const roll = token.replace(/^demo-/i, "").toUpperCase();
      const inv = roster.find((r) => r.rollNumber === roll)?.invitation;
      return inv ? { invitation: inv } : { error: "not-found" };
    },
    async accept(token, password) {
      const roll = token.replace(/^demo-/i, "").toUpperCase();
      const r = roster.find((x) => x.rollNumber === roll);
      if (!r?.invitation) return { ok: false, error: "Invitation not found." };
      if (r.invitation.status !== "pending") return { ok: false, error: `This invitation is ${r.invitation.status}.` };
      if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
      r.invitation = { ...r.invitation, status: "accepted" };
      r.status = "active";
      return { ok: true };
    },
    async list() {
      return roster.flatMap((r) => (r.invitation ? [r.invitation] : []));
    },
    async create(rollNumber) {
      const r = roster.find((x) => x.rollNumber === rollNumber);
      if (!r) throw new Error("Roll number not on roster");
      const inv: Invitation = { id: `inv-new-${rollNumber}`, rollNumber, status: "pending", createdAt: "2026-10-31", expiresAt: "2026-11-14" };
      r.invitation = inv;
      if (r.status === "not-invited") r.status = "invited";
      return inv;
    },
    async revoke(id) {
      const r = roster.find((x) => x.invitation?.id === id);
      if (!r?.invitation) throw new Error("Invitation not found");
      r.invitation = { ...r.invitation, status: "revoked" };
      if (r.status === "invited") r.status = "not-invited";
      return r.invitation;
    },
  },
  curriculum: {
    units: async () => units,
    unit: async (id) => units.find((u) => u.id === id) ?? null,
    topics: async (unitId) => (unitId ? topics.filter((t) => t.unitId === unitId) : topics),
    topic: async (id) => topics.find((t) => t.id === id) ?? null,
    async neighbours(id) {
      const i = topics.findIndex((t) => t.id === id);
      return { prev: topics[i - 1] ?? null, next: topics[i + 1] ?? null };
    },
    async unitMindMap(id) {
      const u = units.find((x) => x.id === id);
      return u ? buildUnitMindMap(u, topics.filter((t) => t.unitId === u.id)) : null;
    },
    async topicMindMap(id) {
      const t = topics.find((x) => x.id === id);
      return t ? buildTopicMindMap(t) : null;
    },
    async official() {
      return {
        officialUnitCount: units.length,
        officialTopicCount: topics.filter((topic) => topic.unitId !== "supplementary").length,
        units: units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          sourceLabel: unit.title,
          topicCount: topics.filter((topic) => topic.unitId === unit.id).length,
        })),
        foundationIsOfficialUnit: false as const,
      };
    },
    async teachingTopicIds() {
      return topics.map((topic) => topic.id);
    },
  },
  lessons: {
    lesson: async (id) => { const t = topics.find((x) => x.id === id); return t ? buildLesson(t) : null; },
    notes: async (id) => { const t = topics.find((x) => x.id === id); return t ? buildNotes(t) : null; },
    oneShot: async (id) => { const t = topics.find((x) => x.id === id); return t ? buildOneShot(t) : null; },
  },
  teaching: {
    async forTopic(topicId) {
      const topic = topics.find((row) => row.id === topicId);
      if (!topic) return null;
      return mergeTeachingPackage({
        topicId,
        source: "demo",
        graphConcepts: topic.concepts,
        alwaysPresent: ["notes", "oneshot", "mind-map", "flashcards"],
        publicLesson: {
          lessonId: null,
          topicId,
          title: topic.title,
          openedIsNotMastery: true,
          placement: null,
          mastery: null,
          quickNotes: [],
          examples: topic.example.code
            ? [{ title: "Worked example", problem: topic.example.explanation, steps: [topic.example.explanation], code: topic.example.code, output: topic.example.output }]
            : [],
          syntax: topic.syntax ?? null,
          syntaxRows: topic.concepts.map((concept) => ({ token: concept.term, meaning: concept.definition })),
          trace: null,
          predict: null,
          guided: null,
          independent: null,
          checks: [],
          exerciseId: topic.exerciseIds[0] ?? null,
          answerKeysIncluded: false,
        },
      });
    },
    async check() {
      return { ok: false, error: "demo_unscored" };
    },
  },
  flashcards: {
    deck: async (id) => { const t = topics.find((x) => x.id === id); return t ? buildFlashcards(t) : []; },
    totalCount: async () => topics.reduce((n, t) => n + buildFlashcards(t).length, 0),
  },
  assessments: {
    list: async () => assessments.map(({ questions: _q, key: _k, ...a }) => a),
    async get(id) {
      const a = assessments.find((x) => x.id === id || x.id === id.replace(/^ta-/, "topic:").replace(/^ua-/, "unit:"));
      if (!a) return null;
      const { key: _k, ...rest } = a; // never hand the key to the page
      return rest;
    },
    async previewScore(id, answers) {
      const a = assessments.find((x) => x.id === id)!;
      const perQuestion = a.questions.map((q) => ({ questionId: q.id, correct: answers[q.id] === a.key[q.id], correctOptionId: a.key[q.id] }));
      return { assessmentId: id, correct: perQuestion.filter((p) => p.correct).length, total: a.questions.length, perQuestion, isPreview: true };
    },
  },
  student: {
    me: async () => demoStudent,
    async updateProfile(input) {
      if (input.dateOfBirth !== undefined) demoStudent.dateOfBirth = input.dateOfBirth;
      if (input.appearance !== undefined) demoStudent.appearance = input.appearance;
      demoStudent.profileComplete = Boolean(demoStudent.name && demoStudent.dateOfBirth);
      return demoStudent;
    },
  },
  progress: {
    forStudent: async (id) => progressFor(id),
    history: async (id) => progressFor(id).attempts,
    async recordTeachingEvent() {
      return;
    },
  },
  visualizers: { list: async () => TOOL_IDS.map((id) => ({ id, ...TOOL_META[id] })) },
  exercises: {
    list: async () => exercises,
    get: async (id) => exercises.find((e) => e.id === id) ?? null,
  },
  judge: {
    async run() {
      return { mode: "run" as const, verdict: "unavailable" as const, compilerOutput: "The C judge is not connected in demo mode. No program was compiled or executed.", stdout: "", isSimulated: true };
    },
    async submit() {
      return { mode: "submit" as const, verdict: "unavailable" as const, compilerOutput: "The C judge is not connected in demo mode. No program was compiled or executed.", stdout: "", isSimulated: true };
    },
  },
  faculty: {
    async summary() {
      const active = roster.filter((r) => r.status === "active");
      const progresses = active.map((r) => progressFor(r.id));
      const unitProgress = units.map((u) => {
        const ids = topics.filter((t) => t.unitId === u.id).map((t) => t.id);
        const count = (state: string) => progresses.filter((p) => p.topics.some((tp) => ids.includes(tp.topicId) && tp.state === state)).length;
        return { unitId: u.id as UnitId, demonstrated: count("demonstrated"), mastered: count("mastered"), needsPractice: count("needs-practice") };
      });
      const pct = progresses.flatMap((p) => p.attempts.map((a) => a.correct / a.total));
      const bucket = (lo: number, hi: number) => { const n = pct.filter((x) => x >= lo && x < hi).length; return n < 3 ? null : n; };
      const revisit = topics.map((t) => ({ topicId: t.id, students: progresses.filter((p) => p.topics.find((x) => x.topicId === t.id)?.state === "needs-practice").length })).filter((x) => x.students >= 3).sort((a, b) => b.students - a.students).slice(0, 6);
      return {
        capacity: ROSTER_CAPACITY,
        rosterCount: roster.length,
        active: active.length,
        invited: roster.filter((r) => r.status === "invited").length,
        notInvited: roster.filter((r) => r.status === "not-invited").length,
        unitProgress,
        assessmentBuckets: [
          { label: "Below 40%", count: bucket(0, 0.4) },
          { label: "40–69%", count: bucket(0.4, 0.7) },
          { label: "70–89%", count: bucket(0.7, 0.9) },
          { label: "90%+", count: bucket(0.9, 1.01) },
        ],
        revisitTopics: revisit,
        engagement: [
          { label: "Students with activity this month", value: progresses.filter((p) => p.recent.length > 0).length },
          { label: "Preview assessment attempts recorded", value: progresses.reduce((n, p) => n + p.attempts.length, 0) },
        ],
      };
    },
    roster: async () => roster.map((r) => ({ ...r })),
    student: async (id) => roster.find((r) => r.id === id) ?? null,
    async importCsv(csv) {
      const errors: string[] = [];
      let added = 0, skipped = 0;
      csv.split(/\r?\n/).filter(Boolean).forEach((line, i) => {
        const [roll, name] = line.split(",").map((s) => s?.trim());
        if (i === 0 && /roll/i.test(roll ?? "")) return;
        if (!roll || !name) { errors.push(`Line ${i + 1}: expected "roll_number,name"`); return; }
        if (roster.some((r) => r.rollNumber === roll.toUpperCase())) { skipped++; return; }
        if (roster.length >= ROSTER_CAPACITY) { errors.push(`Line ${i + 1}: roster capacity of ${ROSTER_CAPACITY} reached`); return; }
        roster.push({ id: `stu-x${roster.length + 1}`, rollNumber: roll.toUpperCase(), name, status: "not-invited" });
        added++;
      });
      return { added, skipped, errors };
    },
    async rename(id, name) {
      const r = roster.find((x) => x.id === id);
      if (!r) throw new Error("Student not found");
      r.name = name.trim();
      return { ...r };
    },
  },
  onboarding: {
    async get() {
      if (typeof window === "undefined") return { startIntent: null, notASkillLabel: true as const };
      const raw = window.sessionStorage.getItem("cforge.demo.intent");
      return { startIntent: (raw as StartIntent | null) ?? null, notASkillLabel: true as const };
    },
    async save(startIntent) {
      if (typeof window !== "undefined") window.sessionStorage.setItem("cforge.demo.intent", startIntent);
      return { startIntent, notASkillLabel: true as const };
    },
  },
  diagnostics: {
    async list() {
      return [];
    },
    async start() {
      throw new Error("The Unit 1 diagnostic is not available in demo mode.");
    },
    async get() {
      throw new Error("The Unit 1 diagnostic is not available in demo mode.");
    },
    async submit() {
      throw new Error("The Unit 1 diagnostic is not available in demo mode.");
    },
  },
  placement: {
    async get() {
      return { rubricVersion: "2d1-placement-v1", placementIsNotMastery: true as const, topics: [] };
    },
  },
  adaptive: {
    async dashboard() {
      const first = topics[0] ?? { id: "demo-topic" };
      return mapDashboard({
        greeting: `Welcome, ${demoStudent.name}`,
        rollIdentifier: demoStudent.rollNumber,
        displayName: demoStudent.name,
        startIntent: null,
        continueLearning: null,
        recommendedNext: {
          topicId: first.id,
          resourceType: "DEEP_LESSON",
          reason: "Demo recommendation only. This is not the CForge adaptive engine.",
          href: `/learn/topics/${first.id}`,
          availability: "AVAILABLE",
          unmetPrerequisites: [],
          startIntent: null,
          placement: "NOT_ASSESSED",
          mastery: null,
          readiness: null,
        },
        path: units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          topics: topics.filter((topic) => topic.unitId === unit.id).map((topic) => ({
            id: topic.id,
            sourceLabel: topic.title,
            title: topic.title,
            placement: "NOT_ASSESSED",
            mastery: null,
            readiness: null,
            lesson: "AVAILABLE",
            notes: "AVAILABLE",
            laboratory: "UNAVAILABLE",
            href: `/learn/topics/${topic.id}`,
            accessible: true,
            prerequisites: [],
          })),
        })),
        weakConcepts: [],
        pendingAssessments: [],
        scoresAreSeparate: true,
        note: "Demo dashboard. Placement, mastery, and readiness are not one percentage.",
        analytics: {
          empty: true,
          unitProgress: units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            teachingTopics: topics.filter((topic) => topic.unitId === unit.id).length,
            opened: 0,
            practised: 0,
            demonstrated: 0,
            mastered: 0,
            note: "Opened is not mastered.",
          })),
          recentlyOpened: [],
          recentlyPractised: [],
          assessmentHistory: [],
          needPractice: [],
          mastered: [],
          demonstrated: [],
          unsupported: ["examination readiness", "class rank", "predicted marks", "time-on-task"],
        },
      }, "demo");
    },
    async path() {
      const dash = await demoServices.adaptive.dashboard();
      return { recommendedNext: dash.recommendedNext, units: dash.path, guidanceOnly: true as const, source: "demo" as const };
    },
    async next() {
      const dash = await demoServices.adaptive.dashboard();
      return dash.recommendedNext;
    },
  },
  foundation: {
    async library() {
      return demoFoundationLibrary();
    },
    async topic(id) {
      return findFoundationTopic(demoFoundationLibrary(), id);
    },
  },
  resources: {
    async labs() {
      return mapLabCollection({ labs: demoLabs, fabricated: false }, "demo");
    },
    async papers() {
      return mapPaperCollection({ papers: demoPapers, fabricated: false }, "demo");
    },
  },
  facultyResources: {
    async labs() {
      return mapLabCollection({ labs: demoLabs, fabricated: false }, "demo");
    },
    async addLab(input) {
      const payload = labIngestPayload(input);
      if (!payload.ok) throw new Error(payload.error);
      demoLabs.push({
        id: `demo-lab-${demoLabs.length + 1}`,
        unitId: payload.body.unitId,
        title: payload.body.title,
        objective: payload.body.objective ?? null,
        verified: true,
        sourceRef: payload.body.sourceRef,
        sourceHref: hrefIfHttp(payload.body.sourceRef),
        uploadedAt: new Date().toISOString(),
      });
      return { stored: true as const, inventedOfficialList: false as const, demo: true };
    },
    async papers() {
      return mapPaperCollection({ papers: demoPapers, fabricated: false }, "demo");
    },
    async addPaper(input) {
      const payload = paperIngestPayload(input);
      if (!payload.ok) throw new Error(payload.error);
      demoPapers.push({
        id: `demo-paper-${demoPapers.length + 1}`,
        academicYear: payload.body.academicYear,
        semester: payload.body.semester,
        examType: payload.body.examType,
        sourceRef: payload.body.sourceRef,
        sourceHref: hrefIfHttp(payload.body.sourceRef),
        verified: true,
        uploadedAt: new Date().toISOString(),
        questions: payload.body.questions.map((q, i) => ({
          id: `demo-q-${demoPapers.length}-${i}`,
          text: q.text,
          unitHint: null,
          topicId: q.topicId ?? null,
          marks: q.marks ?? null,
          pageRef: q.pageRef ?? null,
          kind: "faculty_extracted" as const,
        })),
      });
      return { stored: true as const, trendsInvented: false as const, demo: true };
    },
  },
};

void delay;
