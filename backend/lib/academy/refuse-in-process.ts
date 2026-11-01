export function refuseInProcessCompile(): never {
  throw new Error("Academy must not compile or execute student C in-process. Use JUDGE_URL.");
}

export function assertNotGccBinary(command: string) {
  const base = command.split(/[/\\]/).pop()?.toLowerCase() ?? "";
  if (base === "gcc" || base === "cc" || base === "clang") {
    refuseInProcessCompile();
  }
}
