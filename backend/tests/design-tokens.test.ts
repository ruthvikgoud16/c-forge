import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BREAKPOINTS, THEMES } from "@/lib/ui/tokens";

const css = readFileSync(path.join(process.cwd(), "app/styles/tokens.css"), "utf8");
const primitives = readFileSync(path.join(process.cwd(), "app/styles/primitives.css"), "utf8");
const globals = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

function block(selector: string) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated ${selector}`);
}

function vars(body: string) {
  const out = new Map<string, string>();
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.set(match[1], match[2].trim());
  return out;
}

function luminance(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SEMANTIC = [...vars(block(":root")).keys()].filter((key) => key.startsWith("--color-") || key.startsWith("--glass-") || key.startsWith("--shadow-") || key === "--bg-image");

const themes = {
  base: vars(block(":root")),
  student: vars(block('[data-theme="student"]')),
  staff: vars(block('[data-theme="staff"]')),
  code: vars(block('[data-theme="code"]')),
};

describe("design tokens", () => {
  it("defines every semantic token in each product theme", () => {
    for (const theme of THEMES) {
      const missing = SEMANTIC.filter((key) => !themes[theme].has(key));
      expect(missing, theme).toEqual([]);
    }
  });

  it("scopes product themes to [data-theme] and never to :root or body", () => {
    expect(css).not.toMatch(/:root\s*\[data-theme/);
    expect(css).not.toMatch(/body\s*\{[^}]*--color-/);
    expect(themes.base.get("--glass-blur")).toBe("var(--blur-none)");
    expect(themes.student.get("--color-scheme")).toBe("light");
    expect(themes.staff.get("--color-scheme")).toBe("dark");
    expect(themes.code.get("--color-scheme")).toBe("dark");
    expect(themes.code.get("--glass-blur")).toBe("var(--blur-none)");
  });

  it("meets WCAG AA (4.5:1) for text, links, accents and status colours", () => {
    const failures: string[] = [];
    for (const [name, t] of Object.entries(themes)) {
      const bg = t.get("--color-bg")!;
      const surface = t.get("--color-surface")!;
      const pairs: Array<[string, string, string]> = [
        ["text/bg", t.get("--color-text")!, bg],
        ["text-muted/bg", t.get("--color-text-muted")!, bg],
        ["text-subtle/bg", t.get("--color-text-subtle")!, bg],
        ["text-muted/surface", t.get("--color-text-muted")!, surface],
        ["text-subtle/surface", t.get("--color-text-subtle")!, surface],
        ["link/bg", t.get("--color-link")!, bg],
        ["accent-contrast/accent", t.get("--color-accent-contrast")!, t.get("--color-accent")!],
        ["success/surface", t.get("--color-success")!, surface],
        ["warning/surface", t.get("--color-warning")!, surface],
        ["danger/surface", t.get("--color-danger")!, surface],
        ["info/surface", t.get("--color-info")!, surface],
      ];
      for (const [label, fg, back] of pairs) {
        const ratio = contrast(fg, back);
        if (ratio < 4.5) failures.push(`${name} ${label} ${ratio.toFixed(2)}`);
      }
      if (contrast(t.get("--color-focus-ring")!, bg) < 3) failures.push(`${name} focus ring < 3:1`);
    }
    expect(failures).toEqual([]);
  });

  it("keeps the student accent a natural sage, not electric blue or violet", () => {
    const accent = themes.student.get("--color-accent")!.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(accent.slice(i, i + 2), 16));
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    expect(b - r).toBeLessThan(40);
  });

  it("uses only the shared breakpoints in media queries and honours reduced motion", () => {
    const widths = [...`${css}${primitives}${globals}`.matchAll(/max-width:\s*(\d+)px\)/g)].map((m) => Number(m[1]));
    const allowed = new Set(Object.values(BREAKPOINTS));
    expect(widths.filter((w) => !allowed.has(w as 640))).toEqual([]);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    expect(globals).toMatch(/prefers-reduced-motion: reduce/);
    expect(css).toMatch(/prefers-reduced-transparency: reduce/);
  });

  it("primitives read semantic tokens instead of hard-coded colours", () => {
    const hex = primitives.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    expect(hex).toEqual([]);
  });
});
