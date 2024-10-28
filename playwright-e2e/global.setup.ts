import { test as setup } from "./fixtures";
import { IdamPage } from "./page-objects/pages/idam.po";

/*
 * Log in user the exui/solicitor user
 * if you have multiple different users, simply repeat the below
 * steps to save the session for that user
 *
 * If the user is logged out manually, it will invalidate the session data
 * Currently, the session is valid for 8 hours
 */
setup("Setup exui user", async ({ page, config }) => {
  await page.goto(config.urls.manageCaseBaseUrl);
  await new IdamPage(page).login(config.users.exui);
});

setup("Setup citizen user", async ({ page, config }) => {
  await page.goto(config.urls.citizenUrl);
  await new IdamPage(page).login(config.users.citizen);
});
