export type Appearance = "light" | "dark";

export const APPEARANCE_KEY = "cforge_appearance";

export function readStoredAppearance(): Appearance {
  if (typeof localStorage === "undefined") return "light";
  return localStorage.getItem(APPEARANCE_KEY) === "dark" ? "dark" : "light";
}

export function applyAppearance(appearance: Appearance) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", appearance === "dark");
  document.documentElement.style.colorScheme = appearance;
  try {
    localStorage.setItem(APPEARANCE_KEY, appearance);
  } catch {
    return;
  }
}
