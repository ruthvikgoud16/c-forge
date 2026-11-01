import { expect, test } from "@playwright/test";

const FACULTY = process.env.FACULTY_TOKEN ?? "e2e-faculty-token";

async function mint(page: import("@playwright/test").Page, roll: string) {
  const minted = await page.request.post("/api/v1/faculty/invitations", {
    headers: { Authorization: `Bearer ${FACULTY}` },
    data: { ttlHours: 1, rollNumber: roll },
  });
  expect(minted.status()).toBe(201);
  return ((await minted.json()) as { token: string }).token;
}

test("welcome page links to the real login route", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learn the logic/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Student Login" }).first()).toHaveAttribute("href", "/login");
  await page.getByRole("link", { name: "Student Login" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.screenshot({ path: "test-results/emergent-login.png", fullPage: true });
});

test("invalid password stays on the login form", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Roll number").fill("26EG104G52");
  await page.getByRole("textbox", { name: "Password" }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("student login, dashboard identity, logout, and protected redirect", async ({ page }) => {
  const roll = "26EG104G54";
  const token = await mint(page, roll);
  const join = await page.request.post("/api/v1/auth/invite/accept", {
    data: { token, rollIdentifier: roll, password: "password1234" },
  });
  expect(join.status()).toBe(201);
  await page.context().clearCookies();

  await page.goto("/learn");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Roll number").fill(roll);
  await page.getByRole("textbox", { name: "Password" }).fill("password1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: `Welcome, ${roll}` })).toBeVisible();
  await expect(page.getByText("No recorded activity yet")).toBeVisible();
  await page.screenshot({ path: "test-results/emergent-learn.png", fullPage: true });
  await expect(page.getByText(/Fictional student|demo progress/i)).toHaveCount(0);
  for (const slug of ["unit-1", "unit-2", "unit-3", "unit-4", "unit-5"]) {
    await expect(page.locator(`a[href="/learn/units/${slug}"]`).first()).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByRole("heading", { name: `Welcome, ${roll}` })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(overflow).toBe(true);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/login$/);
});
