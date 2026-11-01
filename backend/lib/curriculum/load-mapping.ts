import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SyllabusMapping } from "./types";

export function loadSyllabusMapping(): SyllabusMapping {
  const path = join(process.cwd(), "content/curriculum/mapping.pending.json");
  return JSON.parse(readFileSync(path, "utf8")) as SyllabusMapping;
}
