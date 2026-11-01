import os from "node:os";
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { loadEnvLocal } from "./load-env-local.mjs";
import { parseDatabaseUrl } from "./migrate-engine.mjs";

loadEnvLocal();

const dbName = process.env.PROVISION_DATABASE || "cforge";
if (dbName !== "cforge" && !dbName.startsWith("cforge_restore_")) {
  console.error("provision database must be cforge or a restore-verify name");
  process.exit(1);
}

const sqlText = await readFile(new URL("../db/provision-roles.sql", import.meta.url), "utf8");
const transferText = await readFile(new URL("../db/transfer-ownership.sql", import.meta.url), "utf8");
const adminUrl =
  process.env.ADMIN_DATABASE_URL ||
  `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:5432/${dbName}`;

const parsed = parseDatabaseUrl(adminUrl);
if (parsed.database !== dbName) {
  console.error("provision-roles database mismatch");
  process.exit(1);
}
if (parsed.host !== "127.0.0.1" && parsed.host !== "localhost" && parsed.host !== "::1") {
  console.error("provision-roles must target localhost");
  process.exit(1);
}
if (["cforge", "cforge_app", "cforge_faculty", "cforge_migrator"].includes(parsed.user)) {
  console.error("provision-roles must use the instance administrator");
  process.exit(1);
}

const sql = postgres(adminUrl, { max: 1, onnotice: () => undefined });
try {
  const who = await sql`SELECT current_user AS usr, rolsuper, rolcreaterole, rolbypassrls
    FROM pg_roles WHERE rolname = current_user`;
  const me = who[0];
  if (!me?.rolsuper && !me?.rolcreaterole) {
    console.error("current role cannot CREATE ROLE");
    process.exit(1);
  }
  await sql.unsafe(sqlText);
  if (process.env.TRANSFER_OWNERSHIP === "1") {
    if (!me.rolsuper) {
      console.error("TRANSFER_OWNERSHIP requires superuser");
      process.exit(1);
    }
    await sql.unsafe(transferText);
    console.log("ownership_transferred=true");
  } else {
    console.log("ownership_transferred=false");
  }

  async function setPassword(role, envName, label) {
    const pass = process.env[envName];
    if (!pass) {
      console.log(`${label}=false`);
      return;
    }
    const cmd = await sql`SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', ${role}::text, ${pass}::text) AS stmt`;
    await sql.unsafe(cmd[0].stmt);
    console.log(`${label}=true`);
  }
  await setPassword("cforge_faculty", "FACULTY_DB_PASSWORD", "faculty_db_password_set");
  await setPassword("cforge_app", "APP_DB_PASSWORD", "app_db_password_set");
  await setPassword("cforge_migrator", "MIGRATOR_DB_PASSWORD", "migrator_db_password_set");

  const roles = await sql`
    SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
    FROM pg_roles
    WHERE rolname IN (
      'cforge', 'cforge_app', 'cforge_student', 'cforge_faculty',
      'cforge_owner', 'cforge_migrator'
    )
    ORDER BY rolname
  `;
  for (const row of roles) {
    console.log(
      `role ${row.rolname} login=${row.rolcanlogin} super=${row.rolsuper} bypassrls=${row.rolbypassrls}`,
    );
  }
  console.log(`provisioned as ${me.usr} db=${parsed.database}`);
} finally {
  await sql.end({ timeout: 5 });
}
