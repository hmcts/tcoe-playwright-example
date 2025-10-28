import { test as setup } from "./fixtures";
import { requireEnvVar } from "./utils/config.utils";

const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on", "all"]);

const shouldSkipS2STokenSetup = () => {
  const flag = process.env.SKIP_S2S_TOKEN_SETUP?.trim().toLowerCase();
  return flag ? TRUTHY_FLAGS.has(flag) : false;
};

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
      const clientId = requireEnvVar("CLIENT_ID");
      const clientSecret = requireEnvVar("IDAM_SECRET");
      const token = await idamUtils.generateIdamToken({
        grantType: "client_credentials",
        clientId, // Change this to reflect the service you are working in, speak to a team member to find your client id
        clientSecret, // Make sure your client secret is pulled correctly from azure key vault
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

  setup("Get service auth token", async ({ serviceAuthUtils }, testInfo) => {
    if (shouldSkipS2STokenSetup()) {
      testInfo.skip(
        true,
        "S2S token retrieval skipped via SKIP_S2S_TOKEN_SETUP environment flag."
      );
    }
    const microservice = requireEnvVar("S2S_MICROSERVICE_NAME");
    const allowFailure = (() => {
      const flag = process.env.ALLOW_S2S_TOKEN_FAILURE?.trim().toLowerCase();
      return flag ? TRUTHY_FLAGS.has(flag) : false;
    })();
    try {
      const token = await serviceAuthUtils.retrieveToken({
        microservice,
      });
      process.env.S2S_TOKEN = token;
    } catch (error) {
      if (allowFailure) {
        testInfo.annotations.push({
          type: "warning",
          description:
            "Failed to retrieve S2S token but ALLOW_S2S_TOKEN_FAILURE flag is set.",
        });
        return;
      }
      throw error;
    }
  });
});
