import { json, readJsonBody } from "@/lib/academy/http";
import { addPaper, listPapers } from "@/lib/content/ingest";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { randomUUID } from "node:crypto";

export async function GET(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  return json(200, { papers: listPapers(), fabricated: false });
}

export async function POST(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value as {
    academicYear?: string;
    semester?: string;
    examType?: string;
    sourceRef?: string;
    questions?: Array<{ text?: string; topicId?: string; marks?: number; pageRef?: string }>;
  } | null;
  if (!body?.academicYear || !body.sourceRef || !body.questions?.length) {
    return json(400, { error: "invalid_body" });
  }
  addPaper({
    id: randomUUID(),
    academicYear: body.academicYear,
    semester: body.semester ?? "",
    examType: body.examType ?? "",
    sourceRef: body.sourceRef,
    verified: true,
    uploadedAt: new Date().toISOString(),
    questions: body.questions
      .filter((q) => q.text)
      .map((q) => ({
        id: randomUUID(),
        text: q.text!,
        topicId: q.topicId,
        marks: q.marks,
        pageRef: q.pageRef,
        kind: "faculty_extracted" as const,
      })),
  });
  return json(201, { stored: true, trendsInvented: false });
}
