import { expect, test } from "../fixtures";
import { config } from "../utils";

/**
 * Select a session for the browser to use
 * Use test.use({ storageState: { cookies: [], origins: [] } }); to override if required
 */
test.use({
  storageState: config.users.citizen.sessionFile,
});

test.describe("Screenreader tests @screenreader", () => {
  test.only("View cases", async ({ cuiCaseListPage, voiceOver }) => {
    await expect(cuiCaseListPage.banner).toBeVisible();
    await voiceOver.navigateToWebContent();
  });
});
