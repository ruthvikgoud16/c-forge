import { describe, expect, it } from "vitest";
import { applyAppearance, readStoredAppearance } from "@/lib/appearance";

describe("appearance preference", () => {
  it("stores and applies dark and light without inventing a third mode", () => {
    applyAppearance("dark");
    expect(readStoredAppearance()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyAppearance("light");
    expect(readStoredAppearance()).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
