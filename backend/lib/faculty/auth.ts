import { timingSafeEqual } from "node:crypto";
import { loadEnv } from "@/lib/academy/env";

function bearerMatches(header: string | null, token: string) {
  if (!header || !token || !header.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(token);
  if (got.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(got, expected);
}

export function facultyAuthorized(request: Request) {
  const env = loadEnv();
  return bearerMatches(request.headers.get("authorization"), env.facultyToken ?? "");
}
