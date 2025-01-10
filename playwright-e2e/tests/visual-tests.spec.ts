import { expect } from "@playwright/test";
import { test } from "../fixtures";

test.describe("Visual Tests @visual", () => {
  test("Visual test for login", async ({ page, config }) => {
    await page.goto(config.urls.citizenUrl);
    await expect(page).toHaveScreenshot();
  });
});
