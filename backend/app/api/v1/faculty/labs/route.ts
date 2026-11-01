import { json, readJsonBody } from "@/lib/academy/http";
import { addLab, listLabs } from "@/lib/content/ingest";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { randomUUID } from "node:crypto";

export async function GET(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  return json(200, { labs: listLabs() });
}

export async function POST(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value as {
    unitId?: string;
    title?: string;
    objective?: string;
    sourceRef?: string;
  } | null;
  if (!body?.unitId || !body.title || !body.sourceRef) return json(400, { error: "invalid_body" });
  addLab({
    id: randomUUID(),
    unitId: body.unitId,
    title: body.title,
    objective: body.objective,
    verified: true,
    sourceRef: body.sourceRef,
    uploadedAt: new Date().toISOString(),
  });
  return json(201, { stored: true, inventedOfficialList: false });
}
