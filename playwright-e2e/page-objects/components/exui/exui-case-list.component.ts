import { Locator, Page } from "@playwright/test";
import { Base } from "../../base";
import { ExuiSpinnerComponent } from "./exui-spinner.component";

export class ExuiCaseListComponent extends Base {
  readonly caseList = this.root.locator("exui-case-list");
  readonly caseListTable = this.root.locator("#search-result table");
  readonly filters = {
    caseNameFilter: this.root.locator("#applicantCaseName"),
    caseNumberFilter: this.root.locator("#\\[CASE_REFERENCE\\]"),
    caseStateFilter: this.root.locator("select#wb-case-state"),
    applyFilterBtn: this.root.getByTitle("Apply filter"),
  };
  readonly resultLinks = this.root.locator("ccd-search-result .govuk-link");
  private spinnerComponent = new ExuiSpinnerComponent(this.page);

  constructor(page: Page, private root: Locator) {
    super(page);
  }

  public async searchByCaseName(caseName: string): Promise<void> {
    await this.filters.caseNameFilter.fill(caseName);
    await this.filters.applyFilterBtn.click();
    await this.spinnerComponent.wait();
  }

  public async searchByCaseNumber(caseNumber: string): Promise<void> {
    await this.filters.caseNumberFilter.fill(caseNumber);
    await this.filters.applyFilterBtn.click();
    await this.spinnerComponent.wait();
  }

  public async searchByCaseState(state: string) {
    await this.filters.caseStateFilter.selectOption(state);
    await this.filters.applyFilterBtn.click();
    await this.spinnerComponent.wait();
  }

  public async selectCaseByIndex(index: number) {
    await this.resultLinks.nth(index).click();
    await this.spinnerComponent.wait();
  }
}
