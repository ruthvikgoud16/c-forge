import http from "node:http";
import { closeSync, readFileSync } from "node:fs";
import { isolateExecute, sweepWorkspaces } from "./isolate.mjs";

const PORT = Number(process.env.JUDGE_PORT ?? 7080);
const BIND = process.env.JUDGE_BIND || "127.0.0.1";

function loadSecret() {
  const fromEnv = process.env.JUDGE_SECRET;
  if (fromEnv) {
    delete process.env.JUDGE_SECRET;
    return fromEnv;
  }
  const fd = Number(process.env.JUDGE_SECRET_FD ?? "");
  if (!Number.isInteger(fd) || fd < 3) return "";
  try {
    const value = readFileSync(`/dev/fd/${fd}`, "utf8").replace(/\n$/, "");
    try {
      closeSync(fd);
    } catch {
      /* already closed */
    }
    delete process.env.JUDGE_SECRET_FD;
    return value;
  } catch {
    return "";
  }
}

const SECRET = loadSecret();

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
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function publicResult(result) {
  if (result.status === "internal_error") {
    return { status: "internal_error", stdout: "", stderr: "", compiler: "", exitCode: result.exitCode };
  }
  return result;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    send(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST" || req.url !== "/execute") {
    send(res, 404, { error: "not_found" });
    return;
  }

  if (!SECRET || req.headers.authorization !== `Bearer ${SECRET}`) {
    send(res, 401, { error: "unauthorized" });
    return;
  }

  try {
    const body = JSON.parse(await readBody(req));
    if (typeof body.source !== "string" || body.source.length === 0) {
      send(res, 400, { error: "source_required" });
      return;
    }
    const configured = Number(process.env.JUDGE_TIME_LIMIT_MS ?? 2000);
    const requested = Number(body.timeLimitMs ?? configured);
    const timeLimitMs = Math.min(configured, Math.max(200, Number.isFinite(requested) ? requested : configured));
    const result = await isolateExecute({
      source: body.source,
      stdin: typeof body.stdin === "string" ? body.stdin : "",
      timeLimitMs,
    });
    send(res, 200, publicResult(result));
  } catch {
    send(res, 500, { status: "internal_error", error: "judge_failed" });
  }
});

await sweepWorkspaces();
server.listen(PORT, BIND, () => {
  console.log(`cforge-judge listening on ${BIND}:${PORT}`);
});
