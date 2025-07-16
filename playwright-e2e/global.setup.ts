import { test as setup } from "./fixtures";

/**
 * Sets up test sessions for all required user roles and stores session data.
 *
 * This setup script can be reused for each user type individually.
 * Note: Manually signing out during tests will invalidate the stored session.
 * For EXUI users, sessions are currently valid for 8 hours.
 */
setup.describe("Set up users and retrieve tokens", () => {
  /**
   * Retrieves an IDAM bearer token at the beginning of the test run.
   *
   * This token is used to authorise user creation and is stored as an
   * environment variable (`CREATE_USER_BEARER_TOKEN`) for reuse across the test suite.
   */
  setup.beforeAll(
    "Retrieve IDAM token for citizen user creation",
    async ({ idamUtils }) => {
      const token = await idamUtils.generateIdamToken({
        grantType: "client_credentials",
        clientId: "prl-cos-api", // Change this to reflect the service you are working in, speak to a team member to find your client id
        clientSecret: process.env.IDAM_SECRET as string, // Make sure your client secret is pulled correctly from azure key vault
        scope: "profile roles",
      });
      process.env.CREATE_USER_BEARER_TOKEN = token;
    }
  );

  /**
   * Signs in as a case manager and stores session data.
   * Skips login if a valid session already exists.
   */
  setup(
    "Set up case manager user",
    async ({ page, config, idamPage, SessionUtils, cookieUtils }) => {
      const user = config.users.caseManager;
      if (SessionUtils.isSessionValid(user.sessionFile, user.cookieName!))
        return;
      await page.goto(config.urls.manageCaseBaseUrl);
      await idamPage.login(user);
      await cookieUtils.addManageCasesAnalyticsCookie(user.sessionFile);
    }
  );

  /**
   * Signs in as a judge and stores session data.
   * Skips login if a valid session already exists.
   */
  setup(
    "Set up judge user",
    async ({ page, config, idamPage, SessionUtils, cookieUtils }) => {
      const user = config.users.judge;
      if (SessionUtils.isSessionValid(user.sessionFile, user.cookieName!))
        return;
      await page.goto(config.urls.manageCaseBaseUrl);
      await idamPage.login(user);
      await cookieUtils.addManageCasesAnalyticsCookie(user.sessionFile);
    }
  );

  setup("Get service auth token", async ({ serviceAuthUtils }) => {
    const token = await serviceAuthUtils.retrieveToken({
      microservice: "prl-cos-api",
    });
    process.env.S2S_TOKEN = token;
  });
});
