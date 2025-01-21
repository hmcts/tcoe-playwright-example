import { test as setup } from "./fixtures";
import { IdamPage } from "./page-objects/pages/idam.po";
import { isSessionValid } from "./utils";

/*
 * Logs in as all users and saves the session data
 * another `setup` can be used for each user
 *
 * If the user is logged out manually, it will invalidate the session data
 * Currently, the session is valid for 8 hours (for exui users)
 */

setup("Setup citizen user", async ({ page, config }) => {
  await page.goto(config.urls.citizenUrl);
  await new IdamPage(page).login(config.users.citizen);
});

setup("Setup solicitor user", async ({ page, config }) => {
  const user = config.users.solicitor;
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

setup("Setup judge user", async ({ page, config }) => {
  const user = config.users.judge;
  if (isSessionValid(user.sessionFile, user.cookieName!)) return;
  await page.goto(config.urls.manageCaseBaseUrl);
  await new IdamPage(page).login(user);
});
