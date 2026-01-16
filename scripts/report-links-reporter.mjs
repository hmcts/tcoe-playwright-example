import path from "node:path";

export default class ReportLinksReporter {
  constructor(options = {}) {
    this.emitHtml = options.emitHtml ?? false;
    this.emitOdhin = options.emitOdhin ?? false;
    this.htmlOutput = options.htmlOutput ?? "playwright-report";
    this.htmlIndex = options.htmlIndex ?? "index.html";
    this.odhinOutput = options.odhinOutput ?? "test-results/odhin-report";
    this.odhinIndex = options.odhinIndex ?? "playwright-odhin.html";
  }

  onEnd() {
    const lines = [];
    if (this.emitHtml) {
      lines.push(
        `[REPORT] HTML report: ${path.resolve(this.htmlOutput, this.htmlIndex)}`
      );
    }
    if (this.emitOdhin) {
      lines.push(
        `[REPORT] Odhín report: ${path.resolve(
          this.odhinOutput,
          this.odhinIndex
        )}`
      );
    }
    if (lines.length > 0) {
      console.log(lines.join("\n"));
    }
  }
}
