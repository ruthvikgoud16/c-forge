export function isJudgeUnavailable(error: unknown) {
  const code = error instanceof Error ? (error as Error & { code?: string }).code : "";
  return code === "JUDGE_UNAVAILABLE" || code === "JUDGE_QUEUE_FULL" || code === "JUDGE_DISABLED_UNVERIFIED_ISOLATION";
}
