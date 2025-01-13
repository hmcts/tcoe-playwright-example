import { expect } from "@playwright/test";
import { test } from "../fixtures";
import { config } from "../utils";

/*
  To update screenshots for these tests, run the below in order from root:
  - ./scripts/start_visual_container.sh
  - yarn test:update-snapshots
  - commit the new snapshots to the remote repo
*/

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

  test("Visual test using a mask", async ({
    page,
    cuiCaseListPage,
    activateCasePinPage,
  }) => {
    await cuiCaseListPage.activateAccessCodeLink.click();

    // Insert some dynamic data to the input field
    const randomNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    await activateCasePinPage.caseNumber.fill(randomNumbers);

    // Check the screenshot, but provide a mask for the input field
    await expect(page).toHaveScreenshot({
      mask: [activateCasePinPage.caseNumber],
    });
  });
});
