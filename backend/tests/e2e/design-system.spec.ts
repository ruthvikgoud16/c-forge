import { expect, test, type Page } from "@playwright/test";
import { HELLO_CFORGE_ID } from "../../lib/academy/exercise-data";

const FACULTY = process.env.FACULTY_TOKEN ?? "e2e-faculty-token";

async function themeOf(page: Page) {
  return page.evaluate(() => {
    const scope = document.querySelector("[data-theme]");
    const style = scope ? getComputedStyle(scope) : getComputedStyle(document.body);
    return {
      theme: scope?.getAttribute("data-theme") ?? null,
      themes: [...document.querySelectorAll("[data-theme]")].map((el) => el.getAttribute("data-theme")),
      bg: style.backgroundColor,
      color: style.color,
      scheme: style.colorScheme,
    };
  });
}

async function joinStudent(page: Page, start: number) {
  for (let i = start; i <= 55; i += 1) {
    const roll = `26EG104G${String(i).padStart(2, "0")}`;
    const minted = await page.request.post("/api/v1/faculty/invitations", {
      headers: { Authorization: `Bearer ${FACULTY}` },
      data: { ttlHours: 1, rollNumber: roll },
    });
    if (minted.status() !== 201) continue;
    const { token } = (await minted.json()) as { token: string };
    const join = await page.request.post("/api/v1/auth/invite/accept", {
      data: { token, rollIdentifier: roll, password: "password1234" },
    });
    if (join.status() === 201) return roll;
  }
  throw new Error("no seat available for design-system e2e");
}

test("public routes stay on the neutral base theme", async ({ page }) => {
  await page.goto("/login");
  const t = await themeOf(page);
  expect(t.theme).toBeNull();
  expect(t.bg).toBe("rgb(239, 228, 212)");
  await page.screenshot({ path: "test-results/ui1-login-base.png", fullPage: true });
});

test("faculty renders Dark Glass only", async ({ page }) => {
  await page.goto("/faculty");
  const t = await themeOf(page);
  expect(t.themes).toEqual(["staff"]);
  expect(t.bg).toBe("rgb(10, 17, 32)");
  expect(t.scheme).toBe("dark");
  await page.getByLabel("Faculty token").fill(FACULTY);
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page.getByText("Approved rolls")).toBeVisible();
  await page.screenshot({ path: "test-results/ui1-faculty-staff.png", fullPage: true });
});

test("student and coding routes keep separate themes", async ({ page }) => {
  await joinStudent(page, 30);
  await page.goto("/learn");
  const learn = await themeOf(page);
  expect(learn.themes).toEqual(["student"]);
  expect(learn.bg).toBe("rgb(231, 223, 210)");
  expect(learn.scheme).toBe("light");
  const nav = page.getByRole("navigation", { name: "Academy" });
  await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  await page.screenshot({ path: "test-results/ui1-learn-student.png", fullPage: true });

  await page.goto(`/studio/${HELLO_CFORGE_ID}`);
  const studio = await themeOf(page);
  expect(studio.themes).toEqual(["code"]);
  expect(studio.bg).toBe("rgb(13, 16, 20)");
  await page.screenshot({ path: "test-results/ui1-studio-code.png", fullPage: true });
});

test("design-system preview shows three themes side by side without leakage", async ({ page }) => {
  await page.goto("/design-system");
  const samples = await page.evaluate(() =>
    [...document.querySelectorAll(".ds-sample")].map((el) => {
      const card = el.querySelector(".ui-card:not(.ui-card--glass)") as HTMLElement;
      const button = el.querySelector(".ui-button") as HTMLElement;
      return {
        theme: el.getAttribute("data-theme"),
        bg: getComputedStyle(el).backgroundColor,
        card: getComputedStyle(card).backgroundColor,
        button: getComputedStyle(button).backgroundColor,
      };
    }),
  );
  expect(samples.map((s) => s.theme)).toEqual(["student", "staff", "code"]);
  expect(new Set(samples.map((s) => s.bg)).size).toBe(3);
  expect(new Set(samples.map((s) => s.card)).size).toBe(3);
  expect(new Set(samples.map((s) => s.button)).size).toBe(3);
  await page.screenshot({ path: "test-results/ui1-design-system.png", fullPage: true });
});

test("shared primitives are keyboard operable", async ({ page }) => {
  await page.goto("/design-system");
  const staff = page.locator('.ds-sample[data-theme="staff"]');
  const trigger = staff.getByRole("button", { name: /Actions/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(staff.getByRole("menu")).toBeVisible();
  await expect(staff.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(staff.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(staff.getByTestId("picked-staff")).toHaveText("Selected: archive");
  await expect(trigger).toBeFocused();
  await expect(staff.getByRole("menu")).toHaveCount(0);

  const open = staff.getByRole("button", { name: "Open dialog" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Confirm action" });
  await expect(dialog).toBeVisible();
  await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  const dialogStyle = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return { opacity: s.opacity, bg: s.backgroundColor, theme: el.closest("[data-theme]")?.getAttribute("data-theme") };
  });
  expect(dialogStyle).toEqual({ opacity: "1", bg: "rgb(22, 33, 58)", theme: "staff" });
  await page.screenshot({ path: "test-results/ui1-dialog-staff.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();

  const focusRing = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  expect(focusRing.style).toBe("solid");
  expect(focusRing.width).toBe("2px");
});

test("reduced motion disables primitive animation", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/design-system");
  const duration = await page.evaluate(() => getComputedStyle(document.querySelector(".ui-skeleton")!).animationDuration);
  expect(["0.01ms", "1e-05s", "0s"]).toContain(duration);
  await context.close();
});
