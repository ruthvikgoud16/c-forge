// CForge domain model — framework-agnostic, portable to the existing Next.js app.

export type UnitId = "unit-1" | "unit-2" | "unit-3" | "unit-4" | "unit-5";
export type ToolId =
  | "syntax"
  | "binary"
  | "algorithm"
  | "flowchart"
  | "control-flow"
  | "array-string"
  | "recursion"
  | "search-sort";

/** Where a piece of content comes from — lets the UI be honest about demo material. */
export type ContentSource = "demo" | "original";

export interface Unit {
  id: UnitId;
  number: number;
  title: string;
  shortTitle: string;
  summary: string;
}

export interface Concept {
  term: string;
  definition: string;
}

export interface Topic {
  id: string;
  unitId: UnitId | "supplementary";
  order: number;
  title: string;
  summary: string;
  concepts: Concept[];
  example: { code: string; output: string; explanation: string };
  syntax?: string | undefined;
  tools: ToolId[];
  exerciseIds: string[];
  note?: string;
  source: ContentSource;
}

export interface LessonSection {
  id: string;
  kind:
    | "intro"
    | "objectives"
    | "concept"
    | "syntax"
    | "example"
    | "trace"
    | "guided"
    | "independent"
    | "check";
  title: string;
  body?: string;
  items?: string[];
  code?: string;
  output?: string;
}

export interface Lesson {
  topicId: string;
  title: string;
  sections: LessonSection[];
  source: ContentSource;
}

export interface Notes {
  topicId: string;
  title: string;
  sections: { heading: string; points: string[]; code?: string }[];
  source: ContentSource;
}

export interface OneShot {
  topicId: string;
  title: string;
  keyPoints: string[];
  syntax?: string | undefined;
  pitfalls: string[];
  quickCheck: { q: string; a: string }[];
  source: ContentSource;
}

export interface Flashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  code?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  kind: "root" | "topic" | "concept" | "resource";
  detail?: string;
  href?: string;
}
export interface MindMapEdge {
  from: string;
  to: string;
}
export interface MindMap {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export type QuestionType = "single-choice" | "predict-output" | "true-false" | "short-answer";
export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  code?: string;
  options: { id: string; label: string }[];
  family?: string;
}

export interface Assessment {
  id: string;
  kind: "topic" | "unit";
  title: string;
  scopeId: string; // topicId or unitId
  questionCount: number;
  source: ContentSource;
}

export interface AssessmentWithQuestions extends Assessment {
  questions: Question[];
}

export interface PreviewResult {
  assessmentId: string;
  correct: number;
  total: number;
  perQuestion: { questionId: string; correct: boolean; correctOptionId: string | undefined }[];
  /** True only for the explicit demo adapter. Server submissions are authoritative. */
  isPreview: boolean;
}

export type MasteryState = "not-started" | "opened" | "demonstrated" | "mastered" | "needs-practice";

export interface TopicProgress {
  topicId: string;
  state: MasteryState;
  lastOpened?: string; // ISO date
}

export interface AssessmentAttempt {
  assessmentId: string;
  title: string;
  date: string;
  correct: number;
  total: number;
}

export type Appearance = "light" | "dark";

export interface StudentProfile {
  id: string;
  rollNumber: string;
  name: string;
  cohort: string;
  dateOfBirth?: string | null;
  appearance?: Appearance | null;
  profileComplete?: boolean;
}

export interface StudentProgress {
  studentId: string;
  topics: TopicProgress[];
  attempts: AssessmentAttempt[];
  recent: { topicId: string; resource: string | undefined; date: string }[];
  recommendedTopicId?: string;
}

export type Difficulty = "warm-up" | "core" | "stretch";
export interface Exercise {
  id: string;
  title: string;
  topicId: string;
  difficulty: Difficulty;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  samples: { input: string; output: string }[];
  starterCode: string;
  hiddenTestCount: number;
}

export type JudgeVerdict = "accepted" | "wrong-answer" | "compile-error" | "runtime-error" | "unavailable";
export interface JudgeResult {
  mode: "run" | "submit";
  verdict: JudgeVerdict;
  compilerOutput: string;
  stdout: string;
  tests?: { name: string; passed: boolean }[];
  /** True only when the explicit demo adapter simulated execution. */
  isSimulated: boolean;
}

export type AccountStatus = "active" | "invited" | "not-invited";
export interface RosterEntry {
  id: string;
  rollNumber: string;
  name: string;
  status: AccountStatus;
  invitation?: Invitation | undefined;
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
export interface Invitation {
  id: string;
  rollNumber: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface FacultySummary {
  capacity: number;
  rosterCount: number;
  active: number;
  invited: number;
  notInvited: number;
  unitProgress: { unitId: UnitId; title?: string; demonstrated: number; mastered: number; needsPractice: number }[];
  assessmentBuckets: { label: string; count: number | null }[];
  revisitTopics: { topicId: string; students: number | null }[];
  engagement: { label: string; value: number }[];
}

export type Role = "student" | "faculty";
export interface Session {
  role: Role;
  displayName: string;
  rollNumber?: string;
  isDemo: boolean;
}

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

export type StartIntent =
  | "from_scratch"
  | "test_knowledge"
  | "theory_weak_coding"
  | "exam_revision"
  | "problem_solving";

export type PlacementState =
  | "NOT_ASSESSED"
  | "NEEDS_FOUNDATION"
  | "NEEDS_LEARNING"
  | "PARTIALLY_DEMONSTRATED"
  | "DEMONSTRATED"
  | "NEEDS_REVISION";

export type DiagnosticItemKind = "mcq" | "short";

export interface DiagnosticItem {
  id: string;
  topicId: string;
  method: string;
  kind: DiagnosticItemKind;
  prompt: string;
  choices?: string[];
  dimension: string;
}

export interface DiagnosticSessionSummary {
  id: string;
  status: "open" | "submitted";
  rubricVersion: string;
  createdAt: string;
  submittedAt?: string;
}

export interface DiagnosticSession extends DiagnosticSessionSummary {
  curriculumVersion?: string;
  items: DiagnosticItem[];
}

export interface DiagnosticGrade {
  itemId: string;
  correct: boolean;
  topicId: string;
}

export interface DiagnosticSubmitResult {
  sessionId: string;
  graded: DiagnosticGrade[];
  placements: { topicId: string; state: PlacementState }[];
  rubricVersion: string;
}

export interface PlacementTopic {
  id: string;
  sourceLabel: string;
  placement: PlacementState | null;
  mastery: string | null;
  readiness: null;
}

export interface PlacementSnapshot {
  rubricVersion: string;
  placementIsNotMastery: true;
  topics: PlacementTopic[];
}
