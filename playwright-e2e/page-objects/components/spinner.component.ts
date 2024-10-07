import { Page } from "@playwright/test";
import { WaitUtils } from "../../utils/wait.utils";
import { Base } from "../base";

export class SpinnerComponent extends Base {
  readonly spinner = this.page.locator("xuilib-loading-spinner");
  private waitUtils = new WaitUtils();

  constructor(page: Page) {
    super(page);
  }

  async wait() {
    await this.waitUtils.waitForLocatorVisibility(this.spinner, {
      shouldBeVisible: false,
    });
  }
}
