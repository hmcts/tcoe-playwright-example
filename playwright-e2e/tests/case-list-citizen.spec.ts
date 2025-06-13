import { expect, test } from "../fixtures";

test.describe("Case List Tests - Citizen @cui", () => {
  test.beforeEach(async ({ page, config, citizenUserUtils, idamUtils, idamPage }) => {
    const user = await citizenUserUtils.createUser({ idamUtils });
    await page.goto(config.urls.citizenUrl);
    await idamPage.login({
      username: user.email,
      password: user.password,
    });
  });

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

