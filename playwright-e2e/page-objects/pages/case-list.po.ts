import { Page } from "@playwright/test";
import { Base } from "../base";
import { CaseListComponent } from "../components/case-list.component";
import { ExUiHeaderComponent } from "../components/exui-header.component";

export class CaseListPage extends Base {
  readonly container = this.page.locator("exui-case-home");
  readonly exuiHeader = new ExUiHeaderComponent(this.page, this.container);
  readonly caseListComponent = new CaseListComponent(this.page, this.container);

  constructor(page: Page) {
    super(page);
  }
}
