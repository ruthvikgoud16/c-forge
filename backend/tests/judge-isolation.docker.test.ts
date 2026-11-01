import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { loadEnv } from "@/lib/academy/env";
import { runExercise, submitExercise } from "@/lib/academy/execute";
import { helloCforge, addTwoIntegers } from "@/lib/academy/exercise-data";
import { REFERENCE_SOLUTIONS } from "@/lib/academy/exercise-solutions";
import { assertNoHiddenLeak } from "@/lib/academy/public-dto";
import { allJudgeExercises } from "@/lib/academy/exercise-bank";

const env = loadEnv(process.env);
const dockerJudge = Boolean(env.judgeUrl?.startsWith("http") && env.judgeSecret);

async function judgeExecute(source: string, stdin = "", timeLimitMs?: number) {
  const response = await fetch(`${env.judgeUrl!.replace(/\/$/, "")}/execute`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.judgeSecret}`,
    },
    body: JSON.stringify({ source, stdin, timeLimitMs }),
  });
  return (await response.json()) as {
    status: string;
    stdout: string;
    stderr: string;
    compiler: string;
  };
}

function leftoverStudentProcesses() {
  const listed = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "judge",
      "sh",
      "-c",
      'ps -eo args | grep -E "/opt/judge/bin/confine|/workspace/runs/.*/main" | grep -v grep | wc -l',
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return Number((listed.stdout || "0").trim());
}

function secretStillInPid1() {
  const probe = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "judge",
      "sh",
      "-c",
      'tr "\\0" "\\n" < /proc/1/environ | grep -c "^JUDGE_SECRET=" || true',
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return Number((probe.stdout || "0").trim());
}

describe.skipIf(!dockerJudge)("Docker judge isolation (2F.1D.1)", () => {
  it("accepts a normal valid submission", async () => {
    const result = await judgeExecute(REFERENCE_SOLUTIONS["hello-cforge"]);
    expect(result.status).toBe("ok");
    expect(result.stdout).toBe("Hello, CForge!\n");
  });

  it("times out an infinite loop and removes the workspace", async () => {
    const started = Date.now();
    const result = await judgeExecute("int main(void){for(;;){}}", "", 2000);
    expect(result.status).toBe("timeout");
    expect(Date.now() - started).toBeLessThan(8000);
    expect(leftoverStudentProcesses()).toBe(0);
    const again = await judgeExecute(REFERENCE_SOLUTIONS["hello-cforge"]);
    expect(again.status).toBe("ok");
  });

  it("stops excessive memory allocation", async () => {
    const result = await judgeExecute(`#include <stdlib.h>
#include <string.h>
int main(void){
  for(;;){
    char *p = malloc(16*1024*1024);
    if(!p) return 2;
    memset(p, 1, 16*1024*1024);
  }
}
`);
    expect(["runtime_error", "timeout"]).toContain(result.status);
    expect(result.status).not.toBe("ok");
  });

  it("blocks excessive process creation and keeps the judge healthy", async () => {
    const result = await judgeExecute(`#include <stdio.h>
#include <unistd.h>
int main(void){
  for(int i=0;i<1000;i++){
    int p = fork();
    if(p==0) continue;
    if(p<0){ puts("spawn_denied"); return 0; }
  }
  for(;;){}
}
`);
    expect(["compile_error", "runtime_error", "timeout", "ok"]).toContain(result.status);
    if (result.status === "ok") expect(result.stdout).toMatch(/spawn_denied/);
    if (result.status === "compile_error") expect(result.compiler).toMatch(/blocked include/);
    const health = await fetch(`${env.judgeUrl!.replace(/\/$/, "")}/health`);
    expect(health.ok).toBe(true);
    const hello = await judgeExecute(REFERENCE_SOLUTIONS["hello-cforge"]);
    expect(hello.status).toBe("ok");
  });

  it("denies network syscalls from submitted programs", async () => {
    const result = await judgeExecute(`#include <stdio.h>
int socket(int, int, int);
int main(void){
  int fd = socket(2, 1, 0);
  if(fd < 0){ puts("net_denied"); return 0; }
  puts("net_open");
  return 0;
}
`);
    expect(result.status).toBe("ok");
    expect(result.stdout).toBe("net_denied\n");
  });

  it("denies file access outside the submission workspace", async () => {
    const result = await judgeExecute(`#include <stdio.h>
int main(void){
  FILE *judge = fopen("/opt/judge/src/server.mjs","r");
  FILE *proc = fopen("/proc/1/environ","r");
  FILE *root = fopen("/workspace/runs","r");
  if(judge||proc||root){ puts("leaked"); return 0; }
  puts("denied");
  return 0;
}
`);
    expect(result.status).toBe("ok");
    expect(result.stdout).toBe("denied\n");
  });

  it("does not inherit judge secrets and does not echo them via includes", async () => {
    expect(secretStillInPid1()).toBe(0);
    const envProbe = await judgeExecute(`#include <stdio.h>
#include <stdlib.h>
int main(void){
  const char *s = getenv("JUDGE_SECRET");
  puts(s && s[0] ? "secret" : "empty");
  return 0;
}
`);
    expect(envProbe.status).toBe("ok");
    expect(envProbe.stdout).toBe("empty\n");
    expect(JSON.stringify(envProbe)).not.toContain(env.judgeSecret);

    const includeProbe = await judgeExecute('#include "/proc/1/environ"\nint main(void){return 0;}\n');
    expect(includeProbe.status).toBe("compile_error");
    expect(includeProbe.compiler).toBe("blocked include");
    expect(JSON.stringify(includeProbe)).not.toContain(env.judgeSecret);
  });

  it("runs concurrent submissions without mixing output or leftover files", async () => {
    const [a, b] = await Promise.all([
      judgeExecute(REFERENCE_SOLUTIONS["hello-cforge"]),
      judgeExecute(REFERENCE_SOLUTIONS["add-two-integers"], "2 3\n"),
    ]);
    expect(a.status).toBe("ok");
    expect(a.stdout).toBe("Hello, CForge!\n");
    expect(b.status).toBe("ok");
    expect(b.stdout).toBe("5\n");
    expect(leftoverStudentProcesses()).toBe(0);
  });

  it("keeps Run and Submit separate and hides hidden tests", async () => {
    const run = await runExercise(env, helloCforge, REFERENCE_SOLUTIONS["hello-cforge"], undefined);
    expect(run.mode).toBe("run");
    expect(run.status).toBe("ok");
    const submit = await submitExercise(env, addTwoIntegers, REFERENCE_SOLUTIONS["add-two-integers"]);
    assertNoHiddenLeak(submit);
    expect(submit.verdict).toBe("accepted");
    expect(submit.passed).toBe(4);
    expect(JSON.stringify(submit)).not.toContain("51 1");
  });

  it("still has twenty-two exercises and eighty-eight tests", () => {
    const rows = allJudgeExercises();
    expect(rows).toHaveLength(22);
    expect(rows.reduce((n, row) => n + row.tests.length, 0)).toBe(88);
  });
});
