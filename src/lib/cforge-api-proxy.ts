const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const FORWARD = new Set([
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-requested-with",
]);

function apiOrigin() {
  const origin = process.env["CFORGE_API_ORIGIN"]?.trim();
  if (!origin) throw new Error("CFORGE_API_ORIGIN is required for /api proxying");
  return origin.replace(/\/$/, "");
}

function rewriteSetCookie(value: string) {
  return value.replace(/;\s*domain=[^;]*/gi, "");
}

export function buildUpstreamUrl(request: Request, origin = apiOrigin()) {
  const incoming = new URL(request.url);
  return `${origin}${incoming.pathname}${incoming.search}`;
}

export function forwardRequestHeaders(request: Request) {
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const name = key.toLowerCase();
    if (HOP.has(name)) continue;
    if (FORWARD.has(name) || name.startsWith("x-")) headers.set(key, value);
  }
  const incoming = new URL(request.url);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", "") || "https");
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  return headers;
}

export function publicResponseHeaders(upstream: Headers) {
  const headers = new Headers();
  for (const [key, value] of upstream.entries()) {
    const name = key.toLowerCase();
    if (name === "set-cookie") continue;
    if (HOP.has(name)) continue;
    headers.append(key, value);
  }
  const cookies = typeof upstream.getSetCookie === "function" ? upstream.getSetCookie() : [];
  for (const cookie of cookies) headers.append("set-cookie", rewriteSetCookie(cookie));
  return headers;
}

export async function proxyCforgeApi(request: Request): Promise<Response> {
  const init: RequestInit = {
    method: request.method,
    headers: forwardRequestHeaders(request),
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }
  const upstream = await fetch(buildUpstreamUrl(request), init);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: publicResponseHeaders(upstream.headers),
  });
}
