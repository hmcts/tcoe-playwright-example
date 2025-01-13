import { Page } from "@playwright/test";
import { config } from "../../../utils/";
import { Base } from "../../base";

export class ActivateCasePinPage extends Base {
  readonly container = this.page.getByRole("main");
  readonly form = this.page.locator("#main-form");
  readonly caseNumber = this.page.locator("#caseCode");

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(config.urls.citizenUrl + "pin-activation/enter-pin");
  }
}
