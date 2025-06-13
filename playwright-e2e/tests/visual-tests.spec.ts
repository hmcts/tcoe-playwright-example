import { ExuiMediaViewerPage } from "@hmcts/playwright-common";
import { expect } from "@playwright/test";
import { test } from "../fixtures";
import { config } from "../utils";

/*
  To update screenshots for these tests, run the below in order from root:
  - npm run build-container && npm run start-container
  - yarn test:update-snapshots
  - commit the new snapshots to the remote repo
*/

test.describe("Visual Tests (citizen user) @visual", () => {
  test.beforeEach(async ({ page, config, citizenUserUtils, idamUtils, idamPage }) => {
    const user = await citizenUserUtils.createUser({ idamUtils });
    await page.goto(config.urls.citizenUrl);
    await idamPage.login({
      username: user.email,
      password: user.password,
    });
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

test.describe("Visual Tests (case manager) @visual", () => {
  test.use({
    storageState: config.users.caseManager.sessionFile,
  });

  /*
    This test will open the media viewer and take screenshots of each page.
    However, there may be some dynamic data that is intended to be ignored.
    Therefore, the right side of the page is clipped out. If you also wanted
    to check the data, you could remove the clipping but ensure the data is created
    as you might expect.
  */
  test("Visual test for media viewer with clipping", async ({
    exuiCaseListPage,
    exuiCaseDetailsPage,
    context,
  }) => {
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseName(
      "Applicant ApplLast & Dolores Smith"
    );
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseState("Submitted");
    await exuiCaseListPage.exuiCaseListComponent.selectCaseByIndex(0);
    await exuiCaseDetailsPage.exuiCaseDetailsComponent.tabs.documentsTab.click();
    const newPage = context.waitForEvent("page");
    await exuiCaseDetailsPage.exuiCaseDetailsComponent.documentField
      .first()
      .click();

    const mediaViewerPage = new ExuiMediaViewerPage(await newPage);
    await mediaViewerPage.runVisualTestOnAllPages();
  });
});
