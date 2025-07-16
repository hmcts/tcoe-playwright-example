import {
  AxeUtils,
  BrowserUtils,
  IdamUtils,
  LighthouseUtils,
  LocaleUtils,
  SessionUtils,
  TableUtils,
  WaitUtils,
  ServiceAuthUtils
} from "@hmcts/playwright-common";
import os from "os";
import path from "path";
import { chromium, Page } from "playwright/test";
import { CitizenUserUtils } from "./citizen-user.utils";
import { config, Config } from "./config.utils";
import { CookieUtils } from "./cookie.utils";
import { ValidatorUtils } from "./validator.utils";

export interface UtilsFixtures {
  config: Config;
  cookieUtils: CookieUtils;
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  sessionUtils: typeof SessionUtils;
  browserUtils: BrowserUtils;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  idamUtils: IdamUtils;
  citizenUserUtils: CitizenUserUtils;
  localeUtils: LocaleUtils;
  serviceAuthUtils: ServiceAuthUtils;
}

export const utilsFixtures = {
  axeUtils: async ({ page }, use) => {
    await use(new AxeUtils(page));
  },
  browserUtils: async ({ browser }, use) => {
    await use(new BrowserUtils(browser));
  },
  citizenUserUtils: async ({ idamUtils }, use) => {
    await use(new CitizenUserUtils(idamUtils));
  },
  config: async ({}, use) => {
    await use(config);
  },
  cookieUtils: async ({}, use) => {
    await use(new CookieUtils());
  },
  idamUtils: async ({ config }, use) => {
    // Set required env vars for IDAM
    process.env.IDAM_WEB_URL = config.urls.idamWebUrl;
    process.env.IDAM_TESTING_SUPPORT_URL = config.urls.idamTestingSupportUrl;
    
    await use(new IdamUtils());
  },
  lighthousePage: async (
    { lighthousePort, page, sessionUtils },
    use,
    testInfo
  ) => {
    // Prevent creating performance page if not needed
    if (testInfo.tags.includes("@performance")) {
      const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      await context.addCookies(
        sessionUtils.getCookies(config.users.caseManager.sessionFile)
      );
      await use(context.pages()[0]);
      await context.close();
    } else {
      await use(page);
    }
  },
  lighthouseUtils: async ({ lighthousePage, lighthousePort }, use) => {
    await use(new LighthouseUtils(lighthousePage, lighthousePort));
  },
  localeUtils: async ({ page }, use) => {
    await use(new LocaleUtils(page));
  },
  sessionUtils: async ({}, use) => {
    await use(SessionUtils);
  },
  tableUtils: async ({}, use) => {
    await use(new TableUtils());
  },
  validatorUtils: async ({}, use) => {
    await use(new ValidatorUtils());
  },
  waitUtils: async ({}, use) => {
    await use(new WaitUtils());
  },
  serviceAuthUtils: async ({ config }, use) => {
    // Set required env vars for Service auth (S2S_TOKEN)
    process.env.S2S_URL = config.urls.serviceAuthUrl;
    await use(new ServiceAuthUtils());
  },
};
