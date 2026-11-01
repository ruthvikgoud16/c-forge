import { expect, test } from "@playwright/test";

test("anonymous user is sent to login from a topic hub", async ({ page }) => {
  await page.goto("/learn/topics/u2-t1");
  await expect(page).toHaveURL(/login/);
});

test("joined student opens Unit 2 hub with available notes", async ({ page }) => {
  const roll = "26EG104G48";
  const minted = await page.request.post("/api/v1/faculty/invitations", {
    headers: { Authorization: `Bearer ${process.env.FACULTY_TOKEN ?? "e2e-faculty-token"}` },
    data: { ttlHours: 1, rollNumber: roll },
  });
  const token =
    minted.status() === 201
      ? ((await minted.json()) as { token: string }).token
      : "e2e-dev-invite";
  const join = await page.request.post("/api/v1/auth/invite/accept", {
    data: { token, rollIdentifier: roll, password: "password1234" },
  });
  expect(join.status()).toBe(201);
  await page.goto("/learn/topics/u2-t1");
  await expect(page.getByRole("heading", { name: /Precedence/ })).toBeVisible();
  await expect(page.getByText("Complete notes")).toBeVisible();
  await expect(page.getByText("AVAILABLE").first()).toBeVisible();
  await page.locator("li", { hasText: "Complete notes" }).getByRole("link", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: /notes/i })).toBeVisible();
  await expect(page.getByText(/CForge study notes/)).toBeVisible();
});
