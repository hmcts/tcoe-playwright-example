import { Page, expect } from "@playwright/test";
import { Base } from "../../base";

export class ExuiSpinnerComponent extends Base {
  readonly spinner = this.page.locator("xuilib-loading-spinner");

  constructor(page: Page) {
    super(page);
  }

  async wait() {
    await expect
      .poll(
        async () => {
          const spinnerCount = await this.spinner.count();
          return spinnerCount;
        },
        {
          timeout: 30_000,
        }
      )
      .toBe(0);
  }
}
