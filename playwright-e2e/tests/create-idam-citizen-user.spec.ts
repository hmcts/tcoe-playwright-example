import { IdamCreateCitizenUtils } from "../utils/idam_create_citizen_user.utils.ts";
import { test } from "../fixtures";
import { config } from "../utils";

test.extend({
  async createSignInCitizenUser({ page }, use) {
    const idamUtils = new IdamCreateCitizenUtils();
    await idamUtils.signInCitizenUser(page, config.urls.citizenUrl);
    await use(page);
  }
});

test.describe("Create citizen user and sign in @createCitizen", () => {
  // test("First test", async ({cuiCaseListPage}) => {
    // await expect(cuiCaseListPage.banner).toBeVisible();
    // await cuiCaseListPage.cuiCaseListComponent.validateDraftTable();
  // });
});
