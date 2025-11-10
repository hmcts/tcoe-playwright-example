import type { ApiClient } from "@hmcts/playwright-common";
import { ServiceAuthUtils } from "@hmcts/playwright-common";
import type { Logger } from "winston";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const ORIGINAL_ENV = process.env;

describe("ServiceAuthUtils integration", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.S2S_URL = "https://service-auth.example.test/lease";
    delete process.env.S2S_SECRET;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("omits the Authorization header when no secret is configured", async () => {
    const { client, postMock } = createClient();
    const logger = createLoggerMock();

    const utils = new ServiceAuthUtils({ client, logger });
    const token = await utils.retrieveToken({
      microservice: "tcoe_example",
    });

    expect(token).toBe("mock-token");
    const headers = postMock.mock.calls[0]?.[1]?.headers ?? {};
    expect(headers.Authorization).toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith(
      "No S2S secret provided; sending request without Authorization header.",
      { microservice: "tcoe_example" }
    );
  });

  it("adds the Authorization header when a secret is supplied at call time", async () => {
    const { client, postMock } = createClient();
    const utils = new ServiceAuthUtils({ client });

    await utils.retrieveToken({
      microservice: "tcoe_example",
      secret: "runtime-secret",
    });

    const headers = postMock.mock.calls[0]?.[1]?.headers ?? {};
    expect(headers.Authorization).toMatch(/^Basic /);
  });
});

function createClient() {
  const postMock = vi.fn().mockResolvedValue({
    data: "mock-token",
  });
  const client = {
    post: postMock,
    dispose: vi.fn(),
  } as unknown as ApiClient;
  return { client, postMock };
}

function createLoggerMock(): Logger {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  } as unknown as Logger;
}
