const REDACT = /JUDGE_SECRET|DATABASE_URL|password|Bearer\s+\S+|postgres:\/\/\S+/gi;

export function logEvent(event, fields = {}) {
  const row = { ts: new Date().toISOString(), event, ...fields };
  delete row.source;
  delete row.stdin;
  delete row.stdout;
  delete row.stderr;
  delete row.compiler;
  delete row.secret;
  const line = JSON.stringify(row).replace(REDACT, "[redacted]");
  process.stdout.write(`${line}\n`);
}
