import { expect, test } from '../fixtures';
import { ExuiCaseDetailsPage, ExuiCaseListPage } from "../page-objects/pages";
test("log in fixture @login", async ({
  config,
  loginUtils,
}) => {
  await loginUtils.loggedInAs(config.users.caseManager, "caseManager");
});

test.describe("Testing with multiple users @multiple-users", () => {
  test("Both a case manager and judge can access the same case", async ({
    config,
    loginUtils,
    exuiCaseListPage,
    exuiCaseDetailsPage,
    browserUtils,
  }) => {
    await loginUtils.loggedInAs(config.users.caseManager, "caseManager");
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseName(
      "Applicant ApplLast & Dolores Smith"
    );
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseState("Submitted");
    await exuiCaseListPage.exuiCaseListComponent.selectCaseByIndex(0);
    const caseNumber =
      await exuiCaseDetailsPage.exuiCaseDetailsComponent.getCaseNumber();

    await loginUtils.loggedInAs(config.users.judge, "judge");
    const judgeBrowser = await browserUtils.openNewBrowserContext(
      config.users.judge.sessionFile
    );
    await judgeBrowser.goto(config.urls.manageCaseBaseUrl);
    const judgeCaseListPage = new ExuiCaseListPage(judgeBrowser);
    await judgeCaseListPage.exuiCaseListComponent.searchByCaseNumber(
      caseNumber
    );
    await judgeCaseListPage.exuiCaseListComponent.selectCaseByIndex(0);
    const judgeCaseNumber = await new ExuiCaseDetailsPage(
      judgeBrowser
    ).exuiCaseDetailsComponent.getCaseNumber();

    expect(caseNumber).toEqual(judgeCaseNumber);
  });
});
