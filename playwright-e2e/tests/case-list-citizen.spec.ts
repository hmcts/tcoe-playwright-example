import { expect, test } from "../fixtures";
import { config } from "../utils";

/**
 * Select a session for the browser to use
 * Use test.use({ storageState: { cookies: [], origins: [] } }); to override if required
 */
test.use({
  storageState: config.users.citizen.sessionFile,
});

test.describe("Case List Tests - Citizen @cui", () => {
  test("View cases", async ({ cuiCaseListPage }) => {
    await expect(cuiCaseListPage.banner).toBeVisible();
    await cuiCaseListPage.cuiCaseListComponent.validateDraftTable();
  });

  // An example of obtaining config values via "config" fixture
  test("Navigate to the case list with Welsh language", async ({
    cuiCaseListPage,
    config,
  }) => {
    await cuiCaseListPage.page.goto(
      config.urls.citizenUrl + "dashboard?lng=cy"
    );
    await expect(cuiCaseListPage.banner).toBeVisible();
    await cuiCaseListPage.cuiCaseListComponent.validateWelshDraftTable();
  });
});
