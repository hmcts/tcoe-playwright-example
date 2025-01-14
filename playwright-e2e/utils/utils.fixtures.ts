import os from "os";
import path from "path";
import { chromium, Page } from "playwright/test";
import { AxeUtils } from "./axe.utils";
import { config, Config, getCookies } from "./config.utils";
import { LighthouseUtils } from "./lighthouse.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";
import { IdamAccessTokenUtils } from "./idam_access_token.utils";
import { IdamCreateCitizenUtils } from "./idam_create_citizen_user.utils";

export interface UtilsFixtures {
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  config: Config;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  idamAccessTokenUtils: IdamAccessTokenUtils;
  idamCitizenUserCreationUtils: IdamCreateCitizenUtils;
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
  lighthouseUtils: async ({ lighthousePage, lighthousePort }, use) => {
    await use(new LighthouseUtils(lighthousePage, lighthousePort));
  },
  axeUtils: async ({ page }, use) => {
    await use(new AxeUtils(page));
  },
  lighthousePage: async ({ lighthousePort, page }, use, testInfo) => {
    if (testInfo.tags.includes("@performance")) {
      const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      await context.addCookies(getCookies(config.users.citizen.sessionFile));
      await use(context.pages()[0]);
      await context.close();
    } else {
      await use(page);
    }
  },
  idamAccessTokenUtils: async ({}, use) => {
    await use(new IdamAccessTokenUtils());
  },
  idamCitizenUserCreationUtils: async ({}, use) => {
    await use(new IdamCreateCitizenUtils());
  },
};
