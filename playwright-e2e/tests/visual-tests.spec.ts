import { expect } from "@playwright/test";
import { test } from "../fixtures";
import { config } from "../utils";

/*
  To update screenshots for these tests, run the below in order from root:
  - ./scripts/run_visual_container.sh
  - yarn test:update-snapshots
  - commit the new snapshots to the remote repo
*/

test.describe("Visual Tests (guest user))@visual", () => {
  test("Visual test for IDAM login page", async ({ page, config }) => {
    await page.goto(config.urls.citizenUrl);
    await expect(page).toHaveScreenshot();
  });
});

test.describe("Visual Tests (citizen user) @visual", () => {
  test.use({
    storageState: config.users.citizen.sessionFile,
  });

  test("Visual test for activating an access code", async ({
    page,
    cuiCaseListPage,
  }) => {
    await cuiCaseListPage.activateAccessCodeLink.click();
    await expect(page).toHaveScreenshot();
  });
});
