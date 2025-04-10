import { test as setup } from "./fixtures";

/*
 * Logs in as all users and saves the session data
 * another `setup` can be used for each user
 *
 * If the user is logged out manually, it will invalidate the session data
 * Currently, the session is valid for 8 hours (for exui users)
 */

setup("Setup citizen user", async ({ page, config, idamPage }) => {
  await page.goto(config.urls.citizenUrl);
  await idamPage.login(config.users.citizen);
});

setup(
  "Setup solicitor user",
  async ({ page, config, idamPage, SessionUtils }) => {
    const user = config.users.solicitor;
    if (SessionUtils.isSessionValid(user.sessionFile, user.cookieName!)) return;
    await page.goto(config.urls.manageCaseBaseUrl);
    await idamPage.login(user);
  }
);

setup(
  "Setup case manager user",
  async ({ page, config, idamPage, SessionUtils }) => {
    const user = config.users.caseManager;
    if (SessionUtils.isSessionValid(user.sessionFile, user.cookieName!)) return;
    await page.goto(config.urls.manageCaseBaseUrl);
    await idamPage.login(user);
  }
);

setup("Setup judge user", async ({ page, config, idamPage, SessionUtils }) => {
  const user = config.users.judge;
  if (SessionUtils.isSessionValid(user.sessionFile, user.cookieName!)) return;
  await page.goto(config.urls.manageCaseBaseUrl);
  await idamPage.login(user);
});
