import http from "node:http";
import { authorized, loadSecret } from "./auth.mjs";
import { inspectHost } from "./preflight.mjs";
import { createFirecrackerDriver } from "./host.mjs";
import { createJobSupervisor } from "./jobs.mjs";
import { recoverStale } from "./cleanup.mjs";
import { logEvent } from "./log.mjs";
import { LIMITS } from "./limits.mjs";

const PORT = Number(process.env.JUDGE_PORT ?? 7081);
const BIND = process.env.JUDGE_BIND || "127.0.0.1";
const SECRET = loadSecret();
const preflight = inspectHost();

function createDriver() {
  if (process.env.CFORGE_FC_DRIVER === "loopback") {
    throw new Error("loopback driver is test-only; refuse in the service process");
  }
  return createFirecrackerDriver();
}

const supervisor = createJobSupervisor(createDriver());

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 200_000) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function jobPath(url) {
  const match = /^\/v1\/jobs\/([^/]+)(?:\/(run|stdin))?$/.exec(url ?? "");
  if (!match) return null;
  return { jobId: match[1], action: match[2] ?? "delete" };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/health" || req.url === "/ready")) {
    const info = inspectHost();
    send(res, info.ready ? 200 : 503, {
      ok: info.ready,
      backend: "firecracker",
      versionPin: info.versionPin,
      reason: info.reason,
      kvm: info.kvm,
      jailer: info.jailer,
      isolationVerified: false,
    });
    return;
  }

  if (!authorized(req.headers.authorization ?? "", SECRET)) {
    send(res, 401, { status: "unauthorized", error: "unauthorized" });
    return;
  }

  try {
    if (req.method === "POST" && req.url === "/v1/jobs") {
      const body = JSON.parse(await readBody(req));
      const result = await supervisor.createJob(body);
      const status = result.status === "queue_full" ? 429 : result.status === "invalid" ? 400 : 200;
      send(res, status, result);
      return;
    }
    const parsed = jobPath(req.url);
    if (req.method === "POST" && parsed && (parsed.action === "run" || parsed.action === "stdin")) {
      const body = JSON.parse(await readBody(req));
      const result = await supervisor.runJob({
        jobId: parsed.jobId,
        ownerId: body.ownerId,
        stdin: body.stdin,
      });
      send(res, 200, result);
      return;
    }
    if (req.method === "DELETE" && parsed) {
      const body = JSON.parse((await readBody(req)) || "{}");
      const result = await supervisor.destroyJob({ jobId: parsed.jobId, ownerId: body.ownerId });
      const status = result.status === "not_found" ? 404 : result.status === "forbidden" ? 403 : 200;
      send(res, status, result);
      return;
    }
    send(res, 404, { error: "not_found" });
  } catch {
    send(res, 500, { error: "judge_failed" });
  }
});

process.on("SIGTERM", async () => {
  await supervisor.destroyAll();
  server.close();
});

if (process.argv[1] && process.argv[1].endsWith("server.mjs")) {
  await recoverStale().catch(() => undefined);
  logEvent("listen", { bind: BIND, port: PORT, ready: preflight.ready, reason: preflight.reason, maxJobs: LIMITS.maxConcurrentJobs });
  server.listen(PORT, BIND, () => {
    logEvent("listening", { bind: BIND, port: PORT });
  });
}

export { server, supervisor, preflight };
