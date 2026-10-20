import { WaitUtils } from "@hmcts/playwright-common";
import { expect, Page, Locator } from "@playwright/test";

export class ExuiHeaderComponent {
  readonly header: Locator;
  readonly results: Locator;
  private waitUtils = new WaitUtils();

  constructor(private page: Page) {
    this.header = this.page.locator("exui-header");
    this.results = this.page.locator("ccd-search-result");
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.results, {
      visibility: true,
    });
    await expect(this.header).toBeVisible();
  }
}
