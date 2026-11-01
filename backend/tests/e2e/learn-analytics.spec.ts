import { expect, test } from "@playwright/test";

test("student /learn analytics dashboard stays personal", async ({ page }) => {
  const faculty = process.env.FACULTY_TOKEN ?? "e2e-faculty-token";
  let roll = "";
  let joinStatus = 0;
  let joinText = "";
  for (let i = 1; i <= 55; i += 1) {
    roll = `26EG104G${String(i).padStart(2, "0")}`;
    const minted = await page.request.post("/api/v1/faculty/invitations", {
      headers: { Authorization: `Bearer ${faculty}` },
      data: { ttlHours: 1, rollNumber: roll },
    });
    if (minted.status() !== 201) continue;
    const mintedBody = (await minted.json()) as { token: string };
    const join = await page.request.post("/api/v1/auth/invite/accept", {
      data: { token: mintedBody.token, rollIdentifier: roll, password: "password1234" },
    });
    joinStatus = join.status();
    joinText = await join.text();
    if (joinStatus === 201) break;
  }
  expect(joinStatus, joinText).toBe(201);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: `Welcome, ${roll}` })).toBeVisible();
  await expect(page.getByText(/No global beginner label/)).toBeVisible();
  await expect(page.getByText(/Opening a lesson is not mastery/)).toBeVisible();
  const peer = roll === "26EG104G01" ? "26EG104G02" : "26EG104G01";
  await expect(page.locator("body")).not.toContainText(peer);
  await expect(page.locator("body")).not.toContainText("Faculty token");
});
