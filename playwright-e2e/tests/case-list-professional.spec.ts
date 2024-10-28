import { expect, test } from "../fixtures";
import { config } from "../utils";

/**
 * Select a session for the browser to use
 * Use test.use({ storageState: { cookies: [], origins: [] } }); to override if required
 */
test.use({
  storageState: config.users.exui.sessionFile,
});

// test.describe() is used to group a suite of tests
test.describe("Case List Tests - Professional @exui", () => {
  /* test.beforeEach hook not required because the fixture already navigates to case list URL
  test.beforeEach(async ({ caseListPage }) => {
    await caseListPage.exuiHeader.checkIsVisible();
  }); */

  test("Search & select a case", async ({
    exuiCaseListPage,
    exuiCaseDetailsPage,
  }) => {
    await exuiCaseListPage.exuiHeader.checkIsVisible();

    const caseName = "test";
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseName(caseName);
    await exuiCaseListPage.exuiCaseListComponent.selectCaseByIndex(0);
    await expect(
      exuiCaseDetailsPage.exuiCaseDetailsComponent.caseHeader
    ).toBeVisible();
    await expect(
      exuiCaseDetailsPage.exuiCaseDetailsComponent.caseHeader
    ).toContainText(caseName, { ignoreCase: true });
  });
});
