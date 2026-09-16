import { TableUtils } from "@hmcts/playwright-common";
import { Page, Locator } from "@playwright/test";
import { ValidatorUtils } from "../../../utils";

export class CuiCaseListComponent {
  readonly caseList: Locator;
  readonly tabList: Locator;
  readonly draftTab: Locator;
  readonly draftCases: Locator;
  readonly activeTab: Locator;
  readonly activeCases: Locator;
  readonly closedTab: Locator;
  readonly closedCases: Locator;
  private validator = new ValidatorUtils();

  constructor(private page: Page) {
    this.caseList = this.page.locator("[data-module='govuk-tabs']");
    this.tabList = this.page.getByRole("tablist");
    this.draftTab = this.tabList.locator("#tab_draft-cases");
    this.draftCases = this.page.locator("#draft-cases");
    this.activeTab = this.tabList.locator("#tab_active-cases");
    this.activeCases = this.page.locator("#active-cases");
    this.closedTab = this.tabList.locator("#tab_closed-cases");
    this.closedCases = this.page.locator("#closed-cases");
  }

  async getDraftTable() {
    return await new TableUtils().mapCitizenTable(
      this.draftCases.locator("table")
    );
  }

  async validateDraftTable() {
    const draftTable = await this.getDraftTable();
    draftTable.forEach((row) => {
      this.validator.validateCaseNumber(row["Case number"]);
      this.validator.validateCaseType(row["Case type"]);
      this.validator.validateStatus(row["Status"]);
      this.validator.validateDate(row["Created date"]);
    });
  }

  async validateWelshDraftTable() {
    const draftTable = await this.getDraftTable();
    draftTable.forEach((row) => {
      this.validator.validateCaseNumber(row["Rhif yr achos"]);
      this.validator.validateCaseType(row["Math o achos"]);
      this.validator.validateStatus(row["Statws"]);
      this.validator.validateDate(row["Dyddiad creu"]);
    });
  }
}
