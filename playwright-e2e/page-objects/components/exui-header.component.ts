import { expect, Locator, Page } from "@playwright/test";
import { WaitUtils } from "../../utils/wait.utils";
import { Base } from "../base";

export class ExUiHeaderComponent extends Base {
  readonly exuiHeader = this.root.locator("exui-header");
  readonly results = this.root.locator("ccd-search-result");
  private waitUtils = new WaitUtils();

  constructor(page: Page, private root: Locator) {
    super(page);
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.results, {
      shouldBeVisible: true,
      delay: 5000,
    });
    await expect(this.exuiHeader).toBeVisible();
  }
}
