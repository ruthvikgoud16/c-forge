export function normalizeStdout(value: string) {
  return value.replace(/\r\n/g, "\n");
}

export function outputsMatch(actual: string, expected: string) {
  return normalizeStdout(actual) === normalizeStdout(expected);
}
