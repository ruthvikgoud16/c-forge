/**
 * Browser calls stay same-origin so a reverse proxy (Vite in development) can
 * forward `/api` to the original CForge API. SSR uses CFORGE_API_ORIGIN only.
 * Do not put secrets or faculty tokens in VITE_* variables.
 */
export function apiBase() {
  if (typeof window !== "undefined") return "";
  const origin = process.env["CFORGE_API_ORIGIN"]?.trim();
  return origin && origin.length > 0 ? origin.replace(/\/$/, "") : "http://127.0.0.1:3000";
}
