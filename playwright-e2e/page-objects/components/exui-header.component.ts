import { expect, Locator, Page } from "@playwright/test";
import { WaitUtils } from "../../utils/wait.utils";

export class ExUiHeaderComponent {
  readonly exuiHeader = this.root.locator("exui-header");
  readonly results = this.root.locator("ccd-search-result");
  private waitUtils = new WaitUtils();

  constructor(private page: Page, private root: Locator) {}

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.results, {
      shouldBeVisible: true,
      delay: 5000,
    });
    await expect(this.exuiHeader).toBeVisible();
  }
}
