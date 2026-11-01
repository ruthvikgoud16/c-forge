import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { signPayload } from "./crypto";
import { loadEnv } from "./env";

const COOKIE = "cforge_session";

export type Session = {
  studentId: string;
  rollIdentifier: string;
};

export function encodeSession(secret: string, session: Session) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const sig = signPayload(secret, payload);
  return `${payload}.${sig}`;
}

export function decodeSession(secret: string, raw: string | undefined): Session | null {
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = signPayload(secret, payload);
  const left = Buffer.from(expected);
  const right = Buffer.from(sig);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session>;
    if (typeof parsed?.studentId !== "string" || typeof parsed?.rollIdentifier !== "string") return null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.studentId)) {
      return null;
    }
    if (!/^[\p{L}\p{N}._-]{1,64}$/u.test(parsed.rollIdentifier)) return null;
    return { studentId: parsed.studentId, rollIdentifier: parsed.rollIdentifier };
  } catch {
    return null;
  }
}

export async function readSession(): Promise<Session | null> {
  const env = loadEnv();
  const jar = await cookies();
  return decodeSession(env.sessionSecret, jar.get(COOKIE)?.value);
}

export async function writeSession(session: Session) {
  const env = loadEnv();
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(env.sessionSecret, session), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
