import http from "node:http";
import type { AddressInfo } from "node:net";
import {
  ApiClientError,
  buildApiAttachment,
  isRetryableError,
  withRetry,
} from "@hmcts/playwright-common";
import { expect, test } from "../../fixtures";
import { shouldIncludeRawBodies } from "../../utils/api-telemetry";

// Retry timing constants
const RETRY_AFTER_MS = 1000;
const MIN_ELAPSED_MS = 900;

// Retry policy constants
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 50;
const MAX_BACKOFF_MS = 200;
const RETRY_TIMEOUT_MS = 3000;

test.describe("ApiClient extras @api", () => {
  test("returns 200 after honouring Retry-After header from 429 response", async ({
    createApiClient,
  }, testInfo) => {
    let attempts = 0;
    const server = http.createServer((_, res) => {
      if (attempts === 0) {
        attempts += 1;
        res.writeHead(429, {
          "content-type": "application/json",
          "retry-after": "1",
        });
        res.end(JSON.stringify({ error: "rate_limited" }));
        return;
      }

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const includeRawBodies = shouldIncludeRawBodies(process.env);
    const client = createApiClient({
      baseUrl,
      name: "rate-limit-api",
      captureRawBodies: includeRawBodies,
    });

    const start = Date.now();
    let firstError: ApiClientError | undefined;

    try {
      const response = await withRetry(
        () => client.get("/rate-limit", { throwOnError: true }),
        MAX_RETRY_ATTEMPTS,
        INITIAL_BACKOFF_MS,
        MAX_BACKOFF_MS,
        RETRY_TIMEOUT_MS,
        (error) => {
          if (!firstError && error instanceof ApiClientError) {
            firstError = error;
          }
          return isRetryableError(error);
        }
      );

      const elapsedMs = Date.now() - start;
      expect(response.status).toBe(200);
      expect(elapsedMs).toBeGreaterThanOrEqual(MIN_ELAPSED_MS);

      expect(firstError).toBeDefined();
      expect(firstError?.retryAfterMs).toBeGreaterThanOrEqual(RETRY_AFTER_MS);
      expect(firstError?.endpointPath).toBe("/rate-limit");
      expect(firstError?.correlationId).toBeDefined();
      expect(firstError?.elapsedMs).toBeGreaterThan(0);

      expect(firstError).toBeDefined();
      expect(!!firstError?.logEntry.rawResponse).toBe(includeRawBodies);

      const attachment = buildApiAttachment(firstError!.logEntry, {
        includeRaw: includeRawBodies,
      });
      await testInfo.attach(attachment.name, {
        body: attachment.body,
        contentType: attachment.contentType,
      });
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test("includes raw request/response bodies when PLAYWRIGHT_DEBUG_API=true", async ({
    createApiClient,
  }, testInfo) => {
    let attempts = 0;
    const server = http.createServer((_, res) => {
      if (attempts === 0) {
        attempts += 1;
        res.writeHead(429, {
          "content-type": "application/json",
          "retry-after": "1",
        });
        res.end(JSON.stringify({ error: "rate_limited" }));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const includeRawBodies = shouldIncludeRawBodies(process.env);
    const client = createApiClient({
      baseUrl,
      name: "rate-limit-api",
      captureRawBodies: includeRawBodies,
    });

    let firstError: ApiClientError | undefined;

    try {
      await withRetry(
        () => client.get("/rate-limit", { throwOnError: true }),
        MAX_RETRY_ATTEMPTS,
        INITIAL_BACKOFF_MS,
        MAX_BACKOFF_MS,
        RETRY_TIMEOUT_MS,
        (error) => {
          if (!firstError && error instanceof ApiClientError) {
            firstError = error;
          }
          return isRetryableError(error);
        }
      );

      expect(firstError).toBeDefined();
      const attachment = buildApiAttachment(firstError!.logEntry, {
        includeRaw: includeRawBodies,
      });
      await testInfo.attach(attachment.name, {
        body: attachment.body,
        contentType: attachment.contentType,
      });

      const payload = JSON.parse(attachment.body) as Record<string, unknown>;

      // Test validates that raw response handling respects PLAYWRIGHT_DEBUG_API flag
      // This assertion checks the presence/absence of rawResponse based on environment
      await testInfo.attach("debug-flag-status", {
        body: JSON.stringify({
          PLAYWRIGHT_DEBUG_API: process.env.PLAYWRIGHT_DEBUG_API,
          includeRawBodies,
          hasRawResponse: !!payload.rawResponse,
        }),
        contentType: "application/json",
      });

      expect(!!payload.rawResponse).toBe(includeRawBodies);
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
