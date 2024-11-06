import os from "os";
import path from "path";
import { chromium, Page } from "playwright/test";
import { AxeUtils } from "./axe.utils";
import { config, Config, getCookies } from "./config.utils";
import { LighthouseUtils } from "./lighthouse.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";

export interface UtilsFixtures {
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  config: Config;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
}

export const utilsFixtures = {
  waitUtils: async ({}, use) => {
    await use(new WaitUtils());
  },
  tableUtils: async ({}, use) => {
    await use(new TableUtils());
  },
  validatorUtils: async ({}, use) => {
    await use(new ValidatorUtils());
  },
  config: async ({}, use) => {
    await use(config);
  },
  lighthouseUtils: async ({}, use) => {
    await use(new LighthouseUtils());
  },
  axeUtils: async ({ page }, use) => {
    await use(new AxeUtils(page));
  },
  lighthousePage: async ({ lighthousePort, page }, use, testInfo) => {
    // Prevent creating performance page if not needed
    if (testInfo.tags.includes("@performance")) {
      // Lighthouse opens a new page and as playwright doesn't share context we need to
      // explicitly create a new browser with shared context
      const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      // Using the cookies from global setup, inject to the new browser
      await context.addCookies(getCookies(config.users.citizen.sessionFile));
      // Provide the page to the test
      await use(context.pages()[0]);
      await context.close();
    } else {
      await use(page);
    }
  },
};
