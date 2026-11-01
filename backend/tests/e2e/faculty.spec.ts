import { expect, test } from "@playwright/test";

const FACULTY = process.env.FACULTY_TOKEN ?? "e2e-faculty-token";

test("faculty landing requires a token and shows capacity 55", async ({ page }) => {
  await page.goto("/faculty");
  await expect(page.getByRole("heading", { name: "Cohort dashboard" })).toBeVisible();
  await expect(page.getByText("No faculty data loaded")).toBeVisible();
  await page.getByLabel("Faculty token").fill(FACULTY);
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page.getByText("Approved rolls")).toBeVisible();
  await expect(page.getByText("55", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Student management" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Academic overview" })).toBeVisible();
});

test("faculty APIs reject an anonymous and a student session", async ({ request, page }) => {
  expect((await request.get("/api/v1/faculty/overview")).status()).toBe(401);
  expect((await request.get("/api/v1/faculty/roster")).status()).toBe(401);

  let joinStatus = 0;
  let joinText = "";
  for (let i = 1; i <= 55; i += 1) {
    const roll = `26EG104G${String(i).padStart(2, "0")}`;
    const minted = await request.post("/api/v1/faculty/invitations", {
      headers: { Authorization: `Bearer ${FACULTY}` },
      data: { ttlHours: 1, rollNumber: roll },
    });
    if (minted.status() !== 201) continue;
    const token = (await minted.json()) as { token: string };
    const join = await request.post("/api/v1/auth/invite/accept", {
      data: { token: token.token, rollIdentifier: roll, password: "password1234" },
    });
    joinStatus = join.status();
    joinText = await join.text();
    if (joinStatus === 201) break;
  }
  expect(joinStatus, joinText).toBe(201);

  const studentOverview = await page.request.get("/api/v1/faculty/overview");
  expect(studentOverview.status()).toBe(401);
  const studentRoster = await page.request.get("/api/v1/faculty/roster");
  expect(studentRoster.status()).toBe(401);

  const faculty = await request.get("/api/v1/faculty/overview", {
    headers: { Authorization: `Bearer ${FACULTY}` },
  });
  expect(faculty.status()).toBe(200);
  const body = (await faculty.json()) as {
    cohortCapacity: number;
    approvedRoster: number;
    availableSeats: number;
    students: Array<{ rollNumber: string }>;
  };
  expect(body.cohortCapacity).toBe(55);
  expect(body.approvedRoster).toBe(55);
  expect(body.availableSeats).toBeLessThanOrEqual(54);
  expect(JSON.stringify(body)).not.toMatch(/answer|expectedStdout|hidden/);
  expect(body.students.some((row) => row.rollNumber === "26EG104G01")).toBe(true);
});
