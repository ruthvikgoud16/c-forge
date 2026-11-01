import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { loadEnvLocal } from "./load-env-local.mjs";
import { assertLocalCforgeTarget, parseDatabaseUrl } from "./migrate-engine.mjs";
import { resolvePgBin } from "./pg-bin.mjs";

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

let target;
try {
  target = assertLocalCforgeTarget(url);
} catch (error) {
  console.error(error instanceof Error ? error.message : "invalid target");
  process.exit(1);
}

// FORCE RLS blocks COPY as table owner. Dump as the instance admin; do not grant BYPASSRLS to cforge.
const adminUrl =
  process.env.ADMIN_DATABASE_URL ||
  `postgres://${encodeURIComponent(os.userInfo().username)}@${target.host}:${target.port}/cforge`;
const admin = parseDatabaseUrl(adminUrl);
if (["cforge", "cforge_app", "cforge_faculty", "cforge_migrator", "cforge_owner"].includes(admin.user)) {
  console.error("backup must run as the instance administrator, not a CForge role");
  process.exit(1);
}
if (admin.host !== "127.0.0.1" && admin.host !== "localhost" && admin.host !== "::1") {
  console.error("backup administrator must be on localhost");
  process.exit(1);
}
if (admin.database !== "cforge") {
  console.error("backup administrator URL must target database cforge");
  process.exit(1);
}

let pgDump;
try {
  pgDump = resolvePgBin("pg_dump");
} catch (error) {
  console.error(error instanceof Error ? error.message : "pg_dump missing");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const dir = process.env.CFORGE_BACKUP_DIR || path.join(os.homedir(), ".cforge", "backups");
mkdirSync(dir, { recursive: true, mode: 0o700 });
chmodSync(dir, 0o700);

const dumpPath = path.join(dir, `cforge-${stamp}.dump`);
const sumPath = `${dumpPath}.sha256`;

const env = { ...process.env };
delete env.DATABASE_URL;
delete env.ADMIN_DATABASE_URL;

const dumped = spawnSync(
  pgDump,
  [
    "--format=custom",
    "--no-password",
    "--dbname=cforge",
    `--host=${target.host}`,
    `--port=${target.port}`,
    `--username=${admin.user}`,
    `--file=${dumpPath}`,
  ],
  { env, encoding: "utf8" },
);

if (dumped.status !== 0) {
  try {
    unlinkSync(dumpPath);
  } catch {
    /* ignore missing partial */
  }
  const err = (dumped.stderr || dumped.stdout || "pg_dump failed").replace(/postgres:\/\/\S+/g, "[redacted]");
  console.error(err.trim() || "pg_dump failed");
  process.exit(dumped.status ?? 1);
}

let stat;
try {
  stat = statSync(dumpPath);
} catch {
  console.error("pg_dump did not write a backup file");
  process.exit(1);
}
if (stat.size < 1) {
  try {
    unlinkSync(dumpPath);
  } catch {
    /* ignore */
  }
  console.error("backup file is empty");
  process.exit(1);
}
chmodSync(dumpPath, 0o600);

const digest = createHash("sha256").update(readFileSync(dumpPath)).digest("hex");
writeFileSync(sumPath, `${digest}  ${path.basename(dumpPath)}\n`, { mode: 0o600 });
chmodSync(sumPath, 0o600);

const verify = createHash("sha256").update(readFileSync(dumpPath)).digest("hex");
if (verify !== digest) {
  console.error("checksum verification failed");
  process.exit(1);
}

console.log(`backup_ok file=${path.basename(dumpPath)} bytes=${stat.size} sha256=${digest} dir=${dir}`);
