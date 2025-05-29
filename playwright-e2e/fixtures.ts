import { test as baseTest, Page, BrowserContext } from "@playwright/test";
import getPort from "get-port";
import { PageFixtures, pageFixtures } from "./page-objects/pages";
import { UtilsFixtures, utilsFixtures } from "./utils";
import { User, UserRole, LoginUtils } from "./utils/login.utils";
import { CookieUtils } from "./utils/cookie.utils";

export type CustomFixtures = PageFixtures &
  UtilsFixtures & {
    getLoggedInPage: (role: UserRole) => Promise<{
      page: Page;
      user: User;
      context?: BrowserContext;
    }>;
  };

export const test = baseTest.extend<CustomFixtures, { lighthousePort: number }>({
  ...pageFixtures,
  ...utilsFixtures,

  getLoggedInPage: async ({ browserUtils, config, SessionUtils, browser }, use) => {
    async function getLoggedInPage(role: UserRole) {
      const user = config.users[role];
      console.log(user);

      const sessionValid = user.cookieName
        ? SessionUtils.isSessionValid(user.sessionFile, user.cookieName)
        : false;

      try {
        if (sessionValid) {
          console.log(`Using cached session for ${role}`);
          console.log(user.sessionFile);
          const page = await browserUtils.openNewBrowserContext(user.sessionFile);
          return { page, user };
        }

        const context = await browser.newContext();
        const page = await context.newPage();

        const loginUtils = new LoginUtils(page, new CookieUtils());
        await loginUtils.performLogin(user, role);

        // Optionally save storage state here if needed
        await context.storageState({ path: user.sessionFile });

        return { page, user, context };
      } catch (error) {
        console.error(`Failed to create logged-in page for ${role}:`, error);
        throw error;
      }
    }
    await use(getLoggedInPage);
  },

  lighthousePort: [
    async ({}, use) => {
      const port = await getPort();
      await use(port);
    },
    { scope: "worker" },
  ],
});

export const expect = test.expect;
