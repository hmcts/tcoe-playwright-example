import { Locale } from "@hmcts/playwright-common";
import { expect, test } from "../fixtures";

test.describe("Localisation Tests - Citizen @localisation", () => {
  test.beforeEach(async ({ page, config, citizenUserUtils, idamPage }) => {
    const user = await citizenUserUtils.createUser();
    await page.goto(config.urls.citizenUrl);
    await idamPage.login({
      username: user.email,
      password: user.password,
    });
  });

  /*
    The Welsh language must be supported by services.
    Below is an example of how you might integrate localisation testing within tests
  */
  [{ locale: Locale.EN }, { locale: Locale.CY }].forEach(({ locale }) => {
    test(`Localisation testing: ${locale}`, async ({
      cuiCaseListPage,
      localeUtils,
    }) => {
      // By appending ?lng=${locale} to the URL, it will force the page to load in the chosen language
      await localeUtils.navigateWithLocale(locale);
      const textFixtures = cuiCaseListPage.textFixtures[locale];
      await expect(
        cuiCaseListPage.page.locator("h1", { hasText: textFixtures.heading })
      ).toBeVisible();
    });
  });
});
