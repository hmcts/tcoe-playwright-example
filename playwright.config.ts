import { CommonConfig, ProjectsConfig } from "@hmcts/playwright-common";
import { defineConfig, type ReporterDescription } from "@playwright/test";
import { cpus } from "node:os";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { version: appVersion } = require("./package.json") as { version: string };

const apiSpecPattern = /tests\/api\/.*\.spec\.ts/;
const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on", "all"]);
const FALSY_FLAGS = new Set(["0", "false", "no", "off"]);

const resolveDefaultReporterNames = () => {
  const override = process.env.PLAYWRIGHT_DEFAULT_REPORTER;
  if (override?.trim()) {
    return override
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }
  return [process.env.CI ? "dot" : "list"];
};

const safeBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue;
  const normalised = value.trim().toLowerCase();
  if (TRUTHY_FLAGS.has(normalised)) return true;
  if (FALSY_FLAGS.has(normalised)) return false;
  return defaultValue;
};

const resolveOdhinApiLogMode = (): "off" | "api-only" | "all" => {
  const value = process.env.PW_ODHIN_API_LOGS?.trim().toLowerCase();
  if (!value) {
    return "api-only";
  }
  if (FALSY_FLAGS.has(value)) {
    return "off";
  }
  if (value === "api" || value === "api-only") {
    return "api-only";
  }
  if (TRUTHY_FLAGS.has(value) || value === "all") {
    return "all";
  }
  return "api-only";
};

const resolveOdhinTestOutput = (): boolean | "only-on-failure" => {
  const configured = process.env.PW_ODHIN_TEST_OUTPUT;
  if (configured?.trim()) {
    const normalised = configured.trim().toLowerCase();
    if (normalised === "only-on-failure") {
      return "only-on-failure";
    }
    if (TRUTHY_FLAGS.has(normalised)) {
      return true;
    }
    if (FALSY_FLAGS.has(normalised)) {
      return false;
    }
  }

  return resolveOdhinApiLogMode() === "off" ? "only-on-failure" : true;
};

const resolveWorkerCount = () => {
  const configured = process.env.PLAYWRIGHT_WORKERS;
  if (configured) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const logical = cpus()?.length ?? 1;
  if (process.env.CI) {
    return 1;
  }
  if (logical <= 2) return 1;
  const approxPhysical = Math.max(1, Math.round(logical / 2));
  return Math.min(8, Math.max(2, approxPhysical));
};

const resolveReporters = (): ReporterDescription[] => {
  const configured = process.env.PLAYWRIGHT_REPORTERS
    ?.split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const reporterNames =
    configured?.length ? configured : resolveDefaultReporterNames();
  const reporters: ReporterDescription[] = [];

  for (const name of reporterNames) {
    const normalised = name.toLowerCase();
    switch (normalised) {
      case "list":
        reporters.push(["list"]);
        break;
      case "dot":
        reporters.push(["dot"]);
        break;
      case "html":
        reporters.push([
          "html",
          {
            open: process.env.PLAYWRIGHT_HTML_OPEN ?? "never",
            outputFolder:
              process.env.PLAYWRIGHT_HTML_OUTPUT ?? "playwright-report",
          },
        ]);
        break;
      case "line":
        reporters.push(["line"]);
        break;
      case "junit":
        reporters.push([
          "junit",
          {
            outputFile:
              process.env.PLAYWRIGHT_JUNIT_OUTPUT ?? "playwright-junit.xml",
          },
        ]);
        break;
      case "odhin":
      case "odhin-reports-playwright":
        reporters.push([
          "odhin-reports-playwright",
          {
            outputFolder:
              process.env.PW_ODHIN_OUTPUT ??
              "test-results/odhin-report",
            indexFilename:
              process.env.PW_ODHIN_INDEX ?? "playwright-odhin.html",
            title:
              process.env.PW_ODHIN_TITLE ??
              "tcoe-playwright-example Playwright",
            testEnvironment:
              process.env.PW_ODHIN_ENV ??
              `${process.env.TEST_ENVIRONMENT ?? (process.env.CI ? "ci" : "local")} | workers=${resolveWorkerCount()}`,
            project:
              process.env.PW_ODHIN_PROJECT ??
              "tcoe-playwright-example",
            release:
              process.env.PW_ODHIN_RELEASE ??
              `${appVersion} | branch=${process.env.GIT_BRANCH ?? "local"}`,
            startServer: safeBoolean(process.env.PW_ODHIN_START_SERVER, false),
            consoleLog: safeBoolean(process.env.PW_ODHIN_CONSOLE_LOG, true),
            consoleError: safeBoolean(
              process.env.PW_ODHIN_CONSOLE_ERROR,
              true
            ),
            testOutput: resolveOdhinTestOutput(),
          },
        ]);
        break;
      default:
        reporters.push([name]);
        break;
    }
  }

  return reporters;
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./playwright-e2e",
  snapshotDir: "./playwright-e2e/snapshots",
  ...CommonConfig.recommended,
  reporter: resolveReporters(),

  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "api",
      testMatch: apiSpecPattern,
      retries: 0,
    },
    {
      ...ProjectsConfig.chrome,
      dependencies: ["setup"],
      testIgnore: apiSpecPattern,
    },
    {
      ...ProjectsConfig.chromium,
      dependencies: ["setup"],
      testIgnore: apiSpecPattern,
    },
    {
      ...ProjectsConfig.edge,
      dependencies: ["setup"],
      testIgnore: apiSpecPattern,
    },
    {
      ...ProjectsConfig.firefox,
      dependencies: ["setup"],
      testIgnore: apiSpecPattern,
    },
    {
      ...ProjectsConfig.webkit,
      dependencies: ["setup"],
      testIgnore: apiSpecPattern,
    },
    {
      ...ProjectsConfig.tabletChrome,
      dependencies: ["setup"],
      testIgnore: apiSpecPattern,
    },
    {
      ...ProjectsConfig.tabletWebkit,
      dependencies: ["setup"],
      testIgnore: /tests\/api\/.*\.spec\.ts/,
    },
  ],
});
