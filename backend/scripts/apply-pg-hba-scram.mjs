import { chmodSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import postgres from "postgres";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const adminUser = os.userInfo().username;
const admin = postgres(
  `postgres://${encodeURIComponent(adminUser)}@127.0.0.1:5432/postgres`,
  { max: 1, onnotice: () => undefined },
);

try {
  const who = await admin`SELECT current_user AS usr, rolsuper FROM pg_roles WHERE rolname = current_user`;
  if (!who[0]?.rolsuper) {
    console.error("apply-pg-hba-scram must run as a superuser");
    process.exit(1);
  }
  const files = await admin`
    SELECT name, setting FROM pg_settings WHERE name IN ('hba_file', 'password_encryption')
  `;
  const hbaPath = files.find((row) => row.name === "hba_file")?.setting;
  const encryption = files.find((row) => row.name === "password_encryption")?.setting;
  if (!hbaPath) {
    console.error("hba_file is unknown");
    process.exit(1);
  }
  if (encryption !== "scram-sha-256") {
    await admin.unsafe("ALTER SYSTEM SET password_encryption = 'scram-sha-256'");
    console.log("password_encryption_set=scram-sha-256");
  } else {
    console.log("password_encryption=scram-sha-256");
  }

  const backupDir = process.env.CFORGE_BACKUP_DIR || path.join(os.homedir(), ".cforge");
  mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  chmodSync(backupDir, 0o700);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const backupPath = path.join(backupDir, `pg_hba.conf.${stamp}.pre-2f83`);
  copyFileSync(hbaPath, backupPath);
  chmodSync(backupPath, 0o600);
  console.log(`hba_backup=${path.basename(backupPath)}`);

  const template = readFileSync(new URL("../db/pg_hba.cforge.conf", import.meta.url), "utf8");
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(adminUser)) {
    console.error("administrator role name is not a safe identifier");
    process.exit(1);
  }
  const rendered = template.replaceAll("__ADMIN__", adminUser);
  writeFileSync(hbaPath, `${rendered}\n`, { mode: 0o600 });
  const reloaded = await admin`SELECT pg_reload_conf() AS ok`;
  if (!reloaded[0]?.ok) {
    console.error("pg_reload_conf failed");
    process.exit(1);
  }
  console.log("pg_reload_conf=true");
} finally {
  await admin.end({ timeout: 3 });
}
