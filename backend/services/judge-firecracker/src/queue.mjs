import { LIMITS } from "./limits.mjs";

export function createAdmissionQueue(limits = LIMITS) {
  let jobs = 0;
  let compiles = 0;
  let runs = 0;

  return {
    snapshot() {
      return { jobs, compiles, runs, maxJobs: limits.maxConcurrentJobs };
    },
    tryAdmitJob() {
      if (jobs >= limits.maxConcurrentJobs) return false;
      jobs += 1;
      return true;
    },
    releaseJob() {
      jobs = Math.max(0, jobs - 1);
    },
    async withCompile(fn) {
      if (compiles >= limits.maxConcurrentCompiles) {
        const error = new Error("compile_queue_full");
        error.code = "queue_full";
        throw error;
      }
      compiles += 1;
      try {
        return await fn();
      } finally {
        compiles -= 1;
      }
    },
    async withRun(fn) {
      if (runs >= limits.maxConcurrentRuns) {
        const error = new Error("run_queue_full");
        error.code = "queue_full";
        throw error;
      }
      runs += 1;
      try {
        return await fn();
      } finally {
        runs -= 1;
      }
    },
  };
}
