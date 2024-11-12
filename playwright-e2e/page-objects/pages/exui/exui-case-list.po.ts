import { Page } from "@playwright/test";
import { config } from "../../../utils";
import { Base } from "../../base";
import { ExuiCaseListComponent, ExuiHeaderComponent } from "../../components/";

export class ExuiCaseListPage extends Base {
  readonly container = this.page.locator("exui-case-home");
  readonly exuiHeader = new ExuiHeaderComponent(this.page, this.container);
  readonly exuiCaseListComponent = new ExuiCaseListComponent(
    this.page,
    this.container
  );

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(config.urls.manageCaseBaseUrl);
    await this.exuiHeader.checkIsVisible();
  }
}
