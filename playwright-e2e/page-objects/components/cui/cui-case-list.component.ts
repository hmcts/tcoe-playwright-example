import { Locator, Page } from "@playwright/test";
import { TableUtils, ValidatorUtils } from "../../../utils";
import { Base } from "../../base";

export class cuiCaseListComponent extends Base {
  readonly caseList = this.root.locator("[data-module='govuk-tabs']");
  readonly tabList = this.root.getByRole("tablist");
  readonly draftTab = this.tabList.locator("#tab_draft-cases");
  readonly draftCases = this.root.locator("#draft-cases");
  readonly activeTab = this.tabList.locator("#tab_active-cases");
  readonly activeCases = this.root.locator("#active-cases");
  readonly closedTab = this.tabList.locator("#tab_closed-cases");
  readonly closedCases = this.root.locator("#closed-cases");
  private validator = new ValidatorUtils();

  constructor(page: Page, private root: Locator) {
    super(page);
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
