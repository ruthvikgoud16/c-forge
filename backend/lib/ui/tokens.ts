export const THEMES = ["student", "staff", "code"] as const;
export type Theme = (typeof THEMES)[number];

/** Which product surface each theme serves. Unthemed routes use the neutral base in tokens.css. */
export const THEME_SURFACES: Record<Theme, string> = {
  student: "Student experience — White Glass",
  staff: "Faculty and admin — Dark Glass",
  code: "Coding workspace — Premium Dark",
};

/** Mirrors the literal widths used in CSS media queries. */
export const BREAKPOINTS = { sm: 640, md: 960, lg: 1280 } as const;

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
