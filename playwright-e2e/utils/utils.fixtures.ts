import { CommandOptions, macOSActivate, voiceOver } from "@guidepup/guidepup";
import { VoiceOverPlaywright } from "@guidepup/playwright";
import os from "os";
import path from "path";
import { chromium, Page } from "playwright/test";
import { AxeUtils } from "./axe.utils";
import { BrowserUtils } from "./browser.utils";
import { config, Config, getCookies } from "./config.utils";
import { LighthouseUtils } from "./lighthouse.utils";
import { TableUtils } from "./table.utils";
import { ValidatorUtils } from "./validator.utils";
import { WaitUtils } from "./wait.utils";

export interface UtilsFixtures {
  config: Config;
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  browserUtils: BrowserUtils;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  voiceOver: VoiceOverPlaywright;
  voiceOverStartOptions: CommandOptions;
}

export const utilsFixtures = {
  config: async ({}, use) => {
    await use(config);
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
  browserUtils: async ({ browser }, use) => {
    await use(new BrowserUtils(browser));
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
  voiceOverStartOptions: {},
  voiceOver: async ({ browserName, page, voiceOverStartOptions }, use) => {
    const voiceOverPlaywright = voiceOver as VoiceOverPlaywright;
    try {
      const applicationName = "chromium";

      if (!applicationName) {
        throw new Error(`Browser ${browserName} is not installed.`);
      }

      voiceOverPlaywright.navigateToWebContent = async () => {
        // Ensure application is brought to front and focused.
        await macOSActivate(applicationName);

        // Ensure the document is ready and focused.
        await page.bringToFront();
        await page.locator("body").waitFor();
        await page.locator("body").focus();

        // Navigate to the beginning of the web content.
        await voiceOverPlaywright.interact();
        await voiceOverPlaywright.perform(
          voiceOverPlaywright.keyboardCommands.jumpToLeftEdge
        );

        // Clear out logs.
        await voiceOverPlaywright.clearItemTextLog();
        await voiceOverPlaywright.clearSpokenPhraseLog();
      };

      await voiceOverPlaywright.start(voiceOverStartOptions);
      await macOSActivate(applicationName);
      await use(voiceOverPlaywright);
    } finally {
      try {
        await voiceOverPlaywright.stop();
      } catch {
        // swallow stop failure
      }
    }
  },
};
