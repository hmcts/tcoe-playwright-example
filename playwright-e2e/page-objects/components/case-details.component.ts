import { expect, Locator, Page } from "@playwright/test";
import { WaitUtils } from "../../utils/wait.utils";
import { SpinnerComponent } from "./spinner.component";

export class CaseDetailsComponent {
  readonly caseHeader = this.root.locator("ccd-case-header");

  constructor(private page: Page, private root: Locator) {}
}
