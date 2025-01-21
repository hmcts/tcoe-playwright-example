import { Browser, BrowserContext } from "@playwright/test";

export class BrowserUtils {
  constructor(protected readonly browser: Browser) {}

  /**
   * Run the AxeBuilder checks using the pre-determined tags
   *
   * @param options {@link AuditOptions} - Optional config such as excluding element(s)
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
