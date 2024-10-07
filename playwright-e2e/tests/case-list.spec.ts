import { expect, test } from "@playwright/test";
import { CaseDetailsPage } from "../page-objects/pages/case-details.po";
import { CaseListPage } from "../page-objects/pages/case-list.po";
import { IdamPage } from "../page-objects/pages/idam.po";

test.describe(() => {
  test.beforeEach(async ({ page }) => {
    const idam = new IdamPage(page);
    const caseListPage = new CaseListPage(page);

    await page.goto(process.env.MANAGE_CASES_BASE_URL!);
    await idam.logIn(
      process.env.SOLICITOR_USERNAME!,
      process.env.SOLICITOR_PASSWORD!
    );
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
