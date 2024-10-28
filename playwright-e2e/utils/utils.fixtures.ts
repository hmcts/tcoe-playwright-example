import { config, ConfigFixture } from "./config.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";
import AxeBuilder from "@axe-core/playwright";

// Extend UtilsFixtures to include makeAxeBuilder
export interface UtilsFixtures {
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  config: ConfigFixture;
  makeAxeBuilder: () => AxeBuilder; // Add makeAxeBuilder to the interface
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
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () => new AxeBuilder({ page })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22a",
        "wcag22aa",
      ]);
    await use(makeAxeBuilder);
  },
};
