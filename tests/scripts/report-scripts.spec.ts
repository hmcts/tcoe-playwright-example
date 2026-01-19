import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const rootDir = path.resolve(".");
const coverageScript = path.join(rootDir, "scripts", "coverage-summary.mjs");
const endpointsScript = path.join(rootDir, "scripts", "api-endpoints-report.mjs");

describe("reporting scripts", () => {
  it("writes coverage summary text and json when coverage-summary exists", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoe-coverage-"));
    const summaryPath = path.join(tmp, "coverage-summary.json");
    const outTxt = path.join(tmp, "summary.txt");

    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        total: {
          lines: { pct: 80, covered: 8, total: 10 },
          statements: { pct: 80, covered: 8, total: 10 },
          functions: { pct: 75, covered: 6, total: 8 },
          branches: { pct: 50, covered: 5, total: 10 },
        },
      }),
      "utf8"
    );

    execFileSync("node", [coverageScript], {
      env: { ...process.env, COVERAGE_SUMMARY: summaryPath, COVERAGE_SUMMARY_TXT: outTxt },
      stdio: "inherit",
    });

    const txt = fs.readFileSync(outTxt, "utf8");
    const jsonRows = JSON.parse(fs.readFileSync(outTxt.replace(/\.txt$/, ".json"), "utf8"));

    expect(txt).toContain("Coverage Summary");
    expect(jsonRows).toEqual([
      { metric: "Lines", percent: "80.00%", covered: 8, total: 10 },
      { metric: "Statements", percent: "80.00%", covered: 8, total: 10 },
      { metric: "Functions", percent: "75.00%", covered: 6, total: 8 },
      { metric: "Branches", percent: "50.00%", covered: 5, total: 10 },
    ]);
  });

  it("writes API endpoint hit counts", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoe-endpoints-"));
    const apiRoot = path.join(tmp, "tests", "api");
    fs.mkdirSync(apiRoot, { recursive: true });
    fs.writeFileSync(
      path.join(apiRoot, "first.spec.ts"),
      `
        await apiClient.get("/one");
        await apiClient.get("/one");
        await client.post("/two");
      `,
      "utf8"
    );

    const outJson = path.join(tmp, "endpoints.json");

    execFileSync("node", [endpointsScript], {
      env: {
        ...process.env,
        API_TEST_ROOT: apiRoot,
        API_ENDPOINTS_REPORT: outJson,
      },
      stdio: "inherit",
    });

    const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
    expect(report.totalHits).toBe(3);
    expect(report.endpoints).toEqual([
      { endpoint: "/one", hits: 2, percent: "66.67" },
      { endpoint: "/two", hits: 1, percent: "33.33" },
    ]);
  });

  it("exits gracefully when coverage file does not exist", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoe-missing-"));
    const summaryPath = path.join(tmp, "nonexistent.json");
    const outTxt = path.join(tmp, "summary.txt");

    const result = execFileSync("node", [coverageScript], {
      env: { ...process.env, COVERAGE_SUMMARY: summaryPath, COVERAGE_SUMMARY_TXT: outTxt },
      encoding: "utf8",
    });

    expect(result).toContain("no coverage file found");
    expect(fs.existsSync(outTxt)).toBe(false);
  });

  it("exits gracefully when coverage JSON is malformed", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoe-malformed-"));
    const summaryPath = path.join(tmp, "coverage-summary.json");
    const outTxt = path.join(tmp, "summary.txt");

    fs.writeFileSync(summaryPath, "{invalid json", "utf8");

    const result = execFileSync("node", [coverageScript], {
      env: { ...process.env, COVERAGE_SUMMARY: summaryPath, COVERAGE_SUMMARY_TXT: outTxt },
      encoding: "utf8",
    });

    expect(result).toContain("unable to parse coverage file");
    expect(fs.existsSync(outTxt)).toBe(false);
  });

  it("exits gracefully when API test folder does not exist", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoe-no-api-"));
    const apiRoot = path.join(tmp, "nonexistent", "api");
    const outJson = path.join(tmp, "endpoints.json");

    const result = execFileSync("node", [endpointsScript], {
      env: {
        ...process.env,
        API_TEST_ROOT: apiRoot,
        API_ENDPOINTS_REPORT: outJson,
      },
      encoding: "utf8",
    });

    expect(result).toContain("no folder found");
    expect(fs.existsSync(outJson)).toBe(false);
  });

  it("reports zero hits when no API calls found", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoe-empty-api-"));
    const apiRoot = path.join(tmp, "tests", "api");
    fs.mkdirSync(apiRoot, { recursive: true });
    fs.writeFileSync(
      path.join(apiRoot, "test.spec.ts"),
      `test("no api calls", async () => { expect(true).toBe(true); });`,
      "utf8"
    );

    const outJson = path.join(tmp, "endpoints.json");

    const result = execFileSync("node", [endpointsScript], {
      env: {
        ...process.env,
        API_TEST_ROOT: apiRoot,
        API_ENDPOINTS_REPORT: outJson,
      },
      encoding: "utf8",
    });

    expect(result).toContain("no API calls found");
    expect(fs.existsSync(outJson)).toBe(false);
  });
});
