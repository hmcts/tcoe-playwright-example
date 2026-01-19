#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildCoverageRows, readCoverageSummary } from "@hmcts/playwright-common";

const summaryPath = path.resolve(process.env.COVERAGE_SUMMARY ?? "./coverage/coverage-summary.json");
const outputPath = path.resolve(process.env.COVERAGE_SUMMARY_TXT ?? "./coverage/coverage-summary.txt");

if (!fs.existsSync(summaryPath)) {
  console.log(`coverage-summary: no coverage file found at ${summaryPath}; skipping.`);
  process.exit(0);
}

const summary = readCoverageSummary(summaryPath);
if (!summary) {
  console.log(`coverage-summary: unable to parse coverage file at ${summaryPath}; skipping.`);
  process.exit(0);
}

// Write a human-readable summary for pipelines to publish
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, summary.textSummary, "utf8");

// Pretty-print to stdout as well
console.log(summary.textSummary);

// Also emit JSON rows for scripts that want to render tables (e.g., odhin/HTML injectors)
const rows = buildCoverageRows(summary.totals);
const jsonPath = outputPath.replace(/\.txt$/, ".json");
fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`coverage-summary: wrote ${outputPath} and ${jsonPath}`);
