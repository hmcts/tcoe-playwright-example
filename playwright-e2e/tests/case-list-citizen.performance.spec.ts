import { playAudit } from "playwright-lighthouse";
import { expect, test } from "../fixtures";
import { config } from "../utils";

test.use({
  storageState:
    config.sessionStoragePath + `${config.users.citizen.username}.json`,
});

test.describe("Case List Tests - Citizen @cui @performance", () => {
  test.only("View cases", async ({
    lighthouseUtils,
    cuiCaseListPage,
    page,
  }) => {
    await page.pause();
    await expect(cuiCaseListPage.banner).toBeVisible();
    await cuiCaseListPage.cuiCaseListComponent.validateDraftTable();
    await playAudit({
      page: page,
      port: 9222,
    });
  });
});
