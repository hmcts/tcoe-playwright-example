import {
  AxeUtils,
  BrowserUtils,
  LighthouseUtils,
  SessionUtils,
  TableUtils,
  WaitUtils,
  IdamUtils,
} from "@hmcts/playwright-common";
import os from "os";
import path from "path";
import { chromium, Page } from "playwright/test";
import { config, Config } from "./config.utils";
import { CookieUtils } from "./cookie.utils";
import { ValidatorUtils } from "./validator.utils";
import { CitizenUserUtils } from "./citizen-user.utils";

export interface UtilsFixtures {
  config: Config;
  cookieUtils: CookieUtils;
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  SessionUtils: typeof SessionUtils;
  browserUtils: BrowserUtils;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  idamUtils: IdamUtils;
  citizenUserUtils: CitizenUserUtils;
}

export const utilsFixtures = {
  config: async ({}, use) => {
    await use(config);
  },
  cookieUtils: async ({}, use) => {
    await use(new CookieUtils());
  },
  waitUtils: async ({}, use) => {
    await use(new WaitUtils());
  },
  tableUtils: async ({}, use) => {
    await use(new TableUtils());
  },
  validatorUtils: async ({}, use) => {
    await use(new ValidatorUtils());
  },
  lighthouseUtils: async ({ lighthousePage, lighthousePort }, use) => {
    await use(new LighthouseUtils(lighthousePage, lighthousePort));
  },
  axeUtils: async ({ page }, use) => {
    await use(new AxeUtils(page));
  },
  SessionUtils: async ({}, use) => {
    await use(SessionUtils);
  },
  browserUtils: async ({ browser }, use) => {
    await use(new BrowserUtils(browser));
  },
  idamUtils: async ({}, use) => {
    await use(new IdamUtils());
  },
  citizenUserUtils: async ({}, use) => {
    await use(CitizenUserUtils);
  },
  lighthousePage: async ({ lighthousePort, page, SessionUtils }, use, testInfo) => {
    // Prevent creating performance page if not needed
    if (testInfo.tags.includes("@performance")) {
      // Lighthouse opens a new page and as playwright doesn't share context we need to
      // explicitly create a new browser with shared context
      const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      // Using the cookies from global setup, inject to the new browser
      await context.addCookies(
        SessionUtils.getCookies(config.users.caseManager.sessionFile)
      );
      // Provide the page to the test
      await use(context.pages()[0]);
      await context.close();
    } else {
      await use(page);
    }
  }
};
