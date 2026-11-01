import { readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { defaultPaths } from "./preflight.mjs";
import { logEvent } from "./log.mjs";

export async function recoverStale(paths = defaultPaths()) {
  const removed = [];
  if (existsSync(paths.jailBase)) {
    const entries = await readdir(paths.jailBase).catch(() => []);
    for (const id of entries) {
      spawnSync("pkill", ["-9", "-f", `jailer.*${id}`], { stdio: "ignore" });
      await rm(join(paths.jailBase, id), { recursive: true, force: true });
      removed.push(id);
    }
  }
  if (existsSync("/sys/fs/cgroup/cforge-jobs")) {
    const groups = await readdir("/sys/fs/cgroup/cforge-jobs").catch(() => []);
    for (const id of groups) {
      await rm(join("/sys/fs/cgroup/cforge-jobs", id), { recursive: true, force: true }).catch(() => undefined);
    }
  }
  logEvent("stale_recovered", { count: removed.length });
  return removed;
}
