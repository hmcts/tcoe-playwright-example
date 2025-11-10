import type { Locator } from "@playwright/test";
import { expect, test } from "../fixtures";
import { config } from "../utils";
import type { ExuiCaseDetailsPage } from "../page-objects/pages/exui/exui-case-details.po";
import type { ExuiCaseListPage } from "../page-objects/pages/exui/exui-case-list.po";

const CASE_HEADER_TIMEOUT_MS = 5_000;
const CASE_DETAILS_OUTCOME = "caseDetails" as const;

type CaseSelectionContext = {
  caseName: string;
  caseListPage: ExuiCaseListPage;
  caseDetailsPage: ExuiCaseDetailsPage;
};

type CaseSelectionAttemptContext = {
  index: number;
  caseNameLower: string;
  caseListComponent: ExuiCaseListPage["exuiCaseListComponent"];
  caseDetailsComponent: ExuiCaseDetailsPage["exuiCaseDetailsComponent"];
  caseListHeader: ExuiCaseListPage["exuiHeader"];
};

const normalise = (value: string) => value.toLowerCase();

const waitForVisibleHeader = async (header: Locator) => {
  await header.waitFor({
    state: "visible",
    timeout: CASE_HEADER_TIMEOUT_MS,
  });
  return header.textContent();
};

const attemptCaseSelection = async ({
  index,
  caseNameLower,
  caseListComponent,
  caseDetailsComponent,
  caseListHeader,
}: CaseSelectionAttemptContext): Promise<boolean> => {
  let navigationAttempted = false;
  let selectionSucceeded = false;

  try {
    await caseListComponent.selectCaseByIndex(index);
    navigationAttempted = true;

    const outcome = await caseDetailsComponent.waitForSelectionOutcome();
    if (outcome !== CASE_DETAILS_OUTCOME) {
      return false;
    }

    const headerText = await waitForVisibleHeader(
      caseDetailsComponent.caseHeader
    );
    selectionSucceeded =
      headerText?.toLowerCase().includes(caseNameLower) ?? false;

    if (!selectionSucceeded) {
      console.warn(
        `Case selection attempt ${index + 1} produced an unexpected header: ${headerText}`
      );
    }

    return selectionSucceeded;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Case selection attempt ${index + 1} failed: ${message}`);
    return false;
  } finally {
    if (!selectionSucceeded && navigationAttempted) {
      await caseDetailsComponent.returnToCaseList();
      await caseListHeader.checkIsVisible();
    }
  }
};

const selectCaseByName = async ({
  caseName,
  caseListPage,
  caseDetailsPage,
}: CaseSelectionContext): Promise<void> => {
  const { exuiCaseListComponent, exuiHeader } = caseListPage;
  const { exuiCaseDetailsComponent } = caseDetailsPage;

  await exuiCaseListComponent.searchByCaseName(caseName);
  const totalResults = await exuiCaseListComponent.resultLinks.count();

  if (totalResults === 0) {
    throw new Error(`No search results found for case name "${caseName}".`);
  }

  const caseNameLower = normalise(caseName);

  for (let index = 0; index < totalResults; index += 1) {
    if (index > 0) {
      await exuiCaseListComponent.searchByCaseName(caseName);
    }

    const selectionSucceeded = await attemptCaseSelection({
      index,
      caseNameLower,
      caseListComponent: exuiCaseListComponent,
      caseDetailsComponent: exuiCaseDetailsComponent,
      caseListHeader: exuiHeader,
    });

    if (selectionSucceeded) {
      return;
    }
  }

  throw new Error(
    `Unable to open a case named "${caseName}" after ${totalResults} attempt(s).`
  );
};

/**
 * Select a session for the browser to use
 * Use test.use({ storageState: { cookies: [], origins: [] } }); to override if required
 */
test.use({
  storageState: config.users.caseManager.sessionFile,
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
    await selectCaseByName({
      caseName,
      caseListPage: exuiCaseListPage,
      caseDetailsPage: exuiCaseDetailsPage,
    });

    await expect(
      exuiCaseDetailsPage.exuiCaseDetailsComponent.caseHeader
    ).toContainText(caseName, { ignoreCase: true });
  });
});

// Data driven parameterized tests
for (const { state } of [
  { state: "Case Issued" },
  { state: "Submitted" },
  { state: "Pending" },
]) {
  test(`Search for a case with state: ${state}`, async ({
    exuiCaseListPage,
    tableUtils,
  }) => {
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseState(state);
    await expect
      .poll(async () => {
        const table = await tableUtils.mapExuiTable(
          exuiCaseListPage.exuiCaseListComponent.caseListTable
        );
        return table.length;
      })
      .toBeGreaterThan(0);

    await expect
      .poll(async () => {
        const table = await tableUtils.mapExuiTable(
          exuiCaseListPage.exuiCaseListComponent.caseListTable
        );
        return table.filter((row) => row["State"] !== state).length;
      })
      .toBe(0);
  });
}
