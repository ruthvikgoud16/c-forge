import { describe, expect, it } from "vitest";
import { parseAppearance, parseDateOfBirth } from "@/lib/academy/profile";

describe("student profile fields", () => {
  it("accepts only an explicit calendar date", () => {
    expect(parseDateOfBirth("2004-06-15")).toEqual({ ok: true, value: "2004-06-15" });
    expect(parseDateOfBirth("")).toEqual({ ok: true, value: null });
    expect(parseDateOfBirth("15-06-2004").ok).toBe(false);
    expect(parseDateOfBirth("2004-13-01").ok).toBe(false);
    expect(parseDateOfBirth("2999-01-01").ok).toBe(false);
  });

  it("accepts only light or dark appearance", () => {
    expect(parseAppearance("dark")).toEqual({ ok: true, value: "dark" });
    expect(parseAppearance("light")).toEqual({ ok: true, value: "light" });
    expect(parseAppearance("system").ok).toBe(false);
  });
});
