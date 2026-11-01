/**
 * Model-agnostic teacher interface.
 * No vendor SDK is imported here. Do not call this from execute/judge paths.
 */

export type TeacherRole = "hint" | "socratic" | "explain" | "remediate";

export type TeacherRequest = {
  role: TeacherRole;
  lessonId?: string;
  classification?: "OFFICIAL" | "SUPPORTING" | "EXTENSION";
  studentLevel: "beginner";
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  allowCompleteSolution: boolean;
};

export type TeacherResponse = {
  text: string;
  hints?: string[];
  askStudent?: string;
  grounded: boolean;
  syllabusSpecified: boolean;
  usage?: { inputTokens?: number; outputTokens?: number; costUsd?: number; model?: string };
};

export interface TeacherProvider {
  readonly id: string;
  complete(request: TeacherRequest): Promise<TeacherResponse>;
}

export class UnconfiguredTeacherProvider implements TeacherProvider {
  readonly id = "unconfigured";
  async complete(): Promise<TeacherResponse> {
    return {
      text: "Teaching assistant is not configured. Use the lesson notes and the judge. No model is selected.",
      grounded: true,
      syllabusSpecified: false,
    };
  }
}

export function getTeacherProvider(): TeacherProvider {
  return new UnconfiguredTeacherProvider();
}
