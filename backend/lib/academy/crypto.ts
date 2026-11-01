import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

export function signPayload(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}
