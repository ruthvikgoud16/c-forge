import { describe, expect, it } from "vitest";
import { logoutDest, signedInDest } from "@/lib/session-dest";
import { IS_DEMO } from "@/services";
import { facultyBrowserOrigin } from "@/services/api-origin";

describe("session destinations", () => {
  it("sends faculty logout to faculty login and students home", () => {
    expect(logoutDest("faculty")).toBe("/faculty-login");
    expect(logoutDest("student")).toBe("/");
    expect(logoutDest(null)).toBe("/");
  });

  it("keeps signed-in roles on their product areas", () => {
    expect(signedInDest("faculty")).toBe("/faculty");
    expect(signedInDest("student")).toBe("/learn");
    expect(signedInDest(undefined)).toBeNull();
  });
});

describe("production services", () => {
  it("does not enable demo fixtures unless VITE_CFORGE_DEMO=1", () => {
    expect(IS_DEMO).toBe(import.meta.env["VITE_CFORGE_DEMO"] === "1");
  });
});

describe("api origin", () => {
  it("keeps browser calls same-origin and does not read a VITE API origin", () => {
    expect(Object.keys(import.meta.env).some((key) => key.startsWith("VITE_CFORGE_API"))).toBe(false);
  });

  it("sends production faculty reads to the public Render API", () => {
    expect(facultyBrowserOrigin("cforge-iota.vercel.app")).toBe("https://cforge-api.onrender.com");
    expect(facultyBrowserOrigin("localhost")).toBe("");
  });
});
