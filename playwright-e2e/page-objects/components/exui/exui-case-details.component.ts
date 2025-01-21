import { Locator, Page } from "@playwright/test";
import { Base } from "../../base";

export class ExuiCaseDetailsComponent extends Base {
  readonly caseHeader = this.root.locator("ccd-case-header");
  readonly tabs = {
    documentsTab: this.root.getByRole("tab", { name: "Case documents" }),
  };
  readonly documentField = this.root.locator("ccd-read-document-field");

  constructor(page: Page, private root: Locator) {
    super(page);
  }

  public async getCaseNumber(): Promise<string> {
    const text = await this.caseHeader.textContent();
    const caseNumber = text!.match(/Casenumber: (.*)/);
    if (!caseNumber || !text) {
      throw new Error("Case number not found");
    }
    return caseNumber[1].trim();
  }
}
