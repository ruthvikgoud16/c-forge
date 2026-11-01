import { createIsomorphicFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { TOOL_IDS, TOOL_META } from "@/data/tools";
import type {
  AssessmentWithQuestions,
  AuthResult,
  DiagnosticItem,
  DiagnosticSession,
  DiagnosticSessionSummary,
  DiagnosticSubmitResult,
  Exercise,
  FacultySummary,
  Flashcard,
  Invitation,
  PlacementSnapshot,
  PlacementState,
  JudgeResult,
  Lesson,
  LessonSection,
  MindMap,
  Notes,
  OneShot,
  PreviewResult,
  Session,
  StartIntent,
  StudentProfile,
  StudentProgress,
  ToolId,
  Topic,
  Unit,
  UnitId,
} from "@/domain/types";
import type { CForgeServices } from "./contracts";
import { apiBase } from "./api-origin";
import { mapDashboard, mapLearningPath, mapRecommendation } from "@/lib/adaptive";
import { findFoundationTopic, mapFoundationLibrary } from "@/lib/foundation";
import {
  assertNoAssessmentAnswerKey,
  assessmentSubmitRequest,
  mapAssessmentSubmit,
  mapGraphQuestions,
  mapPublicAssessment,
  resolveAssessmentId,
} from "@/lib/assessment";
import { mapOfficialCurriculum } from "@/lib/curriculum-official";
import { unavailableJudgeResult, mapExecuteResponse } from "@/lib/judge";
import { teachingProgressRequest } from "@/lib/progress-events";
import { labIngestPayload, mapLabCollection, mapPaperCollection, paperIngestPayload } from "@/lib/resources";
import {
  mapFacultyInvitationCreate,
  mapFacultyInvitationList,
  mapFacultyOverview,
  mapFacultyRoster,
} from "@/lib/faculty";
import {
  assertNoTeachingAnswerKey,
  lessonCheckRequest,
  mapLessonCheckError,
  mapLessonCheckResponse,
  mapPublicLesson,
  mapTopicHub,
  mergeTeachingPackage,
  type LessonCheckFailure,
  type LessonCheckRequest,
  type LessonCheckResult,
} from "@/lib/teaching";

const FACULTY_TOKEN_KEY = "cforge_faculty_token";
const LESSON_KINDS = new Set<LessonSection["kind"]>([
  "intro", "objectives", "concept", "syntax", "example", "trace", "guided", "independent", "check",
]);

type Graph = {
  me: StudentProfile;
  units: Unit[];
  topics: Topic[];
  progress: StudentProgress;
  lessons: Array<{ topicId: string; lesson: Lesson; notes: Notes; oneShot: OneShot; flashcards: Flashcard[]; assessment: AssessmentWithQuestions }>;
  maps: Array<{ topicId: string; map: MindMap }>;
  unitMaps: Array<{ unitId: string; map: MindMap }>;
  assessments: AssessmentWithQuestions[];
  exercises: Exercise[];
};

const readCookie = createIsomorphicFn()
  .client(() => "")
  .server(async () => {
    const { serverCookie } = await import("./server-cookie.server");
    return serverCookie();
  });

let memorySession: Session | null = null;
let graphCache: { at: number; value: Graph } | null = null;
let graphFlight: Promise<Graph> | null = null;

function clearGraph() {
  graphCache = null;
  graphFlight = null;
}

function facultyToken() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(FACULTY_TOKEN_KEY) ?? "";
}

function rememberStudent(profile: StudentProfile) {
  memorySession = {
    role: "student",
    displayName: profile.name || profile.rollNumber,
    rollNumber: profile.rollNumber,
    isDemo: false,
  };
}

function isRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "options" in error && "statusCode" in error;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function errorText(status: number, body: unknown) {
  const code = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : "";
  if (code === "weak_password") return "Password must be at least 10 characters.";
  if (code === "JUDGE_UNAVAILABLE") return "The C judge is unavailable. This run was not executed.";
  if (code === "unauthorized") return "Sign in is required.";
  if (code) return code;
  return `Request failed (${status}).`;
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const cookie = await readCookie();
  if (cookie) headers.set("cookie", cookie);
  if (path.startsWith("/api/v1/faculty")) {
    const token = facultyToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${apiBase()}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 401 && !path.startsWith("/api/v1/auth/")) {
    if (path.startsWith("/api/v1/faculty") && typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(FACULTY_TOKEN_KEY);
    }
    throw redirect({ to: path.startsWith("/api/v1/faculty") ? "/faculty-login" : "/login" });
  }
  return response;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, errorText(response.status, body));
  if (body == null) throw new ApiError(response.status, "The server returned an empty response.");
  return body as T;
}

async function loadGraph(): Promise<Graph> {
  const now = Date.now();
  if (graphCache && now - graphCache.at < 1500) return graphCache.value;
  if (graphFlight) return graphFlight;
  graphFlight = request("/api/v1/bridge/learn")
    .then((response) => readJson<Graph>(response))
    .then((value) => {
      graphCache = { at: Date.now(), value: normalizeGraph(value) };
      graphFlight = null;
      return graphCache.value;
    })
    .catch((error: unknown) => {
      graphFlight = null;
      throw error;
    });
  return graphFlight;
}

function asUnitId(id: string): UnitId {
  if (id === "unit-1" || id === "unit-2" || id === "unit-3" || id === "unit-4" || id === "unit-5") return id;
  return "unit-1";
}

function asTool(id: string): ToolId | null {
  return TOOL_IDS.includes(id as ToolId) ? (id as ToolId) : null;
}

function sectionKind(kind: string): LessonSection["kind"] {
  return LESSON_KINDS.has(kind as LessonSection["kind"]) ? (kind as LessonSection["kind"]) : "concept";
}

function normalizeGraph(raw: Graph): Graph {
  return {
    ...raw,
    units: raw.units.map((unit) => ({ ...unit, id: asUnitId(unit.id) })),
    topics: raw.topics.map((topic) => ({
      ...topic,
      unitId: topic.unitId === "supplementary" ? "supplementary" : asUnitId(topic.unitId),
      tools: topic.tools.map((tool) => asTool(tool)).filter((tool): tool is ToolId => tool !== null),
      source: "original",
    })),
    lessons: raw.lessons.map((row) => ({
      ...row,
      lesson: {
        ...row.lesson,
        source: "original",
        sections: row.lesson.sections.map((section) => ({ ...section, kind: sectionKind(section.kind) })),
      },
      notes: { ...row.notes, source: "original" },
      oneShot: {
        ...row.oneShot,
        source: "original",
        quickCheck: row.oneShot.quickCheck.map((item) => ({ q: item.q, a: "" })),
      },
    })),
    assessments: raw.assessments.map((assessment) => ({
      ...assessment,
      source: "original" as const,
      questions: mapGraphQuestions(assessment.questions),
    })),
    exercises: raw.exercises.map((exercise) => ({ ...exercise, difficulty: exercise.difficulty || "core" })),
  };
}

function lessonRow(graph: Graph, topicId: string) {
  return graph.lessons.find((row) => row.topicId === topicId) ?? null;
}

async function execute(exerciseId: string, source: string, mode: "run" | "submit", stdin?: string): Promise<JudgeResult> {
  const response = await request("/api/v1/execute", {
    method: "POST",
    body: JSON.stringify(stdin === undefined ? { exerciseId, source, mode } : { exerciseId, source, mode, stdin }),
  });
  const body = await response.json().catch(() => null);
  if (response.status === 503) return unavailableJudgeResult(mode);
  if (!response.ok) {
    if (body && typeof body === "object" && "error" in body && String((body as { error: unknown }).error) === "JUDGE_UNAVAILABLE") {
      return unavailableJudgeResult(mode);
    }
    throw new ApiError(response.status, errorText(response.status, body));
  }
  return mapExecuteResponse(mode, response.status, body);
}

export const cforgeServices: CForgeServices = {
  auth: {
    async signIn(input): Promise<AuthResult> {
      if (input.role === "faculty") {
        const token = input.password.trim();
        if (!token) return { ok: false, error: "Faculty access token is required." };
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(FACULTY_TOKEN_KEY, token);
        const probe = await fetch(`${apiBase()}/api/v1/faculty/overview`, {
          headers: { authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!probe.ok) {
          if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(FACULTY_TOKEN_KEY);
          return { ok: false, error: "That faculty token was not accepted." };
        }
        await fetch(`${apiBase()}/api/v1/faculty/session`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          credentials: "include",
        }).catch(() => null);
        memorySession = { role: "faculty", displayName: "Faculty", isDemo: false };
        return { ok: true, session: memorySession };
      }
      const response = await request("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ rollIdentifier: input.rollNumber.trim(), password: input.password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        return { ok: false, error: response.status === 401 ? "Those credentials were not accepted." : errorText(response.status, body) };
      }
      clearGraph();
      const profile = await cforgeServices.student.me();
      rememberStudent(profile);
      return { ok: true, session: memorySession! };
    },
    async signOut() {
      memorySession = null;
      clearGraph();
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(FACULTY_TOKEN_KEY);
      await fetch(`${apiBase()}/api/v1/faculty/session`, { method: "DELETE", credentials: "include" }).catch(() => null);
      await request("/api/v1/auth/logout", { method: "POST" }).catch((error: unknown) => {
        if (isRedirect(error)) return;
        throw error;
      });
    },
    currentSession() {
      if (facultyToken()) return { role: "faculty", displayName: "Faculty", isDemo: false };
      return memorySession;
    },
  },
  invitations: {
    async lookup(token) {
      const response = await fetch(`${apiBase()}/api/v1/auth/invite/lookup?token=${encodeURIComponent(token)}`);
      if (!response.ok) return { error: "not-found" as const };
      const body = (await response.json()) as { invitation?: Invitation };
      if (!body.invitation) return { error: "not-found" as const };
      return { invitation: body.invitation };
    },
    async accept(token, password, rollNumber) {
      let roll = rollNumber?.trim();
      if (!roll) {
        const found = await cforgeServices.invitations.lookup(token);
        if ("error" in found) {
          return { ok: false as const, error: "This invitation could not be found." };
        }
        roll = found.invitation.rollNumber;
      }
      const response = await request("/api/v1/auth/invite/accept", {
        method: "POST",
        body: JSON.stringify({ token, rollIdentifier: roll, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) return { ok: false as const, error: errorText(response.status, body) };
      clearGraph();
      return { ok: true as const };
    },
    async list() {
      return mapFacultyInvitationList(await readJson(await request("/api/v1/faculty/invitations")));
    },
    async create(rollNumber) {
      const response = await request("/api/v1/faculty/invitations", {
        method: "POST",
        body: JSON.stringify({ rollNumber, ttlHours: 168 }),
      });
      const raw = await readJson<Record<string, unknown>>(response);
      const invitation = mapFacultyInvitationCreate(raw);
      const token = typeof raw["token"] === "string" ? raw["token"] : "";
      return token
        ? { ...invitation, oneTimeJoinPath: `/join/${encodeURIComponent(token)}?roll=${encodeURIComponent(invitation.rollNumber)}` }
        : invitation;
    },
    async revoke(id) {
      const response = await request("/api/v1/faculty/invitations", {
        method: "POST",
        body: JSON.stringify({ rollNumber: id, revoke: true }),
      });
      await readJson(response);
      const list = await cforgeServices.invitations.list();
      return list.find((row) => row.id === id) ?? { id, rollNumber: id, status: "revoked", createdAt: "", expiresAt: "" };
    },
  },
  curriculum: {
    async units() {
      return (await loadGraph()).units;
    },
    async unit(id) {
      return (await loadGraph()).units.find((unit) => unit.id === id) ?? null;
    },
    async topics(unitId) {
      const topics = (await loadGraph()).topics;
      return unitId ? topics.filter((topic) => topic.unitId === unitId) : topics;
    },
    async topic(id) {
      return (await loadGraph()).topics.find((topic) => topic.id === id) ?? null;
    },
    async neighbours(topicId) {
      const topics = (await loadGraph()).topics;
      const index = topics.findIndex((topic) => topic.id === topicId);
      return { prev: index > 0 ? topics[index - 1]! : null, next: index >= 0 ? topics[index + 1] ?? null : null };
    },
    async unitMindMap(unitId) {
      return (await loadGraph()).unitMaps.find((row) => row.unitId === unitId)?.map ?? null;
    },
    async topicMindMap(topicId) {
      return (await loadGraph()).maps.find((row) => row.topicId === topicId)?.map ?? null;
    },
    async official() {
      try {
        return mapOfficialCurriculum(await readJson<Record<string, unknown>>(await request("/api/v1/curriculum")));
      } catch (error) {
        if (isRedirect(error)) throw error;
        const graph = await loadGraph();
        return {
          officialUnitCount: graph.units.length,
          officialTopicCount: graph.topics.length,
          units: graph.units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            sourceLabel: unit.title,
            topicCount: graph.topics.filter((topic) => topic.unitId === unit.id).length,
          })),
          foundationIsOfficialUnit: false as const,
        };
      }
    },
    async teachingTopicIds() {
      return (await loadGraph()).lessons.map((row) => row.topicId);
    },
  },
  lessons: {
    async lesson(topicId) {
      return lessonRow(await loadGraph(), topicId)?.lesson ?? null;
    },
    async notes(topicId) {
      return lessonRow(await loadGraph(), topicId)?.notes ?? null;
    },
    async oneShot(topicId) {
      return lessonRow(await loadGraph(), topicId)?.oneShot ?? null;
    },
  },
  teaching: {
    async forTopic(topicId) {
      const graph = await loadGraph();
      const topic = graph.topics.find((row) => row.id === topicId);
      if (!topic) return null;
      let hub = null;
      try {
        hub = mapTopicHub(await readJson<Record<string, unknown>>(await request(`/api/v1/curriculum/topics/${encodeURIComponent(topicId)}`)));
      } catch (error) {
        if (isRedirect(error)) throw error;
        hub = null;
      }
      let publicLesson = null;
      const lessonId = hub?.lessonId;
      if (lessonId) {
        try {
          publicLesson = mapPublicLesson(await readJson<Record<string, unknown>>(await request(`/api/v1/curriculum/lessons/${encodeURIComponent(lessonId)}`)));
          assertNoTeachingAnswerKey({
            checks: publicLesson.checks,
            trace: publicLesson.trace,
            predict: publicLesson.predict,
            guided: publicLesson.guided,
            independent: publicLesson.independent,
          });
        } catch (error) {
          if (isRedirect(error)) throw error;
          publicLesson = null;
        }
      }
      const row = lessonRow(graph, topicId);
      return mergeTeachingPackage({
        topicId,
        source: "original",
        hub,
        publicLesson,
        graphConcepts: topic.concepts,
        alwaysPresent: row ? ["notes", "oneshot", "mind-map", "flashcards"] : [],
      });
    },
    async check(input: LessonCheckRequest): Promise<LessonCheckResult | LessonCheckFailure> {
      const built = lessonCheckRequest(input);
      if (!built.ok) return built;
      const response = await request(built.path, { method: "POST", body: JSON.stringify(built.payload) });
      const body = await response.json().catch(() => null);
      if (!response.ok) return mapLessonCheckError(response.status, body);
      const mapped = mapLessonCheckResponse(body);
      assertNoTeachingAnswerKey(mapped);
      return mapped;
    },
  },
  flashcards: {
    async deck(topicId) {
      return lessonRow(await loadGraph(), topicId)?.flashcards.map((card) => ({ id: card.id, topicId: card.topicId, front: card.front, back: card.back })) ?? [];
    },
    async totalCount() {
      return (await loadGraph()).lessons.reduce((sum, row) => sum + row.flashcards.length, 0);
    },
  },
  assessments: {
    async list() {
      return (await loadGraph()).assessments.map(({ questions: _questions, ...assessment }) => assessment);
    },
    async get(id) {
      const resolved = resolveAssessmentId(id);
      try {
        const mapped = mapPublicAssessment(await readJson<Record<string, unknown>>(await request(`/api/v1/assessments/${encodeURIComponent(resolved)}`)));
        if (mapped) {
          assertNoAssessmentAnswerKey(mapped);
          return mapped;
        }
      } catch (error) {
        if (isRedirect(error)) throw error;
      }
      return (await loadGraph()).assessments.find((assessment) => assessment.id === resolved || assessment.id === id) ?? null;
    },
    async previewScore(id, answers): Promise<PreviewResult> {
      const built = assessmentSubmitRequest(id, answers);
      const response = await request(built.path, {
        method: "POST",
        body: JSON.stringify(built.payload),
      });
      const body = await readJson<Record<string, unknown>>(response);
      assertNoAssessmentAnswerKey(body);
      clearGraph();
      return mapAssessmentSubmit(id, body);
    },
  },
  student: {
    async me() {
      const response = await request("/api/v1/me");
      const body = await readJson<{
        studentId: string;
        rollIdentifier: string;
        displayName: string | null;
        dateOfBirth?: string | null;
        appearance?: "light" | "dark" | null;
        profileComplete?: boolean;
      }>(response);
      const profile = {
        id: body.studentId,
        rollNumber: body.rollIdentifier,
        name: body.displayName || body.rollIdentifier,
        cohort: "",
        dateOfBirth: body.dateOfBirth ?? null,
        appearance: body.appearance ?? null,
        profileComplete: Boolean(body.profileComplete),
      };
      rememberStudent(profile);
      return profile;
    },
    async updateProfile(input) {
      await readJson(await request("/api/v1/profile", {
        method: "POST",
        body: JSON.stringify(input),
      }));
      return cforgeServices.student.me();
    },
  },
  progress: {
    async forStudent(studentId) {
      if (facultyToken()) {
        throw new ApiError(403, "The server does not provide another student's learning record to the faculty session.");
      }
      const graph = await loadGraph();
      if (graph.me.id !== studentId) {
        throw new ApiError(403, "Progress is available only for the signed-in student.");
      }
      return graph.progress;
    },
    async history(studentId) {
      const progress = await cforgeServices.progress.forStudent(studentId);
      return progress.attempts;
    },
    async recordTeachingEvent(topicId, kind) {
      const built = teachingProgressRequest(topicId, kind);
      if (!built.ok) return;
      const response = await request(built.path, { method: "POST", body: JSON.stringify(built.payload) });
      if (!response.ok && response.status !== 401) {
        await response.json().catch(() => null);
      }
    },
  },
  visualizers: {
    async list() {
      return TOOL_IDS.map((id) => ({ id, ...TOOL_META[id] }));
    },
  },
  exercises: {
    async list() {
      return (await loadGraph()).exercises;
    },
    async get(id) {
      return (await loadGraph()).exercises.find((exercise) => exercise.id === id) ?? null;
    },
  },
  judge: {
    run(exerciseId, code, stdin) {
      return execute(exerciseId, code, "run", stdin);
    },
    submit(exerciseId, code) {
      return execute(exerciseId, code, "submit");
    },
  },
  faculty: {
    async summary(): Promise<FacultySummary> {
      return mapFacultyOverview(await readJson(await request("/api/v1/faculty/overview")));
    },
    async roster() {
      const [rosterBody, invites] = await Promise.all([
        readJson(await request("/api/v1/faculty/roster")),
        cforgeServices.invitations.list(),
      ]);
      return mapFacultyRoster(rosterBody, invites);
    },
    async student(id) {
      const roster = await cforgeServices.faculty.roster();
      return roster.find((row) => row.id === id || row.rollNumber === id) ?? null;
    },
    async importCsv() {
      return {
        added: 0,
        skipped: 0,
        errors: ["Paste import is not supported. The server imports a verified roster file, not pasted CSV."],
      };
    },
    async rename(id, name) {
      const response = await request("/api/v1/faculty/roster", {
        method: "POST",
        body: JSON.stringify({ updates: [{ rollNumber: id, displayName: name }] }),
      });
      await readJson(response);
      const roster = await cforgeServices.faculty.roster();
      const row = roster.find((entry) => entry.id === id || entry.rollNumber === id);
      if (!row) throw new ApiError(404, "That roster entry was not found.");
      return { ...row, name };
    },
  },
  onboarding: {
    async get() {
      const body = await readJson<{ startIntent: StartIntent | null; notASkillLabel: true }>(
        await request("/api/v1/onboarding/preferences"),
      );
      return { startIntent: body.startIntent ?? null, notASkillLabel: true as const };
    },
    async save(startIntent) {
      return readJson<{ startIntent: StartIntent; notASkillLabel: true }>(
        await request("/api/v1/onboarding/preferences", {
          method: "POST",
          body: JSON.stringify({ startIntent }),
        }),
      );
    },
  },
  diagnostics: {
    async list() {
      const body = await readJson<{ sessions: DiagnosticSessionSummary[] }>(await request("/api/v1/diagnostics"));
      return body.sessions ?? [];
    },
    async start() {
      return publicDiagnostic(await readJson<DiagnosticSession>(await request("/api/v1/diagnostics", { method: "POST" })));
    },
    async get(id) {
      return publicDiagnostic(await readJson<DiagnosticSession>(await request(`/api/v1/diagnostics/${encodeURIComponent(id)}`)));
    },
    async submit(id, answers) {
      return readJson<DiagnosticSubmitResult>(
        await request(`/api/v1/diagnostics/${encodeURIComponent(id)}/submit`, {
          method: "POST",
          body: JSON.stringify({ answers }),
        }),
      );
    },
  },
  placement: {
    async get() {
      const body = await readJson<PlacementSnapshot>(await request("/api/v1/placement"));
      return {
        rubricVersion: body.rubricVersion,
        placementIsNotMastery: true as const,
        topics: (body.topics ?? []).map((topic) => ({
          id: topic.id,
          sourceLabel: topic.sourceLabel,
          placement: topic.placement as PlacementState | null,
          mastery: topic.mastery,
          readiness: null,
        })),
      };
    },
  },
  adaptive: {
    async dashboard() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/dashboard"));
      return mapDashboard(body, "original");
    },
    async path() {
      const body = await readJson<{ recommendedNext?: Record<string, unknown>; units?: unknown; guidanceOnly?: boolean }>(
        await request("/api/v1/learn/path"),
      );
      return {
        recommendedNext: body.recommendedNext ? mapRecommendation(body.recommendedNext) : null,
        units: mapLearningPath(body.units),
        guidanceOnly: true as const,
        source: "original" as const,
      };
    },
    async next() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/learn/next"));
      if (!body["topicId"]) return null;
      return mapRecommendation(body);
    },
  },
  foundation: {
    async library() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/curriculum/units/foundation"));
      return mapFoundationLibrary(body, "original");
    },
    async topic(id) {
      return findFoundationTopic(await cforgeServices.foundation.library(), id);
    },
  },
  resources: {
    async labs() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/labs"));
      return mapLabCollection(body, "original");
    },
    async papers() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/papers"));
      return mapPaperCollection(body, "original");
    },
  },
  facultyResources: {
    async labs() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/faculty/labs"));
      return mapLabCollection(body, "original");
    },
    async addLab(input) {
      const payload = labIngestPayload(input);
      if (!payload.ok) throw new ApiError(400, payload.error);
      const response = await request("/api/v1/faculty/labs", { method: "POST", body: JSON.stringify(payload.body) });
      await readJson(response);
      return { stored: true as const, inventedOfficialList: false as const, demo: false };
    },
    async papers() {
      const body = await readJson<Record<string, unknown>>(await request("/api/v1/faculty/papers"));
      return mapPaperCollection(body, "original");
    },
    async addPaper(input) {
      const payload = paperIngestPayload(input);
      if (!payload.ok) throw new ApiError(400, payload.error);
      const response = await request("/api/v1/faculty/papers", { method: "POST", body: JSON.stringify(payload.body) });
      await readJson(response);
      return { stored: true as const, trendsInvented: false as const, demo: false };
    },
  },
};

function publicDiagnostic(session: DiagnosticSession): DiagnosticSession {
  return {
    ...session,
    items: (session.items ?? []).map((item) => {
      const { id, topicId, method, kind, prompt, choices, dimension } = item as DiagnosticItem;
      const publicItem: DiagnosticItem = { id, topicId, method, kind, prompt, dimension };
      if (choices) publicItem.choices = choices;
      return publicItem;
    }),
  };
}

export function rethrowIfRedirect(error: unknown) {
  if (isRedirect(error)) throw error;
}
