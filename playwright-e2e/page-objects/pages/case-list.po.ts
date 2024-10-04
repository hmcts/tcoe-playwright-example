import { expect, Page } from "@playwright/test";
import BasePage from "../base.page";
import { ExUiHeaderComponent } from "../components/exui-header.component";
import { CaseListComponent } from "../components/case-list.component";

export class CaseListPage extends BasePage {
  readonly container = this.page.locator("exui-case-home");
  readonly exuiHeader = new ExUiHeaderComponent(this.page, this.container);
  readonly caseListComponent = new CaseListComponent(this.page, this.container);

  constructor(page: Page) {
    super(page);
  }
}
