import { test as setup } from "./fixtures";
import { IdamPage } from "./page-objects/pages";
import { request } from "@playwright/test";
import { IdamAccessTokenUtils } from "./utils/idam_access_token.utils";
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

setup("Retrieve bearer token for citizen user creation", async () => {
  const apiContext = await request.newContext();
  const idamAccessTokenUtils = new IdamAccessTokenUtils();
  const token = await idamAccessTokenUtils.getAccessToken(
    "citizenCreateUser",
    apiContext
  );
  if (!token) {
    throw new Error("Setup failed: Unable to get bearer token.");
  }
  //store retrieved token to be used for user creation later, ideally this should once per run of tests
  //note: token is valid for around 8 hours before expiration
  process.env.CITIZEN_CREATE_USER_BEARER_TOKEN = token;
});


