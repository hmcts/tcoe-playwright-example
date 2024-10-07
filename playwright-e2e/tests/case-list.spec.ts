import { expect, test } from "@playwright/test";
import { config } from "../../playwright.config";
import { CaseDetailsPage } from "../page-objects/pages/case-details.po";
import { CaseListPage } from "../page-objects/pages/case-list.po";

test.use({
  storageState:
    config.sessionStoragePath + `${config.users.solicitor.username}.json`,
});

test.describe(() => {
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
