/**
 * Browser student calls stay same-origin so `/api` can be proxied.
 * Faculty reads on Vercel go to the public Render API with a Bearer token.
 * SSR uses CFORGE_API_ORIGIN only. Do not put secrets in VITE_* variables.
 */
const RENDER_API = "https://cforge-api.onrender.com";

export function apiBase() {
  if (typeof window !== "undefined") return "";
  const origin = process.env["CFORGE_API_ORIGIN"]?.trim();
  return origin && origin.length > 0 ? origin.replace(/\/$/, "") : "http://127.0.0.1:3000";
}

export function facultyBrowserOrigin(host: string) {
  if (host === "cforge-iota.vercel.app" || host.endsWith(".vercel.app")) return RENDER_API;
  return "";
}

export function facultyApiBase() {
  if (typeof window !== "undefined") return facultyBrowserOrigin(window.location.hostname);
  return apiBase();
}
