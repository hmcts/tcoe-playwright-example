import {
  ApiClient,
  ApiClientOptions,
  ApiLogEntry,
  AxeUtils,
  BrowserUtils,
  IdamUtils,
  LighthouseUtils,
  LocaleUtils,
  ServiceAuthUtils,
  SessionUtils,
  TableUtils,
  WaitUtils,
  createChildLogger,
  createLogger,
} from "@hmcts/playwright-common";
import os from "node:os";
import path from "node:path";
import { chromium, Page, TestInfo } from "playwright/test";
import { CitizenUserUtils } from "./citizen-user.utils";
import { config, Config } from "./config.utils";
import { CookieUtils } from "./cookie.utils";
import { ProfessionalUserUtils } from "./professional-user.utils";
import { type SeedManifest, loadSeedManifest } from "./seed-manifest";
import { ValidatorUtils } from "./validator.utils";
import { type XsrfHeaderBuilder, buildXsrfHeaders } from "./xsrf.utils";
import {
  ApiRecorder,
  buildApiAttachmentPayload,
  buildApiLogSummary,
  formatBytes,
  resolveApiAttachmentLimit,
  resolveApiLogStdoutLimit,
  resolveApiMaxFieldChars,
  resolveApiMaxLogs,
  resolveApiStdoutMode,
  resolveApiSummaryLimit,
  shouldAttachApiLogs,
  shouldEmitApiLogsToStdout,
  shouldIncludeRawBodies,
  truncateApiLogPayload,
} from "./api-telemetry";

type LoggerInstance = ReturnType<typeof createLogger>;

export type ApiClientFactory = (options: ApiClientOptions) => ApiClient;

/**
 * Helper: Attach API call logs to Playwright test report with annotations.
 */
function attachApiLogsToReport(
  recorder: ApiRecorder,
  testInfo: TestInfo,
  includeRawBodies: boolean
): void {
  const stats = recorder.stats();
  const attachmentLimit = resolveApiAttachmentLimit(process.env);
  const attachment = buildApiAttachmentPayload(recorder, {
    includeRawBodies,
    limitBytes: attachmentLimit,
    summaryLimit: resolveApiSummaryLimit(process.env),
  });
  
  void testInfo.attach("api-calls.json", {
    body: attachment.payload,
    contentType: "application/json",
  });

  const annotations: string[] = [];
  if (attachment.note) {
    annotations.push(attachment.note);
  }
  if (stats.droppedEntries > 0) {
    annotations.push(
      `${stats.droppedEntries} API entr${
        stats.droppedEntries === 1 ? "y was" : "ies were"
      } dropped after exceeding PW_ODHIN_API_MAX_LOGS.`
    );
  }
  if (stats.trimmedFields > 0) {
    annotations.push(
      `${stats.trimmedFields} API field${
        stats.trimmedFields === 1 ? "" : "s"
      } were truncated to respect PW_ODHIN_API_MAX_FIELD_CHARS.`
    );
  }
  
  for (const note of annotations) {
    testInfo.annotations.push({
      type: "info",
      description: note,
    });
  }
}

/**
 * Helper: Emit API call logs to stdout in summary or full mode.
 */
function emitApiLogsToStdout(
  recorder: ApiRecorder,
  testInfo: TestInfo,
  includeRawBodies: boolean
): void {
  const header = `[API CALLS][${testInfo.project.name}] ${testInfo.title}`;
  const stdoutMode = resolveApiStdoutMode(process.env);
  const logLines = [header];

  if (stdoutMode === "summary") {
    const { summary, truncated } = buildApiLogSummary(
      recorder.toArray(),
      resolveApiSummaryLimit(process.env)
    );
    logLines.push(summary);
    if (truncated > 0) {
      const noun = truncated === 1 ? "entry" : "entries";
      logLines.push(
        `[API CALLS][TRUNCATED] ${truncated} ${noun} omitted from stdout. Review the attached api-calls.json for full details or raise PW_ODHIN_API_SUMMARY_LINES.`
      );
    }
  } else {
    const payload = recorder.toJson(includeRawBodies);
    const limitBytes = resolveApiLogStdoutLimit(process.env);
    const { payload: truncatedPayload, truncatedBytes } =
      truncateApiLogPayload(payload, limitBytes);
    logLines.push(truncatedPayload);
    if (truncatedBytes > 0) {
      logLines.push(
        `[API CALLS][TRUNCATED] ${formatBytes(
          truncatedBytes
        )} omitted. Increase PW_ODHIN_API_STDOUT_KB or inspect api-calls.json.`
      );
    }
  }

  logLines.push("[API CALLS][END]");
  console.log(logLines.filter(Boolean).join("\n"));
}

export interface UtilsFixtures {
  config: Config;
  cookieUtils: CookieUtils;
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  SessionUtils: typeof SessionUtils;
  browserUtils: BrowserUtils;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  idamUtils: IdamUtils;
  citizenUserUtils: CitizenUserUtils;
  professionalUserUtils: ProfessionalUserUtils;
  localeUtils: LocaleUtils;
  serviceAuthUtils: ServiceAuthUtils;
  logger: LoggerInstance;
  apiRecorder: ApiRecorder;
  createApiClient: ApiClientFactory;
  xsrfHeaders: XsrfHeaderBuilder;
}

export interface UtilsWorkerFixtures {
  seedManifest: SeedManifest;
}

export const utilsFixtures = {
  /**
   * Winston logger instance configured for test execution.
   * Test-scoped: creates a new logger for each test with test metadata.
   */
   
  logger: async ({}, use, testInfo) => {
    const logger = createLogger({
      serviceName: "tcoe-playwright-example",
      defaultMeta: {
        testId: `${testInfo.project.name}::${testInfo.title}`,
      },
    });
    await use(logger);
  },
  /**
   * Records API calls for attachment to Playwright reports.
   * Test-scoped: captures all API calls during test execution.
   * 
   * @remarks
   * Behaviour controlled by environment variables:
   * - `PLAYWRIGHT_ATTACH_API_LOGS`: attach logs to test report (default: failed tests only)
   * - `PLAYWRIGHT_STDOUT_API_LOGS`: emit logs to stdout
   * - `PLAYWRIGHT_API_MAX_LOGS`: max entries to record before dropping (default: 100)
   * - `PLAYWRIGHT_API_MAX_FIELD_CHARS`: max characters per field before truncation (default: 2000)
   * - `PLAYWRIGHT_DEBUG_API`: include raw request/response bodies (default: false, use only for local debugging)
   * - `PW_ODHIN_API_SUMMARY_LINES`: max lines in stdout summary mode (default: 50)
   * - `PW_ODHIN_API_STDOUT_KB`: max KB for stdout full mode (default: 100)
   * 
   * @see {@link resolveApiMaxLogs} for defaults
   * @see {@link shouldAttachApiLogs} for attachment logic
   * @see {@link shouldIncludeRawBodies} for security controls
   */
   
  apiRecorder: async ({}, use, testInfo) => {
    const includeRawBodies = shouldIncludeRawBodies(process.env);
    const recorder = new ApiRecorder(includeRawBodies, {
      maxEntries: resolveApiMaxLogs(process.env),
      maxFieldChars: resolveApiMaxFieldChars(process.env),
    });
    await use(recorder);
    
    if (!recorder.hasEntries()) {
      return;
    }

    const attachLogs =
      shouldAttachApiLogs(process.env) && testInfo.status === "failed";
    
    if (attachLogs) {
      attachApiLogsToReport(recorder, testInfo, includeRawBodies);
    }

    if (shouldEmitApiLogsToStdout(process.env, testInfo.project.name)) {
      emitApiLogsToStdout(recorder, testInfo, includeRawBodies);
    }

    recorder.clear();
  },
  /**
   * Builder function for XSRF headers from session files.
   * Test-scoped: provides fresh header builder for each test.
   */
   
  xsrfHeaders: async ({}, use) => {
    await use(buildXsrfHeaders);
  },
  createApiClient: async ({ logger, apiRecorder }, use, testInfo) => {
    const clients: ApiClient[] = [];
    await use((options) => {
      const clientLogger = createChildLogger(logger, {
        testId: `${testInfo.project.name}::${testInfo.title}`,
        apiName: options.name ?? "api-client",
      });
      const client = new ApiClient({
        logger: clientLogger,
        captureRawBodies: apiRecorder.includeRawBodies,
        onResponse: (entry: ApiLogEntry) => apiRecorder.record(entry),
        ...options,
      });
      clients.push(client);
      return client;
    });

    await Promise.all(clients.map((client) => client.dispose()));
  },
   
  config: async ({}, use) => {
    await use(config);
  },
   
  cookieUtils: async ({}, use) => {
    await use(new CookieUtils());
  },
   
  waitUtils: async ({}, use) => {
    await use(new WaitUtils());
  },
   
  tableUtils: async ({}, use) => {
    await use(new TableUtils());
  },
   
  validatorUtils: async ({}, use) => {
    await use(new ValidatorUtils());
  },
  lighthouseUtils: async ({ lighthousePage, lighthousePort }, use) => {
    await use(new LighthouseUtils(lighthousePage, lighthousePort));
  },
  axeUtils: async ({ page }, use, testInfo) => {
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
    await axeUtils.generateReport(testInfo);
  },
   
  SessionUtils: async ({}, use) => {
    await use(SessionUtils);
  },
  browserUtils: async ({ browser }, use) => {
    await use(new BrowserUtils(browser));
  },
  idamUtils: async ({ config, logger, apiRecorder }, use) => {
    // Set required env vars for IDAM
    process.env.IDAM_WEB_URL = config.urls.idamWebUrl;
    process.env.IDAM_TESTING_SUPPORT_URL = config.urls.idamTestingSupportUrl;

    await use(
      new IdamUtils({
        logger: createChildLogger(logger, { component: "IdamUtils" }),
        apiClientOptions: {
          captureRawBodies: apiRecorder.includeRawBodies,
          onResponse: (entry: ApiLogEntry) => apiRecorder.record(entry),
        },
      })
    );
  },
  citizenUserUtils: async ({ idamUtils }, use) => {
    await use(new CitizenUserUtils(idamUtils));
  },
  professionalUserUtils: async ({ idamUtils }, use) => {
    await use(new ProfessionalUserUtils(idamUtils));
  },
  localeUtils: async ({ page }, use) => {
    await use(new LocaleUtils(page));
  },
  lighthousePage: async (
    { lighthousePort, page, SessionUtils },
    use,
    testInfo
  ) => {
    // Prevent creating performance page if not needed
    if (testInfo.tags.includes("@performance")) {
      // Lighthouse opens a new page and as playwright doesn't share context we need to
      // explicitly create a new browser with shared context
      const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      // Using the cookies from global setup, inject to the new browser
      await context.addCookies(
        SessionUtils.getCookies(config.users.caseManager.sessionFile)
      );
      // Provide the page to the test
      await use(context.pages()[0]);
      await context.close();
    } else {
      await use(page);
    }
  },
  serviceAuthUtils: async ({ config, logger, apiRecorder }, use) => {
    // Set required env vars for Service auth (S2S_URL)
    process.env.S2S_URL = config.urls.serviceAuthUrl;
    await use(
      new ServiceAuthUtils({
        logger: createChildLogger(logger, { component: "ServiceAuthUtils" }),
        apiClientOptions: {
          captureRawBodies: apiRecorder.includeRawBodies,
          onResponse: (entry: ApiLogEntry) => apiRecorder.record(entry),
        },
      })
    );
  },
};

export const utilsWorkerFixtures = {
  /**
   * Loads seed manifest containing deterministic test data IDs.
   * Worker-scoped: loaded once per worker process.
   * Fails fast if manifest is missing or invalid.
   */
  seedManifest: [
     
    async ({}, use: (manifest: SeedManifest) => Promise<void>) => {
      const manifest = loadSeedManifest();
      await use(manifest);
    },
    { scope: "worker" },
  ] as [
    (fixtures: object, use: (manifest: SeedManifest) => Promise<void>) => Promise<void>,
    { scope: "worker" },
  ],
};
