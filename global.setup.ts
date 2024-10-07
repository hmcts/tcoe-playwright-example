import { test as setup } from "@playwright/test";
import { IdamPage } from "./playwright-e2e/page-objects/pages/idam.po";

setup("Set up", async ({ page }) => {
  // Log in using the solicitor user and save session
  const idam = new IdamPage(page);
  await page.goto(process.env.MANAGE_CASES_BASE_URL!);
  await idam.login(
    process.env.SOLICITOR_USERNAME!,
    process.env.SOLICITOR_PASSWORD!
  );
});
