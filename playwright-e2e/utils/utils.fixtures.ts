import { chromium } from "@playwright/test";
import { config, ConfigFixture } from "./config.utils";
import { LighthouseUtils } from "./lighthouse.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";

export interface UtilsFixtures {
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  config: ConfigFixture;
  lighthouseUtils: LighthouseUtils;
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
  lighthouseUtils: [
    async ({}, use) => {
      const userDataDir = config.sessionStoragePath;
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=9222`],
      });
      await use(context);
    },
    { scope: "test" },
  ],
};
