import { expect, test } from "@playwright/test";

test("identity lab shows three distinct directions without touching production themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/design-system");
  await expect(page.locator(".ds-sample")).toHaveCount(3);
  const labs = page.locator("[data-lab]");
  await expect(labs).toHaveCount(3);
  const colors = await labs.evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-lab"),
      bg: getComputedStyle(node).backgroundColor,
      surfaces: [...node.querySelectorAll(".lab-desktop [data-surface]")].map((el) => el.getAttribute("data-surface")),
    })),
  );
  expect(colors.map((row) => row.id)).toEqual(["forge", "colorfield", "campus"]);
  expect(new Set(colors.map((row) => row.bg)).size).toBe(3);
  for (const row of colors) {
    expect(row.surfaces).toEqual(["login", "student", "lesson", "units", "map", "faculty", "code"]);
  }
  await page.locator(".identity-lab__compare").screenshot({ path: "test-results/lab-compare.png" });
  for (const id of ["forge", "colorfield", "campus"]) {
    await page.locator(`[data-lab="${id}"] .lab-desktop`).screenshot({ path: `test-results/lab-${id}-desktop.png` });
    await page.locator(`[data-lab="${id}"] .lab-mobile`).screenshot({ path: `test-results/lab-${id}-mobile.png` });
  }
});
