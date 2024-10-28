import { Page } from "@playwright/test";
import { UserCredentials } from "../../utils/";
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

  async login(user: UserCredentials): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.submitBtn.click();
    await this.saveSession(user);
  }

  private async saveSession(user: UserCredentials) {
    await this.page.context().storageState({ path: user.sessionFile });
  }
}
