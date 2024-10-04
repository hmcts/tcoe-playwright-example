import { expect, Page } from "@playwright/test";
import BasePage from "../base.page";
import { ExUiHeaderComponent } from "../components/exui-header.component";
import { CaseListComponent } from "../components/case-list.component";
import { CaseDetailsComponent } from "../components/case-details.component";

export class CaseDetailsPage extends BasePage {
  readonly container = this.page.locator("exui-case-details-home");
  readonly caseDetailsComponent = new CaseDetailsComponent(
    this.page,
    this.container
  );

  constructor(page: Page) {
    super(page);
  }
}
