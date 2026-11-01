import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_HEADERS = new Set([
  "assert.h",
  "ctype.h",
  "errno.h",
  "limits.h",
  "math.h",
  "stdbool.h",
  "stddef.h",
  "stdint.h",
  "stdio.h",
  "stdlib.h",
  "string.h",
  "time.h",
]);

export function assertSafeSource(source) {
  if (typeof source !== "string" || source.length === 0) {
    throw Object.assign(new Error("source_required"), { code: "blocked_source" });
  }
  if (source.length > 100_000) {
    throw Object.assign(new Error("source too large"), { code: "blocked_source" });
  }
  const include = /^\s*#\s*include\s*([<"])([^>"]+)[>"]/gm;
  let match;
  while ((match = include.exec(source))) {
    const path = match[2];
    if (path.includes("..") || path.startsWith("/") || path.includes("\\") || path.includes(":")) {
      throw Object.assign(new Error("blocked include"), { code: "blocked_source" });
    }
    if (match[1] === "<" && !ALLOWED_HEADERS.has(path)) {
      throw Object.assign(new Error("blocked include"), { code: "blocked_source" });
    }
    if (match[1] === '"' && (path.includes("/") || !path.endsWith(".h"))) {
      throw Object.assign(new Error("blocked include"), { code: "blocked_source" });
    }
  }
}

function confinePath() {
  return process.env.JUDGE_CONFINE || "/opt/judge/bin/confine";
}

function requireConfine() {
  return process.env.JUDGE_REQUIRE_CONFINE === "1" || existsSync("/.dockerenv");
}

function workspaceRoot() {
  return process.env.JUDGE_WORKSPACE || join(tmpdir(), "cforge-runs");
}

function compilerEnv(workspace) {
  return {
    PATH: "/usr/local/bin:/usr/bin:/bin",
    HOME: workspace,
    LANG: "C",
    LC_ALL: "C",
    TMPDIR: workspace,
  };
}

function killTree(child) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

function runCommand(command, args, { cwd, input, timeoutMs, outputLimit, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputExceeded = false;
    let settled = false;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      killTree(child);
      resolve(payload);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeoutMs);

    const onChunk = (dest, chunk) => {
      const next = dest + chunk.toString("utf8");
      if (next.length > outputLimit) {
        outputExceeded = true;
        killTree(child);
        return next.slice(0, outputLimit);
      }
      return next;
    };

    child.stdout.on("data", (chunk) => {
      stdout = onChunk(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = onChunk(stderr, chunk);
    });

    child.on("error", (error) => {
      finish({
        exitCode: -1,
        stdout,
        stderr: `${stderr}\n${error.message}`,
        timedOut: false,
        outputExceeded,
      });
    });

    child.on("close", (code, signal) => {
      finish({
        exitCode: code ?? -1,
        signal,
        stdout,
        stderr,
        timedOut,
        outputExceeded,
      });
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

export async function sweepWorkspaces() {
  const root = workspaceRoot();
  try {
    const names = await readdir(root);
    await Promise.all(names.map((name) => rm(join(root, name), { recursive: true, force: true })));
  } catch {
    /* root may not exist yet */
  }
}

export async function isolateExecute({
  source,
  stdin = "",
  timeLimitMs = Number(process.env.JUDGE_TIME_LIMIT_MS ?? 2000),
  outputLimit = Number(process.env.JUDGE_OUTPUT_LIMIT_BYTES ?? 65536),
}) {
  const configured = Number(process.env.JUDGE_TIME_LIMIT_MS ?? 2000);
  const maxMs = Number.isFinite(configured) && configured > 0 ? configured : 2000;
  const limitMs = Math.min(maxMs, Math.max(200, Number(timeLimitMs) || maxMs));
  const memoryMb = Math.min(256, Math.max(8, Number(process.env.JUDGE_MEMORY_LIMIT_MB ?? 64)));
  const cpuSec = Math.max(1, Math.ceil(limitMs / 1000));
  const useStatic = process.env.JUDGE_STATIC === "1";
  const runner = confinePath();
  const confined = existsSync(runner);

  if (requireConfine() && !confined) {
    return {
      status: "internal_error",
      stdout: "",
      stderr: "",
      compiler: "",
      exitCode: -1,
    };
  }

  try {
    assertSafeSource(source);
  } catch {
    return {
      status: "compile_error",
      stdout: "",
      stderr: "blocked include",
      compiler: "blocked include",
      exitCode: 1,
    };
  }

  const root = workspaceRoot();
  await mkdir(root, { recursive: true, mode: 0o700 });
  const workspace = await mkdtemp(join(root, `${randomUUID()}-`));
  const sourcePath = join(workspace, "main.c");
  const binaryPath = join(workspace, "main");

  try {
    await writeFile(sourcePath, source, { encoding: "utf8", mode: 0o600 });

    const gccArgs = ["-std=c11", "-O0", "-pipe", "-o", binaryPath, sourcePath];
    if (useStatic) gccArgs.splice(3, 0, "-static");

    const compiled = await runCommand("gcc", gccArgs, {
      cwd: workspace,
      timeoutMs: limitMs,
      outputLimit,
      env: compilerEnv(workspace),
    });

    if (compiled.timedOut) {
      return {
        status: "timeout",
        stdout: "",
        stderr: compiled.stderr,
        compiler: compiled.stderr,
        exitCode: compiled.exitCode,
      };
    }

    if (compiled.exitCode !== 0) {
      return {
        status: "compile_error",
        stdout: "",
        stderr: compiled.stderr,
        compiler: compiled.stderr,
        exitCode: compiled.exitCode,
      };
    }

    const runArgs = confined
      ? [
          runner,
          "--workspace",
          workspace,
          "--as-mb",
          String(memoryMb),
          "--cpu-sec",
          String(cpuSec),
          "--fsize-mb",
          "4",
          "--",
          binaryPath,
        ]
      : [binaryPath];

    const ran = await runCommand(runArgs[0], runArgs.slice(1), {
      cwd: workspace,
      input: stdin,
      timeoutMs: limitMs,
      outputLimit,
      env: confined
        ? compilerEnv(workspace)
        : { PATH: "/usr/local/bin:/usr/bin:/bin", HOME: workspace, LANG: "C" },
    });

    if (confined && ran.exitCode === 125) {
      return {
        status: "internal_error",
        stdout: "",
        stderr: "",
        compiler: "",
        exitCode: 125,
      };
    }

    if (ran.timedOut) {
      return {
        status: "timeout",
        stdout: ran.stdout,
        stderr: ran.stderr,
        compiler: "",
        exitCode: ran.exitCode,
      };
    }

    if (ran.outputExceeded) {
      return {
        status: "runtime_error",
        stdout: ran.stdout,
        stderr: `${ran.stderr}\noutput limit exceeded`,
        compiler: "",
        exitCode: ran.exitCode,
      };
    }

    if (ran.exitCode !== 0) {
      return {
        status: "runtime_error",
        stdout: ran.stdout,
        stderr: ran.stderr,
        compiler: "",
        exitCode: ran.exitCode,
      };
    }

    return {
      status: "ok",
      stdout: ran.stdout,
      stderr: ran.stderr,
      compiler: "",
      exitCode: 0,
    };
  } finally {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await rm(workspace, { recursive: true, force: true });
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  }
}

export async function workspaceExists(id) {
  try {
    await access(join(workspaceRoot(), id));
    return true;
  } catch {
    return false;
  }
}

export function workspaceBasename(path) {
  return basename(path);
}
