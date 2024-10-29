import { chromium, Page } from "@playwright/test";
import getPort from "get-port";
import os from "os";
import path from "path";
import { config, Config, getCookies } from "./config.utils";
import { LighthouseUtils } from "./lighthouse.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";

export interface UtilsFixtures {
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  config: Config;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  lighthousePort: number;
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
  lighthousePort: [
    async ({}, use) => {
      const port = await getPort();
      await use(port);
    },
    { scope: "worker" },
  ],
  lighthousePage: [
    async ({ lighthousePort }, use) => {
      // Lighthouse opens a new page and as playwright doesn't share context we need to explicitly
      // create a new browser with shared context
      const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      // Using the cookies from global setup, inject to the new browser
      await context.addCookies(getCookies(config.users.citizen.sessionFile));
      // Provide the page to the test
      await use(context.pages()[0]);
      await context.close();
    },
    { scope: "test" },
  ],
  lighthouseUtils: async ({}, use) => {
    await use(new LighthouseUtils());
  },
};
