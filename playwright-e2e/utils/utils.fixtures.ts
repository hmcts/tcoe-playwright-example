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
import os from "os";
import path from "path";
import { chromium, Page } from "playwright/test";
import { CitizenUserUtils } from "./citizen-user.utils";
import { config, Config } from "./config.utils";
import { CookieUtils } from "./cookie.utils";
import { ValidatorUtils } from "./validator.utils";
import {
  ApiRecorder,
  shouldAttachApiLogs,
  shouldEmitApiLogsToStdout,
  shouldIncludeRawBodies,
} from "./api-telemetry";

type LoggerInstance = ReturnType<typeof createLogger>;

export type ApiClientFactory = (options: ApiClientOptions) => ApiClient;

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
  localeUtils: LocaleUtils;
  serviceAuthUtils: ServiceAuthUtils;
  logger: LoggerInstance;
  apiRecorder: ApiRecorder;
  createApiClient: ApiClientFactory;
}

export const utilsFixtures = {
  logger: async ({}, use, testInfo) => {
    const logger = createLogger({
      serviceName: "tcoe-playwright-example",
      defaultMeta: {
        testId: `${testInfo.project.name}::${testInfo.title}`,
      },
    });
    await use(logger);
  },
  apiRecorder: async ({}, use, testInfo) => {
    const includeRawBodies = shouldIncludeRawBodies(process.env);
    const recorder = new ApiRecorder(includeRawBodies);
    await use(recorder);
    if (recorder.hasEntries()) {
      if (shouldAttachApiLogs(process.env)) {
        await testInfo.attach("api-calls.json", {
          body: recorder.toJson(),
          contentType: "application/json",
        });
      }

      if (shouldEmitApiLogsToStdout(process.env, testInfo.project.name)) {
        const header = `[API CALLS][${testInfo.project.name}] ${testInfo.title}`;
        // Emit the payload to stdout so the Odhín reporter can capture it.
        console.log(`${header}\n${recorder.toJson(includeRawBodies)}\n[API CALLS][END]`);
      }

      recorder.clear();
    }
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
