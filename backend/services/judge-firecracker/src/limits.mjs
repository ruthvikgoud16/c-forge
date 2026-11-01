export const LIMITS = {
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
  maxConcurrentJobs: 4,
  jobTtlMs: 30_000,
  bootWaitMs: 8_000,
  vsockPort: 5252,
  guestTransport: "vsock",
  guestNetwork: "none",
};

export function boundText(value, max) {
  const text = typeof value === "string" ? value : "";
  return text.length <= max ? text : text.slice(0, max);
}
