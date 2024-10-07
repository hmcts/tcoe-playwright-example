import { Page } from "@playwright/test";
import { Base } from "../base";
import { CaseDetailsComponent } from "../components/case-details.component";

export class CaseDetailsPage extends Base {
  readonly container = this.page.locator("exui-case-details-home");
  readonly caseDetailsComponent = new CaseDetailsComponent(
    this.page,
    this.container
  );

  constructor(page: Page) {
    super(page);
  }
}
