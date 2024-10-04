import { Page } from "@playwright/test";

export default abstract class {
  constructor(protected readonly page: Page) {}

  async open(url: string): Promise<void> {
    await this.page.goto(url);
  }
}
