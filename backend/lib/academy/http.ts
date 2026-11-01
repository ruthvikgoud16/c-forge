import { NextResponse } from "next/server";
export { isJudgeUnavailable } from "./errors";

export const API_BODY_LIMIT = 65_536;
export const SOURCE_BODY_LIMIT = 131_072;

const API_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "same-origin",
};

export function json(status: number, body: unknown, extra?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { ...API_HEADERS, ...extra } });
}

export async function readJsonBody(request: Request, maxBytes = API_BODY_LIMIT): Promise<
  { ok: true; value: unknown } | { ok: false; response: NextResponse }
> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: json(413, { error: "payload_too_large" }) };
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return { ok: false, response: json(413, { error: "payload_too_large" }) };
  }
  if (!text) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: true, value: null };
  }
}

function originHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

function allowedPublicHosts() {
  const raw = process.env.CFORGE_PUBLIC_ORIGIN ?? "";
  const hosts = new Set<string>();
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const host = originHost(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (host) hosts.add(host);
  }
  return hosts;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const from = originHost(origin);
  if (!from) return false;
  const host = request.headers.get("host");
  if (host && from === host) return true;
  return allowedPublicHosts().has(from);
}

export function rejectCrossOrigin(request: Request) {
  if (sameOrigin(request)) return null;
  return json(403, { error: "forbidden_origin" });
}
