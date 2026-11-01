const ALLOWED_HEADERS = new Set([
  "assert.h",
  "ctype.h",
  "errno.h",
  "limits.h",
  "math.h",
  "stdbool.h",
  "stddef.h",
  "stdint.h",
  "stdio.h",
  "stdlib.h",
  "string.h",
  "time.h",
]);

export function assertSafeSource(source: string) {
  if (typeof source !== "string" || source.length === 0) {
    throw Object.assign(new Error("source_required"), { code: "blocked_source" });
  }
  if (source.length > 100_000) {
    throw Object.assign(new Error("source too large"), { code: "blocked_source" });
  }
  const include = /^\s*#\s*include\s*([<"])([^>"]+)[>"]/gm;
  let match = include.exec(source);
  while (match) {
    const path = match[2];
    if (path.includes("..") || path.startsWith("/") || path.includes("\\") || path.includes(":")) {
      throw Object.assign(new Error("blocked include"), { code: "blocked_source" });
    }
    if (match[1] === "<" && !ALLOWED_HEADERS.has(path)) {
      throw Object.assign(new Error("blocked include"), { code: "blocked_source" });
    }
    if (match[1] === '"' && (path.includes("/") || !path.endsWith(".h"))) {
      throw Object.assign(new Error("blocked include"), { code: "blocked_source" });
    }
    match = include.exec(source);
  }
}
