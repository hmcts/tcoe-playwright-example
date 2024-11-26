import { Page } from "@playwright/test";
import { desktopConfig } from "lighthouse";
import { playAudit } from "playwright-lighthouse";

interface Thresholds {
  performance: number;
  accessibility: number;
  "best-practices": number;
}

export class LighthouseUtils {
  constructor(private lighthousePage: Page, private lighthousePort: number) {}

  private readonly DEFAULT_THRESHOLDS = {
    performance: 80,
    accessibility: 100,
    "best-practices": 100,
  };

  public async audit(thresholds?: Thresholds) {
    await playAudit({
      page: this.lighthousePage,
      thresholds: thresholds ? thresholds : this.DEFAULT_THRESHOLDS,
      port: this.lighthousePort,
      config: desktopConfig,
      reports: {
        formats: {
          html: true,
        },
        name: "lighthouse-report-" + Date.now().toString(),
        directory: "./test-results",
      },
    });
  }
}
