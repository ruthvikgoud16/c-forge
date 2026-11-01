import { expect, test } from "@playwright/test";
import { HELLO_CFORGE_ID } from "../../lib/academy/exercise-data";
import { VISUALIZER_IDS } from "../../lib/content/visualizer-ids";

const TOOL_HEADING: Record<string, RegExp> = {
  binary: /Binary visualiser/,
  syntax: /Syntax explorer/,
  algorithm: /Algorithm visualiser/,
  flowchart: /Flowchart viewer/,
  "control-flow": /Control-flow visualiser/,
  "array-string": /Array and string visualiser/,
  recursion: /Function and recursion visualiser/,
  "search-sort": /Searching and sorting visualiser/,
};

test("student can open units, mind maps, materials, and all eight visualisers", async ({ page }) => {
  const roll = "26EG104G47";
  const minted = await page.request.post("/api/v1/faculty/invitations", {
    headers: { Authorization: `Bearer ${process.env.FACULTY_TOKEN ?? "e2e-faculty-token"}` },
    data: { ttlHours: 1, rollNumber: roll },
  });
  const token =
    minted.status() === 201 ? ((await minted.json()) as { token: string }).token : "e2e-dev-invite";
  const join = await page.request.post("/api/v1/auth/invite/accept", {
    data: { token, rollIdentifier: roll, password: "password1234" },
  });
  expect(join.status(), await join.text()).toBe(201);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: `Welcome, ${roll}` })).toBeVisible();
  await expect(page.locator("[data-theme='student']")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "See my learning path" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open this next step" })).toBeVisible();
  for (const slug of ["unit-1", "unit-2", "unit-3", "unit-4", "unit-5"]) {
    await expect(page.locator(`a[href="/learn/units/${slug}"]`).first()).toBeVisible();
  }
  for (const id of VISUALIZER_IDS) {
    await expect(page.locator(`a[href="/learn/tools/${id}"]`).first()).toBeVisible();
  }
  await page.screenshot({ path: "test-results/recovery-learn-desktop.png" });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: "test-results/recovery-learn-tablet.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/recovery-learn-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.locator(`a[href="/learn/units/unit-1"]`).first().click();
  await expect(page.getByText("Mind map", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Introduction, C Preliminaries and Operators" })).toBeVisible();
  await page.screenshot({ path: "test-results/recovery-unit-mind-map.png" });

  await page.goto("/learn/topics/u1-t1");
  const tools = page.locator("li", { hasText: "Interactive tools" });
  await expect(tools.getByRole("link", { name: "binary" })).toBeVisible();
  await expect(tools.getByRole("link", { name: "flowchart" })).toBeVisible();
  await page.locator("li", { hasText: "Mind map" }).getByRole("link", { name: "Open" }).click();
  await expect(page.getByText("Mind map", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Computer components" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Algorithms" })).toHaveAttribute("href", "/learn/topics/u1-t2");
  await page.screenshot({ path: "test-results/recovery-topic-mind-map.png" });

  await page.goto("/learn/topics/u1-t1");
  await page.locator("li", { hasText: "Complete notes" }).getByRole("link", { name: "Open" }).click();
  await expect(page.getByText(/CForge study notes/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Binary visualiser/ })).toBeVisible();

  await page.goto("/learn/topics/u1-t1/flashcards");
  await page.getByRole("button", { name: "Reveal" }).click();
  await expect(page.getByText("Arithmetic and logic: add, subtract, compare.")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Card 2 /")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Card 3 /")).toBeVisible();

  await page.goto("/learn/lessons/u1-t1-computers-and-binary");
  await expect(page.getByRole("heading", { name: "Learning objectives" })).toBeVisible();
  const resources = page.getByRole("navigation", { name: "Topic resources" });
  await expect(resources.getByRole("link", { name: "Complete notes" })).toBeVisible();
  await expect(resources.getByRole("link", { name: "Next lesson" })).toBeVisible();
  await expect(resources.getByRole("link", { name: "Binary" })).toBeVisible();
  await expect(resources.getByRole("link", { name: "Flowchart" })).toBeVisible();
  await page.screenshot({ path: "test-results/ui3-lesson-desktop.png" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: "test-results/ui3-lesson-tablet.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(fits).toBe(true);
  await page.screenshot({ path: "test-results/ui3-lesson-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto("/learn/assessments/topic/u1-t1");
  await expect(page.getByRole("button", { name: "Submit for server scoring" })).toBeVisible();
  await page.goto("/learn/assessments/unit/unit-1");
  await expect(page.getByRole("button", { name: "Submit for server scoring" })).toBeVisible();

  await page.goto("/learn/topics/u1-t1/practice");
  await expect(page.getByRole("heading", { name: "Guided" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Independent" })).toBeVisible();

  for (const id of VISUALIZER_IDS) {
    await page.goto(`/learn/tools/${id}`);
    await expect(page.getByRole("heading", { name: TOOL_HEADING[id] })).toBeVisible();
  }
  await page.goto("/learn/tools/binary");
  await page.locator("input[type='number']").first().fill("13");
  await expect(page.locator("code", { hasText: "1101" })).toBeVisible();
  await page.screenshot({ path: "test-results/recovery-binary-visualiser.png" });

  await page.goto(`/studio/${HELLO_CFORGE_ID}`);
  await expect(page.locator("[data-theme='code']")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

  await page.goto("/faculty");
  await expect(page.locator("[data-theme='staff']")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Cohort dashboard" })).toBeVisible();
});
