import type { AcademyEnv } from "@/lib/academy/env";
import { HttpFirecrackerJudge } from "./http-firecracker";
import type { FirecrackerJudgePort } from "./firecracker-port";
import { MockFirecrackerHost } from "./mock-firecracker";

let testHost: FirecrackerJudgePort | null = null;

export function installFirecrackerPortForTests(port: FirecrackerJudgePort | null) {
  testHost = port;
}

export function firecrackerBackend(env: AcademyEnv) {
  return env.judgeBackend;
}

export function getFirecrackerJudge(env: AcademyEnv): FirecrackerJudgePort | null {
  if (testHost) return testHost;
  const backend = firecrackerBackend(env);
  if (backend === "mock") {
    if (!env.judgeSecret) return null;
    return new MockFirecrackerHost({ secret: env.judgeSecret });
  }
  if (backend === "firecracker") {
    if (!env.judgeUrl || !env.judgeSecret) return null;
    return new HttpFirecrackerJudge(env.judgeUrl);
  }
  return null;
}

export function bearerFor(env: AcademyEnv) {
  return `Bearer ${env.judgeSecret ?? ""}`;
}
