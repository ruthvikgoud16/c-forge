import { recoverStale } from "./cleanup.mjs";
import { inspectHost } from "./preflight.mjs";

const host = inspectHost();
if (!host.linux) {
  console.error(JSON.stringify({ event: "recover_skipped", reason: host.reason }));
  process.exit(2);
}
const removed = await recoverStale();
console.log(JSON.stringify({ event: "recover_done", removed: removed.length }));
