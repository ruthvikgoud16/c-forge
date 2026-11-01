import { expect, test } from "@playwright/test";
import { HELLO_CFORGE_ID } from "../../lib/academy/exercise-data";

test("home explains private access", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learn the logic/ })).toBeVisible();
  await expect(page.getByText(/Invitation-only/)).toBeVisible();
});

test("unauthorized student cannot open execute", async ({ request }) => {
  const response = await request.post("/api/v1/execute", {
    data: {
      exerciseId: HELLO_CFORGE_ID,
      source: "int main(){return 0;}",
      mode: "submit",
    },
  });
  expect(response.status()).toBe(401);
});

test("studio requires login", async ({ page }) => {
  await page.goto(`/studio/${HELLO_CFORGE_ID}`);
  await expect(page).toHaveURL(/login/);
});

test("academy dashboard requires login", async ({ page }) => {
  await page.goto("/learn");
  await expect(page).toHaveURL(/login/);
});

test("home links to the academy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Academy dashboard" })).toBeVisible();
});

test("exercise API hides hidden tests from anonymous users", async ({ request }) => {
  const response = await request.get(`/api/v1/exercises/${HELLO_CFORGE_ID}`);
  expect(response.status()).toBe(401);
});
