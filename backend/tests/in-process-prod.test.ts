import { describe, expect, it } from "vitest";
import { assertNotGccBinary, refuseInProcessCompile } from "@/lib/academy/refuse-in-process";

describe("refuse in-process compilation", () => {
  it("throws for gcc", () => {
    expect(() => assertNotGccBinary("/usr/bin/gcc")).toThrow(/must not compile/);
    expect(() => refuseInProcessCompile()).toThrow(/JUDGE_URL/);
  });
});
