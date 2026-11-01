import { randomBytes } from "node:crypto";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import postgres from "postgres";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

function strongPassword() {
  return randomBytes(32).toString("base64url");
}

function withUserPass(url, user, pass) {
  const parsed = new URL(url);
  parsed.username = user;
  parsed.password = pass;
  return parsed.toString();
}

function upsertEnv(text, key, value) {
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(text)) return text.replace(new RegExp(`^${key}=.*$`, "m"), line);
  return `${text.trimEnd()}\n${line}\n`;
}

const admin = postgres(
  `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:5432/postgres`,
  { max: 1, onnotice: () => undefined },
);

const appPass = strongPassword();
const facultyPass = strongPassword();
const migratorPass = strongPassword();
if (new Set([appPass, facultyPass, migratorPass]).size !== 3) {
  console.error("generated passwords were not independent");
  process.exit(1);
}

try {
  const who = await admin`SELECT rolsuper FROM pg_roles WHERE rolname = current_user`;
  if (!who[0]?.rolsuper) {
    console.error("rotate-cforge-role-passwords must run as a superuser");
    process.exit(1);
  }
  await admin.unsafe("SET password_encryption = 'scram-sha-256'");
  const nologin = await admin`
    SELECT rolname, rolcanlogin FROM pg_roles
    WHERE rolname IN ('cforge', 'cforge_owner', 'cforge_student')
  `;
  if (nologin.some((row) => row.rolcanlogin)) {
    console.error("refusing to rotate while a non-runtime CForge role can log in");
    process.exit(1);
  }
  for (const [role, pass] of [
    ["cforge_app", appPass],
    ["cforge_faculty", facultyPass],
    ["cforge_migrator", migratorPass],
  ]) {
    const cmd = await admin`SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', ${role}::text, ${pass}::text) AS stmt`;
    await admin.unsafe(cmd[0].stmt);
  }
  console.log("role_passwords_rotated=cforge_app,cforge_faculty,cforge_migrator");
} finally {
  await admin.end({ timeout: 3 });
}

const envPath = new URL("../.env.local", import.meta.url);
let text = "";
try {
  text = readFileSync(envPath, "utf8");
} catch {
  text = "";
}
const base = process.env.DATABASE_URL || "postgres://cforge_app@127.0.0.1:5432/cforge";
text = upsertEnv(text, "DATABASE_URL", withUserPass(base, "cforge_app", appPass));
text = upsertEnv(text, "FACULTY_DATABASE_URL", withUserPass(base, "cforge_faculty", facultyPass));
text = upsertEnv(text, "MIGRATOR_DATABASE_URL", withUserPass(base, "cforge_migrator", migratorPass));
writeFileSync(envPath, text, { mode: 0o600 });
chmodSync(envPath, 0o600);
console.log("env_local_updated=true env_local_mode=600");
