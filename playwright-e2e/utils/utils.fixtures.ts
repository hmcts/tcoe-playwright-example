import { config, Config } from "./config.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";

export interface UtilsFixtures {
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  config: Config;
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
};
