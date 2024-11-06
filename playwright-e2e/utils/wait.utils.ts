import { Locator } from "@playwright/test";

interface WaitOptions {
  shouldBeVisible: boolean;
  delay?: number;
  timeout?: number;
}

export class WaitUtils {
  private DEFAULT_DELAY = 1000;
  private DEFAULT_TIMEOUT = 60000;

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Waits for a given locator to become visible
   *
   * @param locator {@link Locator} - The locator to wait for
   * @param options {@link WaitOptions} - Additional options
   *
   */
  public async waitForLocatorVisibility(
    locator: Locator,
    options: WaitOptions
  ): Promise<void> {
    const delay = options.delay ? options.delay : this.DEFAULT_DELAY;
    const timeout = options.timeout ? options.timeout : this.DEFAULT_TIMEOUT;
    const startTime = Date.now();

    while ((await locator.isVisible()) !== options.shouldBeVisible) {
      const elapsedTime = Date.now() - startTime;
      await this.wait(delay);
      if (elapsedTime > timeout) {
        throw new Error(`Timeout exceeded waiting for ${locator}`);
      }
    }
  }
}
