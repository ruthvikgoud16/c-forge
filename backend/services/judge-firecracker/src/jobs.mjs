import { randomUUID } from "node:crypto";
import { createAdmissionQueue } from "./queue.mjs";
import { createIdentityPool } from "./identity.mjs";
import { LIMITS, boundText } from "./limits.mjs";
import { logEvent } from "./log.mjs";
import { assertGuestSafe } from "./protocol.mjs";
import { assertSafeSource } from "../../judge/src/isolate.mjs";

export function createJobSupervisor(driver) {
  const queue = createAdmissionQueue();
  const identities = createIdentityPool();
  const jobs = new Map();

  function sweep() {
    const now = Date.now();
    for (const [id, job] of jobs) {
      if (now - job.createdAt > LIMITS.jobTtlMs) {
        void destroyInternal(job, "expired");
      }
    }
  }

  async function destroyInternal(job) {
    jobs.delete(job.jobId);
    queue.releaseJob();
    try {
      await driver.destroy(job.identity, job.session);
    } catch {
      /* continue */
    }
    identities.release(job.jobId);
    logEvent("job_destroyed", { jobId: job.jobId, vmId: job.identity?.vmId });
  }

  return {
    queue,
    jobs,
    async createJob(request) {
      sweep();
      try {
        assertGuestSafe(request);
      } catch (error) {
        return { status: "invalid", error: error instanceof Error ? error.message : "invalid" };
      }
      if (!request.ownerId || request.language !== "c11") {
        return { status: "invalid", error: "owner and c11 required" };
      }
      if (typeof request.source !== "string" || !request.source) {
        return { status: "invalid", error: "source_required" };
      }
      if (request.source.length > LIMITS.sourceBytes) {
        return { status: "invalid", error: "source too large" };
      }
      try {
        assertSafeSource(request.source);
      } catch {
        return { status: "compile_error", jobId: randomUUID(), compiler: "blocked include" };
      }
      if (!queue.tryAdmitJob()) {
        return { status: "queue_full", retryAfterSec: 2 };
      }
      const jobId = randomUUID();
      const identity = identities.allocate(jobId);
      if (!identity) {
        queue.releaseJob();
        return { status: "queue_full", retryAfterSec: 2 };
      }
      const job = {
        jobId,
        ownerId: request.ownerId,
        identity,
        session: null,
        compileCount: 0,
        runCount: 0,
        createdAt: Date.now(),
      };
      jobs.set(jobId, job);
      try {
        const compiled = await queue.withCompile(async () => {
          job.session = await driver.startVm(identity);
          const reply = await driver.compile(job.session, request.source);
          job.compileCount += 1;
          return reply;
        });
        if (!compiled?.ok) {
          const compiler = boundText(String(compiled?.compiler ?? "compile_error"), 4096);
          await destroyInternal(job);
          return { status: "compile_error", jobId, compiler };
        }
        logEvent("job_ready", { jobId, vmId: identity.vmId });
        return { status: "ready", jobId, vmId: `vm-${identity.vmId}` };
      } catch (error) {
        await destroyInternal(job);
        if (error?.code === "FIRECRACKER_HOST_UNAVAILABLE") {
          return { status: "invalid", error: "firecracker_host_unavailable" };
        }
        if (error?.code === "queue_full") {
          return { status: "queue_full", retryAfterSec: 2 };
        }
        return { status: "compile_error", jobId, compiler: "boot_or_compile_failed" };
      }
    },

    async runJob(request) {
      sweep();
      try {
        assertGuestSafe(request);
      } catch {
        return { status: "invalid", stdout: "", stderr: "answer key rejected" };
      }
      if (typeof request.stdin !== "string") {
        return { status: "invalid", stdout: "", stderr: "stdin required" };
      }
      if (Buffer.byteLength(request.stdin, "utf8") > LIMITS.stdinBytes) {
        return { status: "invalid", stdout: "", stderr: "stdin too large" };
      }
      const job = jobs.get(request.jobId);
      if (!job) return { status: "not_found", stdout: "", stderr: "" };
      if (Date.now() - job.createdAt > LIMITS.jobTtlMs) {
        await destroyInternal(job);
        return { status: "expired", stdout: "", stderr: "" };
      }
      if (job.ownerId !== request.ownerId) return { status: "forbidden", stdout: "", stderr: "" };
      try {
        const result = await queue.withRun(async () => {
          job.runCount += 1;
          return driver.run(job.session, request.stdin);
        });
        return {
          status: result.status ?? "runtime_error",
          stdout: boundText(result.stdout ?? "", LIMITS.stdoutBytes),
          stderr: boundText(result.stderr ?? "", LIMITS.stderrBytes),
          exitCode: result.exitCode,
        };
      } catch (error) {
        if (error?.code === "queue_full") {
          return { status: "invalid", stdout: "", stderr: "run_queue_full" };
        }
        return { status: "runtime_error", stdout: "", stderr: "run_failed", exitCode: 1 };
      }
    },

    async destroyJob(request) {
      const job = jobs.get(request.jobId);
      if (!job) return { status: "not_found" };
      if (job.ownerId !== request.ownerId) return { status: "forbidden" };
      await destroyInternal(job);
      return { status: "destroyed" };
    },

    async destroyAll() {
      await Promise.all([...jobs.values()].map((job) => destroyInternal(job)));
    },

    active() {
      sweep();
      return jobs.size;
    },
  };
}
