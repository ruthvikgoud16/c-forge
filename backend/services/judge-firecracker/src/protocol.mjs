import { LIMITS } from "./limits.mjs";

export const OP = {
  compile: "compile",
  run: "run",
  shutdown: "shutdown",
  compiled: "compiled",
  result: "result",
  error: "error",
};

export function encodeFrame(message) {
  const json = Buffer.from(JSON.stringify(message), "utf8");
  const header = Buffer.alloc(4);
  header.writeUInt32BE(json.length);
  return Buffer.concat([header, json]);
}

export function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    if (size > 200_000) throw new Error("frame_too_large");
    if (offset + 4 + size > buffer.length) break;
    messages.push(JSON.parse(buffer.subarray(offset + 4, offset + 4 + size).toString("utf8")));
    offset += 4 + size;
  }
  return { messages, rest: buffer.subarray(offset) };
}

export function compileRequest(source) {
  return { op: OP.compile, language: "c11", source };
}

export function runRequest(stdin) {
  return { op: OP.run, stdin };
}

export function shutdownRequest() {
  return { op: OP.shutdown };
}

export function assertGuestSafe(message) {
  const text = JSON.stringify(message);
  for (const key of ["expectedStdout", "expected_stdout", "expected", "answer", "answerKey", "hidden", "visibility"]) {
    if (new RegExp(`"${key}"\\s*:`).test(text)) {
      throw new Error("answer key must not enter the judge guest");
    }
  }
  if (text.includes("JUDGE_SECRET") || text.includes("DATABASE_URL")) {
    throw new Error("host secret must not enter the judge guest");
  }
}

export function boundResult(message) {
  return {
    op: message.op ?? OP.result,
    status: message.status ?? "runtime_error",
    stdout: String(message.stdout ?? "").slice(0, LIMITS.stdoutBytes),
    stderr: String(message.stderr ?? "").slice(0, LIMITS.stderrBytes),
    exitCode: Number.isFinite(message.exitCode) ? message.exitCode : undefined,
  };
}
