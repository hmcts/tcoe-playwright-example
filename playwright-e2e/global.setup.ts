import { test as setup } from "./fixtures";
import { IdamPage } from "./page-objects/pages/idam.po";
import { isSessionValid } from "./utils";

/*
 * Log in user the exui/solicitor user
 * if you have multiple different users, simply repeat the below
 * steps to save the session for that user
 *
 * If the user is logged out manually, it will invalidate the session data
 * Currently, the session is valid for 8 hours (for exui users)
 */
setup("Setup exui user", async ({ page, config }) => {
  const user = config.users.exui;
  if (isSessionValid(user.sessionFile, user.cookieName!)) return;
  await page.goto(config.urls.manageCaseBaseUrl);
  await new IdamPage(page).login(user);
});

setup("Setup case manager user", async ({ page, config }) => {
  const user = config.users.caseManager;
  if (isSessionValid(user.sessionFile, user.cookieName!)) return;
  await page.goto(config.urls.manageCaseBaseUrl);
  await new IdamPage(page).login(user);
});

setup("Setup citizen user", async ({ page, config }) => {
  await page.goto(config.urls.citizenUrl);
  await new IdamPage(page).login(config.users.citizen);
});
