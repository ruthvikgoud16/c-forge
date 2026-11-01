/** Server-to-server Firecracker judge contract. Not a VM implementation. */

export const FIRECRACKER_LIMITS = {
  sourceBytes: 100_000,
  stdinBytes: 16_384,
  stdoutBytes: 65_536,
  stderrBytes: 65_536,
  compileWallMs: 4_000,
  compileCpuSec: 2,
  compileMemoryMiB: 192,
  compilePids: 32,
  executeWallMs: 2_000,
  executeCpuSec: 1,
  executeMemoryMiB: 64,
  executePids: 1,
  maxConcurrentCompiles: 2,
  maxConcurrentRuns: 4,
  jobTtlMs: 30_000,
  maxConcurrentJobs: 4,
  guestTransport: "vsock" as const,
  guestNetwork: "none" as const,
  vsockPort: 5252,
} as const;

export type FirecrackerLanguage = "c11";

export type FirecrackerJobCreateRequest = {
  source: string;
  language: FirecrackerLanguage;
  ownerId: string;
};

export type FirecrackerJobCreateResult =
  | { status: "ready"; jobId: string; vmId: string }
  | { status: "compile_error"; jobId: string; compiler: string }
  | { status: "queue_full"; retryAfterSec: number }
  | { status: "unauthorized" }
  | { status: "invalid"; error: string };

export type FirecrackerRunRequest = {
  jobId: string;
  ownerId: string;
  stdin: string;
};

export type FirecrackerRunResult = {
  status: "ok" | "runtime_error" | "timeout" | "expired" | "not_found" | "forbidden" | "unauthorized" | "invalid";
  stdout: string;
  stderr: string;
  exitCode?: number;
};

export type FirecrackerDestroyRequest = {
  jobId: string;
  ownerId: string;
};

export type FirecrackerDestroyResult = {
  status: "destroyed" | "not_found" | "forbidden" | "unauthorized";
};

const FORBIDDEN_GUEST_KEYS = [
  "expectedStdout",
  "expected_stdout",
  "expected",
  "answer",
  "answerKey",
  "hidden",
  "visibility",
];

export function assertNoAnswerKeyInGuestPayload(payload: unknown) {
  const text = JSON.stringify(payload);
  for (const key of FORBIDDEN_GUEST_KEYS) {
    if (new RegExp(`"${key}"\\s*:`).test(text)) {
      throw new Error("answer key must not enter the judge guest");
    }
  }
}

export function boundText(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

export function judgePrivateEndpoint(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    if (host === "judge") return true;
    if (host.endsWith(".internal") || host.endsWith(".local")) return true;
    if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}
