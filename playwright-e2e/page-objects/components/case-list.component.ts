import { Locator, Page } from "@playwright/test";
import { Base } from "../base";
import { SpinnerComponent } from "./spinner.component";

export class CaseListComponent extends Base {
  readonly caseList = this.root.locator("exui-case-list");
  readonly filters = {
    caseNameFilter: this.root.locator("#applicantCaseName"),
    applyFilterBtn: this.root.getByTitle("Apply filter"),
  };
  readonly resultLinks = this.root.locator("ccd-search-result .govuk-link");
  private spinnerComponent = new SpinnerComponent(this.page);

  constructor(page: Page, private root: Locator) {
    super(page);
  }

  public async searchByCaseName(caseName: string): Promise<void> {
    await this.filters.caseNameFilter.fill(caseName);
    await this.filters.applyFilterBtn.click();
    await this.spinnerComponent.wait();
  }

  public async selectCaseByIndex(index: number) {
    await this.resultLinks.nth(index).click();
    await this.spinnerComponent.wait();
  }
}
