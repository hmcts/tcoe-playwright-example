import { expect, test } from "../fixtures";
import { config } from "../utils";

/**
 * Select a session for the browser to use
 * Use test.use({ storageState: { cookies: [], origins: [] } }); to override if required
 */
test.use({
  storageState: config.users.solicitor.sessionFile,
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

// Data driven parameterized tests
[{ state: "Draft" }, { state: "Submitted" }, { state: "Pending" }].forEach(
  ({ state }) => {
    test(`Search for a case with state: ${state}`, async ({
      exuiCaseListPage,
      tableUtils,
    }) => {
      await exuiCaseListPage.exuiCaseListComponent.searchByCaseState(state);
      const table = await tableUtils.mapTable(
        exuiCaseListPage.exuiCaseListComponent.caseListTable
      );
      table.forEach((row) => {
        expect(row["State"]).toEqual(state);
      });
    });
  }
);
