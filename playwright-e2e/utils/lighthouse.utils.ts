import { Page } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";

interface Thresholds {
  performance: number;
  accessibility: number;
  "best-practices": number;
  pwa: number;
}

export class LighthouseUtils {
  private readonly DEFAULT_THRESHOLDS = {
    performance: 80,
    accessibility: 100,
    "best-practices": 80,
    pwa: 80,
  };

  public async audit(page: Page, port: number, thresholds?: Thresholds) {
    await playAudit({
      page: page,
      thresholds: thresholds ? thresholds : this.DEFAULT_THRESHOLDS,
      port: port,
    });
  }
}
