export function normalizeStdout(value) {
  return String(value ?? "").replace(/\r\n/g, "\n");
}

export function outputsMatch(actual, expected) {
  return normalizeStdout(actual) === normalizeStdout(expected);
}
