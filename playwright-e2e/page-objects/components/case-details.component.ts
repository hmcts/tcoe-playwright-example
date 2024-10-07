import { Locator, Page } from "@playwright/test";
import { Base } from "../base";

export class CaseDetailsComponent extends Base {
  readonly caseHeader = this.root.locator("ccd-case-header");

  constructor(page: Page, private root: Locator) {
    super(page);
  }
}
