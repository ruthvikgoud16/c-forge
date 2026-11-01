import { describe, expect, it } from "vitest";
import { buildUpstreamUrl, forwardRequestHeaders, publicResponseHeaders } from "@/lib/cforge-api-proxy";

describe("cforge api proxy", () => {
  it("keeps the path, query string, and server-only origin", () => {
    const url = buildUpstreamUrl(
      new Request("https://app.example/api/v1/me?tab=profile"),
      "https://api.example",
    );
    expect(url).toBe("https://api.example/api/v1/me?tab=profile");
  });

  it("forwards cookie, authorization, origin, and CSRF-relevant headers", () => {
    const headers = forwardRequestHeaders(
      new Request("https://app.example/api/v1/profile", {
        headers: {
          cookie: "cforge_session=abc",
          authorization: "Bearer faculty",
          origin: "https://app.example",
          "content-type": "application/json",
          host: "app.example",
          connection: "keep-alive",
        },
      }),
    );
    expect(headers.get("cookie")).toBe("cforge_session=abc");
    expect(headers.get("authorization")).toBe("Bearer faculty");
    expect(headers.get("origin")).toBe("https://app.example");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-forwarded-host")).toBe("app.example");
    expect(headers.has("host")).toBe(false);
    expect(headers.has("connection")).toBe(false);
  });

  it("strips Set-Cookie Domain so HttpOnly cookies stay on the public host", () => {
    const upstream = new Headers();
    upstream.append("set-cookie", "cforge_session=abc; Path=/; HttpOnly; SameSite=Lax; Domain=api.example");
    upstream.set("content-type", "application/json");
    const headers = publicResponseHeaders(upstream);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.getSetCookie()[0]).toContain("HttpOnly");
    expect(headers.getSetCookie()[0]).not.toMatch(/Domain=/i);
  });
});
