// Typed service boundary. Pages depend ONLY on these interfaces.
// The demo adapter implements them today; swap in the existing CForge API adapter later.
import type {
  Assessment, AssessmentAttempt, AssessmentWithQuestions, AuthResult, Exercise, FacultySummary, Flashcard, Invitation,
  JudgeResult, Lesson, MindMap, Notes, OneShot, PreviewResult, RosterEntry, Session, StudentProfile, StudentProgress,
  Topic, ToolId, Unit, UnitId,
} from "@/domain/types";

export interface AuthenticationService {
  signIn(input: { rollNumber: string; password: string; role: "student" | "faculty" }): Promise<AuthResult>;
  signOut(): Promise<void>;
  currentSession(): Session | null;
}
export interface InvitationService {
  lookup(token: string): Promise<{ invitation: Invitation } | { error: "not-found" }>;
  accept(token: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  list(): Promise<Invitation[]>;
  create(rollNumber: string): Promise<Invitation>;
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
}
export interface LessonService {
  lesson(topicId: string): Promise<Lesson | null>;
  notes(topicId: string): Promise<Notes | null>;
  oneShot(topicId: string): Promise<OneShot | null>;
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
}
export interface ProgressService {
  forStudent(studentId: string): Promise<StudentProgress>;
  history(studentId: string): Promise<AssessmentAttempt[]>;
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

export interface CForgeServices {
  auth: AuthenticationService;
  invitations: InvitationService;
  curriculum: CurriculumService;
  lessons: LessonService;
  flashcards: FlashcardService;
  assessments: AssessmentService;
  student: StudentService;
  progress: ProgressService;
  visualizers: VisualizerService;
  exercises: ExerciseService;
  judge: JudgeService;
  faculty: FacultyService;
}
