// Typed service boundary. Pages depend ONLY on these interfaces.
// The demo adapter implements them today; swap in the existing CForge API adapter later.
import type {
  Assessment, AssessmentAttempt, AssessmentWithQuestions, AuthResult, DiagnosticSession, DiagnosticSessionSummary,
  DiagnosticSubmitResult, Exercise, FacultySummary, Flashcard, Invitation, JudgeResult, Lesson, MindMap, Notes, OneShot,
  PlacementSnapshot, PreviewResult, RosterEntry, Session, StartIntent, StudentProfile, StudentProgress, Topic, ToolId,
  Unit, UnitId,
} from "@/domain/types";
import type { AdaptiveDashboard, AdaptivePath, AdaptiveRecommendation } from "@/lib/adaptive";
import type { FoundationLibrary, FoundationTopic } from "@/lib/foundation";
import type {
  LabIngestInput,
  LabResource,
  PaperIngestInput,
  PaperResource,
  ResourceSource,
} from "@/lib/resources";
import type { OfficialCurriculum } from "@/lib/curriculum-official";
import type { LessonCheckFailure, LessonCheckRequest, LessonCheckResult, TeachingPackage } from "@/lib/teaching";

export interface AuthenticationService {
  signIn(input: { rollNumber: string; password: string; role: "student" | "faculty" }): Promise<AuthResult>;
  signOut(): Promise<void>;
  currentSession(): Session | null;
}
export interface InvitationService {
  lookup(token: string): Promise<{ invitation: Invitation } | { error: "not-found" }>;
  accept(token: string, password: string, rollNumber?: string): Promise<{ ok: true } | { ok: false; error: string }>;
  list(): Promise<Invitation[]>;
  create(rollNumber: string): Promise<Invitation & { oneTimeJoinPath?: string }>;
  revoke(id: string): Promise<Invitation>;
}
export interface CurriculumService {
  units(): Promise<Unit[]>;
  unit(id: string): Promise<Unit | null>;
  topics(unitId?: UnitId | "supplementary"): Promise<Topic[]>;
  topic(id: string): Promise<Topic | null>;
  neighbours(topicId: string): Promise<{ prev: Topic | null; next: Topic | null }>;
  unitMindMap(unitId: string): Promise<MindMap | null>;
  topicMindMap(topicId: string): Promise<MindMap | null>;
  official(): Promise<OfficialCurriculum | null>;
  teachingTopicIds(): Promise<string[]>;
}
export interface LessonService {
  lesson(topicId: string): Promise<Lesson | null>;
  notes(topicId: string): Promise<Notes | null>;
  oneShot(topicId: string): Promise<OneShot | null>;
}
export interface TeachingService {
  forTopic(topicId: string): Promise<TeachingPackage | null>;
  check(input: LessonCheckRequest): Promise<LessonCheckResult | LessonCheckFailure>;
}
export interface FlashcardService {
  deck(topicId: string): Promise<Flashcard[]>;
  totalCount(): Promise<number>;
}
export interface AssessmentService {
  list(): Promise<Assessment[]>;
  get(id: string): Promise<AssessmentWithQuestions | null>;
  /** Client-side preview scoring only. Never authoritative; never saved. */
  previewScore(id: string, answers: Record<string, string>): Promise<PreviewResult>;
}
export interface StudentService {
  me(): Promise<StudentProfile>;
  updateProfile(input: { dateOfBirth?: string | null; appearance?: "light" | "dark" }): Promise<StudentProfile>;
}
export interface ProgressService {
  forStudent(studentId: string): Promise<StudentProgress>;
  history(studentId: string): Promise<AssessmentAttempt[]>;
  recordTeachingEvent(topicId: string, kind: "notes_viewed" | "oneshot_completed" | "flashcards_reviewed"): Promise<void>;
}
export interface VisualizerService {
  list(): Promise<{ id: ToolId; name: string; blurb: string; glyph: string }[]>;
}
export interface ExerciseService {
  list(): Promise<Exercise[]>;
  get(id: string): Promise<Exercise | null>;
}
export interface JudgeService {
  /** Real execution must go through the existing secure server-side judge. */
  run(exerciseId: string, code: string, stdin: string): Promise<JudgeResult>;
  submit(exerciseId: string, code: string): Promise<JudgeResult>;
}
export interface FacultyService {
  summary(): Promise<FacultySummary>;
  roster(): Promise<RosterEntry[]>;
  student(id: string): Promise<RosterEntry | null>;
  importCsv(csv: string): Promise<{ added: number; skipped: number; errors: string[] }>;
  rename(id: string, name: string): Promise<RosterEntry>;
}
export interface OnboardingService {
  get(): Promise<{ startIntent: StartIntent | null; notASkillLabel: true }>;
  save(startIntent: StartIntent): Promise<{ startIntent: StartIntent; notASkillLabel: true }>;
}
export interface DiagnosticService {
  list(): Promise<DiagnosticSessionSummary[]>;
  start(): Promise<DiagnosticSession>;
  get(id: string): Promise<DiagnosticSession>;
  submit(id: string, answers: Array<{ itemId: string; value: string | number }>): Promise<DiagnosticSubmitResult>;
}
export interface PlacementService {
  get(): Promise<PlacementSnapshot>;
}
export interface AdaptiveService {
  dashboard(): Promise<AdaptiveDashboard>;
  path(): Promise<{ recommendedNext: AdaptiveRecommendation | null; units: AdaptivePath; guidanceOnly: true; source: "demo" | "original" }>;
  next(): Promise<AdaptiveRecommendation | null>;
}
export interface FoundationService {
  library(): Promise<FoundationLibrary>;
  topic(id: string): Promise<FoundationTopic | null>;
}
export interface ResourceService {
  labs(): Promise<{ source: ResourceSource; fabricated: boolean; persistence: "process-memory" | "demo-session"; labs: LabResource[] }>;
  papers(): Promise<{ source: ResourceSource; fabricated: boolean; persistence: "process-memory" | "demo-session"; papers: PaperResource[] }>;
}
export interface FacultyResourceService {
  labs(): Promise<{ source: ResourceSource; fabricated: boolean; persistence: "process-memory" | "demo-session"; labs: LabResource[] }>;
  addLab(input: LabIngestInput): Promise<{ stored: true; inventedOfficialList: false; demo: boolean }>;
  papers(): Promise<{ source: ResourceSource; fabricated: boolean; persistence: "process-memory" | "demo-session"; papers: PaperResource[] }>;
  addPaper(input: PaperIngestInput): Promise<{ stored: true; trendsInvented: false; demo: boolean }>;
}

export interface CForgeServices {
  auth: AuthenticationService;
  invitations: InvitationService;
  curriculum: CurriculumService;
  lessons: LessonService;
  teaching: TeachingService;
  flashcards: FlashcardService;
  assessments: AssessmentService;
  student: StudentService;
  progress: ProgressService;
  visualizers: VisualizerService;
  exercises: ExerciseService;
  judge: JudgeService;
  faculty: FacultyService;
  onboarding: OnboardingService;
  diagnostics: DiagnosticService;
  placement: PlacementService;
  adaptive: AdaptiveService;
  foundation: FoundationService;
  resources: ResourceService;
  facultyResources: FacultyResourceService;
}
