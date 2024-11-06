import { Page } from "@playwright/test";
import { desktopConfig } from "lighthouse";
import { playAudit } from "playwright-lighthouse";

interface Thresholds {
  performance: number;
  accessibility: number;
  "best-practices": number;
}

export class LighthouseUtils {
  private readonly DEFAULT_THRESHOLDS = {
    performance: 80,
    accessibility: 100,
    "best-practices": 100,
  };

  public async audit(page: Page, port: number, thresholds?: Thresholds) {
    await playAudit({
      page: page,
      thresholds: thresholds ? thresholds : this.DEFAULT_THRESHOLDS,
      port: port,
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
