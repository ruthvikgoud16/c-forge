import { timingSafeEqual } from "node:crypto";

export function loadSecret() {
  const fromEnv = process.env.JUDGE_SECRET;
  if (fromEnv) {
    delete process.env.JUDGE_SECRET;
    return fromEnv;
  }
  return "";
}

export function authorized(header, secret) {
  if (!header || !secret || !header.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  if (got.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(got, expected);
}
