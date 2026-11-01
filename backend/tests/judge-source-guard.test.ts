import { describe, expect, it } from "vitest";
import { assertSafeSource } from "../services/judge/src/isolate.mjs";

describe("judge source include guard", () => {
  it("allows standard headers used by the exercise bank", () => {
    expect(() => assertSafeSource('#include <stdio.h>\nint main(void){return 0;}\n')).not.toThrow();
    expect(() => assertSafeSource('#include <string.h>\n#include "local.h"\n')).not.toThrow();
  });

  it("rejects absolute, parent, and non-allowlisted includes", () => {
    expect(() => assertSafeSource('#include "/opt/judge/src/server.mjs"\n')).toThrow(/blocked include/);
    expect(() => assertSafeSource('#include "/proc/1/environ"\n')).toThrow(/blocked include/);
    expect(() => assertSafeSource('#include "../secret.h"\n')).toThrow(/blocked include/);
    expect(() => assertSafeSource('#include <unistd.h>\n')).toThrow(/blocked include/);
  });
});
