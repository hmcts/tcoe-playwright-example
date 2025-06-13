import { expect, test } from "../fixtures"; // Import from the centralized fixtures.ts


test.describe("Case List Tests - Citizen @cui", () => {
  test.beforeEach(async ({ page, config, citizenUserUtils, idamUtils, idamPage }) => {
    const user = await citizenUserUtils.createUser({ idamUtils });
    await page.goto(config.urls.citizenUrl);
    await idamPage.login({
      username: user.email,
      password: user.password,
    });
  });
  test("Accessibility example using custom fixture @a11y", async ({
    cuiCaseListPage,
    axeUtils,
  }) => {
    await expect(cuiCaseListPage.banner).toBeVisible();
    await axeUtils.audit();
  });

  test("Accessibility example with exclusions @a11y", async ({
    cuiCaseListPage,
    axeUtils,
  }) => {
    await expect(cuiCaseListPage.banner).toBeVisible();
    // Single exclusion
    await axeUtils.audit({
      exclude: "[data-testid='terribleInaccessibleElement']",
    });
    // Multiple exclusions
    await axeUtils.audit({
      exclude: [
        "[data-testid='terribleInaccessibleElement']",
        "#evenWorseElement",
      ],
    });
  });
});
