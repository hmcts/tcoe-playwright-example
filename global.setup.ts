import { test as setup } from "@playwright/test";
import { IdamPage } from "./playwright-e2e/page-objects/pages/idam.po";
import { config } from "./playwright.config";

setup("Set up", async ({ page }) => {
  // Log in using the solicitor user and save session
  const idam = new IdamPage(page);
  await page.goto(config.urls.manageCaseBaseUrl);
  await idam.login(config.users.exui.username, config.users.exui.password);
});
