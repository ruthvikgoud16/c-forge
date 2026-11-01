import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

/** Resolve pg_dump/pg_restore from PATH, then vendor "latest" symlink. No versioned path. */
export function resolvePgBin(name) {
  const which = spawnSync("which", [name], { encoding: "utf8" });
  if (which.status === 0) {
    const found = which.stdout.trim();
    if (found) return found;
  }
  const latest = path.join("/Applications/Postgres.app/Contents/Versions/latest/bin", name);
  if (existsSync(latest)) return latest;
  throw new Error(`${name} not found on PATH or Postgres.app latest/bin`);
}
