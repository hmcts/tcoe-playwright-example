import { expect, test } from "@playwright/test";
import { config } from "../../playwright.config";
import { CaseDetailsPage } from "../page-objects/pages/case-details.po";
import { CaseListPage } from "../page-objects/pages/case-list.po";

/**
 * Select a session for the browser to use
 * Use test.use({ storageState: '' }) to override if required
 */
test.use({
  storageState:
    config.sessionStoragePath + `${config.users.exui.username}.json`,
});

// test.describe() is used to group a suite of tests
test.describe("Case List Tests", () => {
  // test.beforeEach hook to run before any test
  test.beforeEach(async ({ page }) => {
    const caseListPage = new CaseListPage(page);
    await page.goto(config.urls.manageCaseBaseUrl);
    await caseListPage.exuiHeader.checkIsVisible();
  });

  test("Search & select a case", async ({ page }) => {
    const caseListPage = new CaseListPage(page);
    const caseDetailsPage = new CaseDetailsPage(page);

    const caseName = "Test";
    await caseListPage.caseListComponent.searchByCaseName(caseName);
    await caseListPage.caseListComponent.selectCaseByIndex(0);
    await expect(caseDetailsPage.caseDetailsComponent.caseHeader).toBeVisible();
    await expect(caseDetailsPage.caseDetailsComponent.caseHeader).toContainText(
      caseName
    );
  });
});
