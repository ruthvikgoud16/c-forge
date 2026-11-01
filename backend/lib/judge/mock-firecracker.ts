import { randomUUID, timingSafeEqual } from "node:crypto";
import { assertSafeSource } from "@/lib/judge/source-guard";
import {
  FIRECRACKER_LIMITS,
  assertNoAnswerKeyInGuestPayload,
  boundText,
  type FirecrackerDestroyRequest,
  type FirecrackerDestroyResult,
  type FirecrackerJobCreateRequest,
  type FirecrackerJobCreateResult,
  type FirecrackerRunRequest,
  type FirecrackerRunResult,
} from "./firecracker-contract";
import type { FirecrackerJudgePort } from "./firecracker-port";

type Job = {
  jobId: string;
  vmId: string;
  ownerId: string;
  source: string;
  compileCount: number;
  runCount: number;
  createdAt: number;
  destroyed: boolean;
};

function secretsEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type MockFirecrackerOptions = {
  secret: string;
  maxJobs?: number;
  jobTtlMs?: number;
  now?: () => number;
};

/**
 * In-process stand-in for the future Linux/KVM supervisor.
 * Does not boot Firecracker and does not prove isolation.
 */
export class MockFirecrackerHost implements FirecrackerJudgePort {
  readonly kind = "mock" as const;
  readonly guestNetwork = FIRECRACKER_LIMITS.guestNetwork;
  readonly guestTransport = FIRECRACKER_LIMITS.guestTransport;
  private readonly jobs = new Map<string, Job>();
  private readonly secret: string;
  private readonly maxJobs: number;
  private readonly jobTtlMs: number;
  private readonly now: () => number;

  constructor(options: MockFirecrackerOptions) {
    this.secret = options.secret;
    this.maxJobs = options.maxJobs ?? FIRECRACKER_LIMITS.maxConcurrentJobs;
    this.jobTtlMs = options.jobTtlMs ?? FIRECRACKER_LIMITS.jobTtlMs;
    this.now = options.now ?? Date.now;
  }

  activeJobs() {
    this.sweep();
    return [...this.jobs.values()].filter((job) => !job.destroyed).length;
  }

  job(jobId: string) {
    return this.jobs.get(jobId);
  }

  async createJob(auth: string, request: FirecrackerJobCreateRequest): Promise<FirecrackerJobCreateResult> {
    if (!this.authorized(auth)) return { status: "unauthorized" };
    try {
      assertNoAnswerKeyInGuestPayload(request);
    } catch (error) {
      return { status: "invalid", error: error instanceof Error ? error.message : "invalid" };
    }
    if (!request.ownerId || request.language !== "c11") {
      return { status: "invalid", error: "owner and c11 required" };
    }
    if (typeof request.source !== "string" || request.source.length === 0) {
      return { status: "invalid", error: "source_required" };
    }
    if (request.source.length > FIRECRACKER_LIMITS.sourceBytes) {
      return { status: "invalid", error: "source too large" };
    }
    this.sweep();
    if (this.activeJobs() >= this.maxJobs) {
      return { status: "queue_full", retryAfterSec: 2 };
    }
    try {
      assertSafeSource(request.source);
    } catch {
      const jobId = randomUUID();
      return { status: "compile_error", jobId, compiler: "blocked include" };
    }
    if (!/\bint\s+main\s*\(/.test(request.source) || request.source.includes("__COMPILE_FAIL__")) {
      const jobId = randomUUID();
      return { status: "compile_error", jobId, compiler: "compile_error" };
    }

    const job: Job = {
      jobId: randomUUID(),
      vmId: `vm-${randomUUID()}`,
      ownerId: request.ownerId,
      source: request.source,
      compileCount: 1,
      runCount: 0,
      createdAt: this.now(),
      destroyed: false,
    };
    this.jobs.set(job.jobId, job);
    return { status: "ready", jobId: job.jobId, vmId: job.vmId };
  }

  async runJob(auth: string, request: FirecrackerRunRequest): Promise<FirecrackerRunResult> {
    if (!this.authorized(auth)) return { status: "unauthorized", stdout: "", stderr: "" };
    try {
      assertNoAnswerKeyInGuestPayload(request);
    } catch {
      return { status: "invalid", stdout: "", stderr: "answer key rejected" };
    }
    if (typeof request.stdin !== "string") {
      return { status: "invalid", stdout: "", stderr: "stdin required" };
    }
    if (Buffer.byteLength(request.stdin, "utf8") > FIRECRACKER_LIMITS.stdinBytes) {
      return { status: "invalid", stdout: "", stderr: "stdin too large" };
    }
    const job = this.requireJob(request.jobId, request.ownerId);
    if (job === "unauthorized") return { status: "unauthorized", stdout: "", stderr: "" };
    if (job === "not_found") return { status: "not_found", stdout: "", stderr: "" };
    if (job === "forbidden") return { status: "forbidden", stdout: "", stderr: "" };
    if (job === "expired") return { status: "expired", stdout: "", stderr: "" };

    job.runCount += 1;
    if (job.source.includes("__TIMEOUT__")) {
      return { status: "timeout", stdout: "", stderr: "timeout", exitCode: -1 };
    }
    if (job.source.includes("__CRASH__")) {
      return { status: "runtime_error", stdout: "", stderr: "abort", exitCode: 1 };
    }
    let stdout = job.source.includes("__FLOOD__") ? "x".repeat(FIRECRACKER_LIMITS.stdoutBytes + 4096) : `out:${request.stdin}`;
    stdout = boundText(stdout, FIRECRACKER_LIMITS.stdoutBytes);
    return { status: "ok", stdout, stderr: "", exitCode: 0 };
  }

  async destroyJob(auth: string, request: FirecrackerDestroyRequest): Promise<FirecrackerDestroyResult> {
    if (!this.authorized(auth)) return { status: "unauthorized" };
    const job = this.jobs.get(request.jobId);
    if (!job || job.destroyed) return { status: "not_found" };
    if (job.ownerId !== request.ownerId) return { status: "forbidden" };
    job.destroyed = true;
    this.jobs.delete(request.jobId);
    return { status: "destroyed" };
  }

  private authorized(auth: string) {
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    return Boolean(token && this.secret && secretsEqual(token, this.secret));
  }

  private sweep() {
    const now = this.now();
    for (const [id, job] of this.jobs) {
      if (job.destroyed || now - job.createdAt > this.jobTtlMs) {
        this.jobs.delete(id);
      }
    }
  }

  private requireJob(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.destroyed) {
      this.sweep();
      return "not_found" as const;
    }
    if (this.now() - job.createdAt > this.jobTtlMs) {
      this.jobs.delete(jobId);
      return "expired" as const;
    }
    if (job.ownerId !== ownerId) return "forbidden" as const;
    this.sweep();
    return job;
  }
}
