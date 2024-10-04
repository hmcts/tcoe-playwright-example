import { expect, Locator, Page } from "@playwright/test";
import { WaitUtils } from "../../utils/wait.utils";

export class SpinnerComponent {
  readonly spinner = this.page.locator("xuilib-loading-spinner");
  private waitUtils = new WaitUtils();

  constructor(private page: Page) {}

  async wait() {
    await this.waitUtils.waitForLocatorVisibility(this.spinner, {
      shouldBeVisible: false,
    });
  }
}
