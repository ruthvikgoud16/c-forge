import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  EXERCISE_TOPIC_IDS,
  EXPAND_JUDGE_EXERCISES,
  NEW_JUDGE_EXERCISES,
  allJudgeExercises,
  exerciseIdForTopic,
  findJudgeExercise,
  topicIdForExercise,
} from "@/lib/academy/exercise-bank";
import { REFERENCE_SOLUTIONS } from "@/lib/academy/exercise-solutions";
import { ADD_TWO_ID, HELLO_CFORGE_ID } from "@/lib/academy/exercise-data";
import { fallbackExercise } from "@/lib/academy/db";
import { getStore, resetStore } from "@/lib/academy/store";
import { assertNoHiddenLeak, toPublicExercise } from "@/lib/academy/public-dto";
import { topicAvailability } from "@/lib/learning/resources";
import { hrefFor } from "@/lib/learning/resources";
import { loadEnv } from "@/lib/academy/env";
import { runExercise, submitExercise } from "@/lib/academy/execute";
import { isolateExecute } from "../services/judge/src/isolate.mjs";
import http from "node:http";

const gccProbe = spawnSync("gcc", ["-std=c11", "-x", "c", "-o", "/tmp/cforge-bank-probe", "-"], {
  input: "int main(void){return 0;}\n",
  encoding: "utf8",
});
const gccAvailable = gccProbe.status === 0;

const SOLUTIONS = REFERENCE_SOLUTIONS;

describe("judge exercise bank (2F.3)", () => {
  it("adds ten new exercises on top of the two starters", () => {
    expect(NEW_JUDGE_EXERCISES).toHaveLength(10);
    expect(EXPAND_JUDGE_EXERCISES).toHaveLength(10);
    expect(allJudgeExercises()).toHaveLength(22);
    const slugs = allJudgeExercises().map((e) => e.slug);
    expect(new Set(slugs).size).toBe(22);
    expect(slugs).toEqual(expect.arrayContaining(["hello-cforge", "add-two-integers", "echo-integer", "linear-search-index"]));
  });

  it("gives each new exercise a statement, I/O, constraints, sample, and hidden tests", () => {
    for (const row of [...NEW_JUDGE_EXERCISES, ...EXPAND_JUDGE_EXERCISES]) {
      expect(row.statement.length).toBeGreaterThan(40);
      expect(row.inputFormat.length).toBeGreaterThan(0);
      expect(row.outputFormat.length).toBeGreaterThan(0);
      expect(row.constraints.length).toBeGreaterThan(0);
      const sample = row.tests.filter((t) => t.visibility === "sample");
      const hidden = row.tests.filter((t) => t.visibility === "hidden");
      expect(sample.length).toBeGreaterThanOrEqual(1);
      expect(hidden.length).toBeGreaterThanOrEqual(2);
      expect(row.statement).not.toMatch(/this is an official lab|HackerRank|LeetCode|Codeforces/i);
    }
  });

  it("keeps hidden tests off the public DTO and lookup works by id or slug", () => {
    resetStore();
    for (const row of [...NEW_JUDGE_EXERCISES, ...EXPAND_JUDGE_EXERCISES]) {
      const dto = toPublicExercise(row);
      assertNoHiddenLeak(dto);
      expect(dto).not.toHaveProperty("tests");
      expect(JSON.stringify(dto)).not.toContain("visibility");
      const sample = row.tests.find((t) => t.visibility === "sample")!;
      expect(dto.sample.stdin).toBe(sample.stdin);
      expect(dto.sample.stdout).toBe(sample.expectedStdout);
      for (const hidden of row.tests.filter((t) => t.visibility === "hidden")) {
        expect(hidden.stdin !== sample.stdin || hidden.expectedStdout !== sample.expectedStdout).toBe(true);
      }
      expect(JSON.stringify(toPublicExercise(findJudgeExercise("linear-search-index")!))).not.toContain("1 2 3");
      expect(JSON.stringify(toPublicExercise(findJudgeExercise("binary-search-index")!))).not.toContain("1 1 1 1 1 2");
      expect(findJudgeExercise(row.id)?.slug).toBe(row.slug);
      expect(fallbackExercise(row.slug)?.id).toBe(row.id);
      expect(getStore().getExercise(row.slug)?.id).toBe(row.id);
    }
  });

  it("maps each bank exercise to one official teaching topic and never to a lab", () => {
    expect(topicIdForExercise(HELLO_CFORGE_ID)).toBe("u1-t5");
    expect(topicIdForExercise(ADD_TWO_ID)).toBe("u1-t4");
    const topics = Object.values(EXERCISE_TOPIC_IDS);
    expect(topics).toHaveLength(22);
    expect(new Set(topics).size).toBe(22);
    expect(topics.some((t) => t.endsWith("-t8") || t === "u2-t7" || t === "u3-t6" || t === "u4-t6" || t === "u5-t8")).toBe(
      false,
    );
    expect(exerciseIdForTopic("u3-t1")).toBe(findJudgeExercise("array-sum")?.id);
    expect(exerciseIdForTopic("u5-t2")).toBe(findJudgeExercise("binary-search-index")?.id);
    expect(exerciseIdForTopic("u5-t3")).toBe(findJudgeExercise("bubble-sort-asc")?.id);
    expect(topicAvailability("u5-t1").practice.exerciseId).toBe(findJudgeExercise("linear-search-index")?.id);
    expect(hrefFor("INDEPENDENT_PRACTICE", "u2-t2")).toMatch(/^\/studio\/33333333-/);
    expect(topicAvailability("u1-t8").practice.exerciseId).toBeUndefined();
    expect(topicAvailability("u5-t8").laboratory).toMatch(/UNAVAILABLE|UNVERIFIED/);
  });

  it("run uses sample stdin and submit reports pass counts without keys", async () => {
    const row = findJudgeExercise("echo-integer")!;
    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c as Buffer));
      req.on("end", () => {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { stdin: string };
        const expected = row.tests.find((t) => t.stdin === body.stdin)?.expectedStdout ?? "";
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok", stdout: expected, stderr: "", compiler: "" }));
      });
    });
    const url = await new Promise<string>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (!addr || typeof addr === "string") throw new Error("no port");
        resolve(`http://127.0.0.1:${addr.port}`);
      });
    });
    const env = loadEnv({
      NODE_ENV: "development",
      SESSION_SECRET: "dev-session",
      JUDGE_SECRET: "secret",
      JUDGE_URL: url,
    });
    try {
      const run = await runExercise(env, row, "src", undefined);
      expect(run.mode).toBe("run");
      expect(run.stdout).toBe("7\n");
      const submit = await submitExercise(env, row, "src");
      expect(submit.verdict).toBe("accepted");
      expect(submit.passed).toBe(4);
      expect(submit.total).toBe(4);
      assertNoHiddenLeak(submit);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});

describe.skipIf(!gccAvailable)("reference solutions compile on local gcc isolate", () => {
  it("accepted stdout matches every test of every new exercise", async () => {
    for (const row of [...NEW_JUDGE_EXERCISES, ...EXPAND_JUDGE_EXERCISES]) {
      const source = SOLUTIONS[row.slug];
      expect(source, row.slug).toBeTruthy();
      for (const test of row.tests) {
        const result = await isolateExecute({ source, stdin: test.stdin, timeLimitMs: 2000 });
        expect(result.status, `${row.slug} #${test.ordinal} ${result.stderr}`).toBe("ok");
        expect(result.stdout).toBe(test.expectedStdout);
      }
    }
  }, 60_000);
});
