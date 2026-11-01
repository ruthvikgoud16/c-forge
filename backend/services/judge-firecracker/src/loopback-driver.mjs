/**
 * Protocol-only driver for host unit tests.
 * Does not boot Firecracker and is not isolation evidence.
 */
import { createServer, createConnection } from "node:net";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { LIMITS } from "./limits.mjs";
import { decodeFrames, encodeFrame, OP } from "./protocol.mjs";

function compileSource(source, work) {
  return new Promise((resolve) => {
    const gcc = spawn("gcc", ["-std=c11", "-O0", "-o", join(work, "main"), join(work, "main.c")], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let compiler = "";
    gcc.stderr.on("data", (chunk) => {
      compiler += chunk.toString("utf8");
    });
    const timer = setTimeout(() => {
      gcc.kill("SIGKILL");
      resolve({ op: OP.compiled, ok: false, compiler: "timeout" });
    }, LIMITS.compileWallMs);
    gcc.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? { op: OP.compiled, ok: true } : { op: OP.compiled, ok: false, compiler: compiler.slice(0, 4096) });
    });
    gcc.on("error", () => {
      clearTimeout(timer);
      resolve({ op: OP.compiled, ok: false, compiler: "gcc_unavailable" });
    });
  });
}

function runBinary(work, stdin) {
  return new Promise((resolve) => {
    const child = spawn(join(work, "main"), [], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      if (stdout.length < LIMITS.stdoutBytes) stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      if (stderr.length < LIMITS.stderrBytes) stderr += chunk.toString("utf8");
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ op: OP.result, status: "timeout", stdout: stdout.slice(0, LIMITS.stdoutBytes), stderr: "timeout", exitCode: -1 });
    }, LIMITS.executeWallMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        op: OP.result,
        status: code === 0 ? "ok" : "runtime_error",
        stdout: stdout.slice(0, LIMITS.stdoutBytes),
        stderr: stderr.slice(0, LIMITS.stderrBytes),
        exitCode: code ?? 1,
      });
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve({ op: OP.result, status: "runtime_error", stdout: "", stderr: "exec_failed", exitCode: 1 });
    });
    child.stdin.end(stdin ?? "");
  });
}

export function createLoopbackDriver(baseDir = join(process.cwd(), ".tmp-cforge-fc-loopback")) {
  const sessions = new Map();

  async function startVm(identity) {
    const work = join(baseDir, identity.vmId);
    await mkdir(work, { recursive: true });
    let compiled = false;
    const server = createServer((socket) => {
      let buf = Buffer.alloc(0);
      socket.on("data", async (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        const { messages, rest } = decodeFrames(buf);
        buf = rest;
        for (const message of messages) {
          if (message.op === OP.compile) {
            if (compiled) {
              socket.write(encodeFrame({ op: OP.compiled, ok: false, compiler: "already_compiled" }));
              continue;
            }
            await writeFile(join(work, "main.c"), message.source);
            const reply = await compileSource(message.source, work);
            compiled = reply.ok === true;
            socket.write(encodeFrame(reply));
          } else if (message.op === OP.run) {
            if (!compiled) {
              socket.write(encodeFrame({ op: OP.result, status: "runtime_error", stdout: "", stderr: "not_compiled", exitCode: 1 }));
              continue;
            }
            socket.write(encodeFrame(await runBinary(work, message.stdin)));
          } else if (message.op === OP.shutdown) {
            socket.write(encodeFrame({ op: OP.result, status: "ok", stdout: "", stderr: "" }));
            socket.end();
          }
        }
      });
    });
    const port = await new Promise((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (!addr || typeof addr === "string") reject(new Error("no port"));
        else resolve(addr.port);
      });
      server.on("error", reject);
    });
    const session = { hostVsock: port, server, work, compiled: () => compiled };
    sessions.set(identity.jobId, session);
    return session;
  }

  async function compile(session, source) {
    return rpc(session.hostVsock, { op: OP.compile, language: "c11", source }, LIMITS.compileWallMs + 1000);
  }

  async function run(session, stdin) {
    return rpc(session.hostVsock, { op: OP.run, stdin }, LIMITS.executeWallMs + 1000);
  }

  async function destroy(identity, session) {
    session?.server?.close();
    if (identity?.vmId) await rm(join(baseDir, identity.vmId), { recursive: true, force: true });
    sessions.delete(identity?.jobId);
  }

  return { startVm, compile, run, destroy, kind: "loopback", isolationEvidence: false };
}

function rpc(port, message, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("loopback_timeout"));
    }, timeoutMs);
    socket.on("connect", () => socket.write(encodeFrame(message)));
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const { messages } = decodeFrames(buf);
      if (messages[0]) {
        clearTimeout(timer);
        socket.end();
        resolve(messages[0]);
      }
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
