import { expect, test } from "@playwright/test";

test("unknown roll cannot accept an invitation", async ({ request }) => {
  const response = await request.post("/api/v1/auth/invite/accept", {
    data: {
      token: "e2e-dev-invite",
      rollIdentifier: "OUTSIDER99",
      password: "password1234",
    },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ error: "unknown_roll" });
});

test("official roster roll still requires a valid invitation", async ({ request }) => {
  const response = await request.post("/api/v1/auth/invite/accept", {
    data: {
      token: "not-a-real-invite",
      rollIdentifier: "26EG104G01",
      password: "password1234",
    },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ error: "invalid_invitation" });
});

test("joined official student sees their own greeting, not an invented name", async ({ page }) => {
  const roll = `26EG104G${String(40 + Math.floor(Math.random() * 10)).padStart(2, "0")}`;
  const minted = await page.request.post("/api/v1/faculty/invitations", {
    headers: { Authorization: `Bearer ${process.env.FACULTY_TOKEN ?? "e2e-faculty-token"}` },
    data: { ttlHours: 1, rollNumber: roll },
  });
  const token =
    minted.status() === 201
      ? ((await minted.json()) as { token: string }).token
      : "e2e-dev-invite";
  const join = await page.request.post("/api/v1/auth/invite/accept", {
    data: { token, rollIdentifier: roll.toLowerCase(), password: "password1234" },
  });
  expect(join.status(), await join.text()).toBe(201);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: `Welcome, ${roll}` })).toBeVisible();
  await expect(page.getByText(/No global beginner label/)).toBeVisible();
  await expect(page.getByRole("link", { name: "See my learning path" })).toBeVisible();
});
