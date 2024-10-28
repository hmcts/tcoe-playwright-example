import { expect, test } from "../fixtures";
import { config } from "../utils";
import { LighthouseUtils } from "../utils/lighthouse.utils";

test.use({
  storageState: config.users.citizen.sessionFile,
});

test.describe("Case List Tests - Citizen @cui @performance", () => {
  test.only("View cases", async ({ cuiCaseListPage, page }) => {
    await expect(cuiCaseListPage.banner).toBeVisible();
    await new LighthouseUtils().audit(page, 9222);
  });
});
