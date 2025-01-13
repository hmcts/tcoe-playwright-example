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
    activateCasePinPage,
  }) => {
    await expect(activateCasePinPage.page).toHaveScreenshot();
  });

  test("Visual test using a mask", async ({ activateCasePinPage }) => {
    // Insert some dynamic data to the input field
    const randomNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    await activateCasePinPage.caseNumber.fill(randomNumbers);

    // Check the screenshot, but provide a mask for the input field
    await expect(activateCasePinPage.page).toHaveScreenshot({
      mask: [activateCasePinPage.caseNumber],
    });
  });

  test("Visual test using clip", async ({ activateCasePinPage }) => {
    // Clip the area so that only the form is captured
    const boundingBox = await activateCasePinPage.form.boundingBox();
    await expect(activateCasePinPage.page).toHaveScreenshot({
      clip: boundingBox!,
    });
  });
});
