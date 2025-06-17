import { Page } from "@playwright/test";
import { config } from "../../../utils/";
import { Base } from "../../base";

export class CuiCaseListPage extends Base {
  readonly container = this.page.getByRole("main");
  readonly banner = this.page.getByRole("banner");
  readonly activateAccessCodeLink = this.page.getByRole("link", {
    name: "Activate access code",
  });
  readonly textFixtures = {
    en: { heading: "Child arrangements and family injunction cases" },
    cy: { heading: "Achosion trefniadau plant a gwaharddebau teulu" },
  };

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(config.urls.citizenUrl + "dashboard?lng=en");
  }
}
