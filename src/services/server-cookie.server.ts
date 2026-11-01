import { getRequestHeaders } from "@tanstack/react-start/server";

/** Server-only. The session cookie is forwarded to the API and never returned to client code. */
export function serverCookie() {
  try {
    return getRequestHeaders().get("cookie") ?? "";
  } catch {
    return "";
  }
}
