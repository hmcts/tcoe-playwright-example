import { Page } from "@playwright/test";
import { Base } from "../base";

export class IdamPage extends Base {
  readonly heading = this.page.getByRole("heading", {
    name: "Sign in or create an account",
  });
  readonly usernameInput = this.page.locator("#username");
  readonly passwordInput = this.page.locator("#password");
  readonly submitBtn = this.page.locator('[name="save"]');

  constructor(page: Page) {
    super(page);
  }

  async logIn(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }
}
