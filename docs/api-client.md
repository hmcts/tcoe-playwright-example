# ApiClient usage (with @hmcts/playwright-common)

This template is wired to the shared `ApiClient` from `@hmcts/playwright-common` to give you structured logging, redaction, retries, and safe attachments out of the box.

## Quickstart
```ts
import { ApiClient, withRetry, isRetryableError, buildApiAttachment } from "@hmcts/playwright-common";

const api = new ApiClient({
  baseUrl: process.env.BACKEND_BASE_URL,
  name: "backend",
  circuitBreaker: { enabled: true, options: { failureThreshold: 5, cooldownMs: 30000 } },
  captureRawBodies: false, // safe default for CI; enable only when debugging locally
});

// Make a call with retry tuned for 5xx/429/network errors
const res = await withRetry(
  () => api.get("/health", { throwOnError: true }),
  3,
  200,
  2000,
  15000,
  isRetryableError
);

// Attach the call (redacted; raw only if PLAYWRIGHT_DEBUG_API=true)
const attachment = buildApiAttachment(res.logEntry, { includeRaw: true });
```

## Defaults and safety
- **Timeout**: 30s per request (override with `timeoutMs` per call).
- **Raw bodies**: fail-closed. `buildApiAttachment` will only include raw payloads when `PLAYWRIGHT_DEBUG_API=true|1` or `NODE_ENV=development`. In CI, keep `includeRaw=false`.
- **Redaction**: common sensitive keys are masked by default; extend via `redaction.patterns` or `loggerOptions.redactKeys`.
- **Retries**: `withRetry` + `isRetryableError` retries on 5xx/429/network. Errors carry `retryAfterMs` when present; the retry helper honours it.
- **Circuit breaker**: optional; stops hammering failing deps. Enable via `circuitBreaker.enabled`.

## Redaction demo
The template includes a redaction assertion in `playwright-e2e/tests/api/token.exchange.spec.ts`, which builds an attachment via `buildApiAttachment` and verifies that sensitive fields are masked while raw bodies remain gated behind `PLAYWRIGHT_DEBUG_API`.

## Env vars at a glance
- Logging: `LOG_LEVEL`, `LOG_FORMAT`, `LOG_REDACTION`, `LOG_SERVICE_NAME`
- API debug bodies: `PLAYWRIGHT_DEBUG_API` (`true`/`1` to allow raw in attachments)
- S2S tokens: `S2S_SECRET` (optional; omit for stubbed services), `S2S_MICROSERVICE_NAME`, `S2S_URL`
- S2S/IDAM retries: `S2S_RETRY_ATTEMPTS`, `S2S_RETRY_BASE_MS`, `IDAM_RETRY_ATTEMPTS`, `IDAM_RETRY_BASE_MS`
- S2S setup control: `SKIP_S2S_TOKEN_SETUP` (skip token generation in global setup), `ALLOW_S2S_TOKEN_FAILURE` (treat failures as warnings)
- Workers: `FUNCTIONAL_TESTS_WORKERS`
- Playwright debug: `PWDEBUG`

## Service-to-Service (S2S) Authentication

For microservice-to-microservice calls, use `ServiceAuthUtils` from the shared fixtures:

```ts
import { test } from "../fixtures";

test("API call with S2S token", async ({ serviceAuthUtils, createApiClient }) => {
  const s2sToken = await serviceAuthUtils.getServiceAuthToken();
  const api = createApiClient({ baseUrl: process.env.BACKEND_URL, name: "backend" });
  
  const res = await api.get("/protected-endpoint", {
    headers: { "ServiceAuthorization": `Bearer ${s2sToken}` },
    throwOnError: true,
  });
});
```

**Configuration**:
- `S2S_SECRET` - Microservice secret (optional for stubbed/non-secret services)
- `S2S_MICROSERVICE_NAME` - Your service identifier (required)
- `S2S_URL` - S2S token generation endpoint (required)
- `SKIP_S2S_TOKEN_SETUP=true` - Skip global setup S2S token generation
- `ALLOW_S2S_TOKEN_FAILURE=true` - Treat S2S failures as warnings (useful for local dev)

From `@hmcts/playwright-common@1.0.38+`, when `S2S_SECRET` is blank, the fixture logs the omission and makes the lease request without a Basic `Authorization` header (perfect for stubbed services).

## Common patterns
- **Respect Retry-After**: ApiClientError includes `retryAfterMs` (from the `Retry-After` header) so your retry logic can sleep accordingly.
- **Telemetry hooks**: use `onError`/`onResponse` to emit metrics/traces.
- **Attachments**: attach `buildApiAttachment` outputs to Playwright tests for easy debugging; keep `includeRaw=false` in pipelines.

## Error metadata example
```ts
import { ApiClientError, isRetryableError, withRetry } from "@hmcts/playwright-common";

try {
  await withRetry(
    () => api.get("/rate-limited", { throwOnError: true }),
    3,
    200,
    2000,
    15000,
    isRetryableError
  );
} catch (error) {
  if (error instanceof ApiClientError) {
    console.warn("api call failed", {
      endpoint: error.endpointPath,
      retryAfterMs: error.retryAfterMs,
      correlationId: error.correlationId,
      elapsedMs: error.elapsedMs,
    });
  }
}
```

If you need a copy-paste example, see `recipes/retry-429-example.ts` in `@hmcts/playwright-common`.

**Note on `withRetry` signature**: The helper accepts `(fn, maxRetries, retryBaseMs, retryMaxBackoffMs, timeoutMs, shouldRetry)`. Always verify parameter order against your installed version of `@hmcts/playwright-common` - signatures may evolve between releases.
