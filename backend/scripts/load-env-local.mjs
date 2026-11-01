import { readFileSync } from "node:fs";

/** Load .env.local into process.env without logging values. Existing env wins. */
export function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 1) continue;
      const key = line.slice(0, i);
      const value = line.slice(i + 1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // File may be absent in CI.
  }
}
