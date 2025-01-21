import { Browser, BrowserContext } from "@playwright/test";

export class BrowserUtils {
  constructor(protected readonly browser: Browser) {}

  /**
   * Opens a new browser context and returns the page
   *
   * @param sessionFile {@link string} - optionally provide a session file to use in the new browser context
   *
   */
  public async openNewBrowserContext(sessionFile?: string) {
    const browser: Browser = await this.browser.browserType().launch();
    const context: BrowserContext = await browser.newContext({
      storageState: sessionFile ? sessionFile : undefined,
    });
    return context.newPage();
  }
}
