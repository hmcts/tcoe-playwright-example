#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { scanApiEndpoints } from "@hmcts/playwright-common";

const root = path.resolve(
  process.env.API_TEST_ROOT ?? "./playwright-e2e/tests/api"
);
const outputPath = path.resolve(process.env.API_ENDPOINTS_REPORT ?? "./coverage/api-endpoints.json");

if (!fs.existsSync(root)) {
  console.log(`api-endpoints-report: no folder found at ${root}; skipping.`);
  process.exit(0);
}

const { endpoints, totalHits } = scanApiEndpoints(root);

if (!endpoints.length) {
  console.log(`api-endpoints-report: no API calls found under ${root}; nothing to report.`);
  process.exit(0);
}

const rows = endpoints.map(({ endpoint, hits }) => {
  const percent = totalHits ? ((hits / totalHits) * 100).toFixed(2) : "0.00";
  return { endpoint, hits, percent };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ totalHits, endpoints: rows }, null, 2), "utf8");

console.log(`api-endpoints-report: scanned ${root}`);
console.log(`Total calls: ${totalHits}`);
rows.forEach((row) => {
  console.log(`${row.endpoint} -> ${row.hits} (${row.percent}%)`);
});
console.log(`api-endpoints-report: wrote ${outputPath}`);
