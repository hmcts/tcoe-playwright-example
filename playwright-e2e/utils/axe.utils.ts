import { AxeBuilder } from "@axe-core/playwright";
import { Page, expect } from "@playwright/test";

interface AuditOptions {
  exclude?: string | string[];
}

export class AxeUtils {
  private readonly DEFAULT_TAGS = [
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22a",
    "wcag22aa",
  ];

  constructor(protected readonly page: Page) {}

  /**
   * Run the AxeBuilder checks using the pre-determined tags
   *
   * @param options {@link AuditOptions} - Optional config such as excluding element(s)
   *
   */
  public async audit(options?: AuditOptions) {
    const builder = new AxeBuilder({ page: this.page }).withTags(
      this.DEFAULT_TAGS
    );
    if (options?.exclude && options) builder.exclude(options.exclude);
    const results = await builder.analyze();
    expect.soft(results.violations).toEqual([]);
  }
}
