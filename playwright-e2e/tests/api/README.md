# API Test Suite

This directory contains API integration tests demonstrating the features of `@hmcts/playwright-common` and HMCTS API testing patterns.

## Test Files Overview

| File | Purpose | Key Features | Tags |
|------|---------|--------------|------|
| **api-client-extras.spec.ts** | ApiClient advanced features (retry, error metadata, telemetry) | Retry-After headers, raw body inclusion, ApiClientError metadata | `@api` |
| **api.healthcheck.spec.ts** | Health check endpoints with retry logic | Readiness polling, 503 retry handling | `@api` `@smoke` |
| **circuit-breaker.spec.ts** | Circuit breaker resilience pattern (394 lines) | State transitions (closed/open/half-open), failure thresholds, metrics API | `@api` |
| **parallel-sweep.spec.ts** | Parallel API calls with concurrency limits | Batch processing, rate limiting | `@api` |
| **seed-manifest.spec.ts** | Deterministic test data via seed manifest | Repeatable test IDs for cases/tasks | `@api` |
| **status-profile.spec.ts** | API response status profiling | Success/validation/auth contracts | `@api` |
| **token.exchange.spec.ts** | OAuth token exchange with redaction | Credential masking, sensitive data handling | `@api` `@security` |
| **xsrf-header.spec.ts** | XSRF token header injection | Session-based CSRF protection | `@api` |

## Test Organization

### Tagging Strategy

Tests use Playwright tags for selective execution:

- **`@api`**: All API integration tests (applied to all files)
- **`@smoke`**: Critical path tests (health checks, basic connectivity)
- **`@security`**: Security-focused tests (token handling, redaction)
- **`@performance`**: Performance/load tests (not currently in this suite)

**Run specific tags:**
```bash
# Smoke tests only
yarn playwright test --grep @smoke

# Security tests only
yarn playwright test --grep @security

# All API tests except security
yarn playwright test --grep @api --grep-invert @security
```

### Test Naming Convention

Tests follow HMCTS pattern: **action + condition + outcome**

✅ **Good Examples:**
```typescript
test("returns 200 with masked access token when valid credentials provided")
test("returns 200 from readiness endpoint after retrying 503 failures")
test("returns fast-fail errors when circuit opens after 5 backend failures")
```

❌ **Avoid:**
```typescript
test("token exchange works")  // Too vague
test("retry logic")           // Missing condition/outcome
```

## Circuit Breaker Pattern

[circuit-breaker.spec.ts](./circuit-breaker.spec.ts) demonstrates the resilience pattern for protecting services from cascading failures.

**State Machine:**
```
CLOSED ──[5 failures]──> OPEN ──[cooldown 100ms]──> HALF-OPEN
  ↑                                                     │
  └──────────────[success]──────────────────────────────┘
              [failure]──> OPEN
```

**States:**
- **CLOSED**: Normal operation, all requests proceed
- **OPEN**: Circuit broken, requests fast-fail without backend calls (503 with 0ms duration)
- **HALF-OPEN**: Testing recovery with limited trial requests (1 attempt)

**Key Tests:**
1. Basic flow: 5 failures → OPEN → cooldown → HALF-OPEN → success → CLOSED
2. Metrics API: exposes `state`, `failureCount`, `failureThreshold`
3. Edge cases: threshold precision, max half-open attempts
4. Standalone usage: CircuitBreaker without ApiClient

## ApiClient Features

All tests use `createApiClient` fixture from `@hmcts/playwright-common`:

### Retry Logic
```typescript
import { withRetry, isRetryableError } from "@hmcts/playwright-common";

await withRetry(
  () => api.get("/endpoint", { throwOnError: true }),
  MAX_RETRY_ATTEMPTS,      // 3
  INITIAL_BACKOFF_MS,      // 50ms
  MAX_BACKOFF_MS,          // 200ms
  RETRY_TIMEOUT_MS,        // 3000ms
  isRetryableError         // Retries 5xx, 429, network errors
);
```

### Error Metadata
```typescript
try {
  await api.get("/failing-endpoint");
} catch (error) {
  if (error instanceof ApiClientError) {
    console.log({
      status: error.status,
      retryAfterMs: error.retryAfterMs,  // From Retry-After header
      correlationId: error.correlationId,
      elapsedMs: error.elapsedMs,
      endpointPath: error.endpointPath,
    });
  }
}
```

### Redaction & Security

Sensitive fields are automatically masked in logs/attachments:
- Request/response bodies: `password`, `secret`, `token`, `authorization`, etc.
- Raw bodies only included when `PLAYWRIGHT_DEBUG_API=true` (local debugging only)

**Example from token.exchange.spec.ts:**
```typescript
expect(recordedCall.request.data.clientSecret).toBe("[REDACTED]");
expect(recordedCall.response.body.access_token).toBe("[REDACTED]");
```

### Telemetry

Tests validate that API calls are:
1. Recorded to `apiRecorder` fixture
2. Attached to Playwright reports on failure
3. Optionally emitted to stdout (controlled by `PLAYWRIGHT_STDOUT_API_LOGS`)

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PLAYWRIGHT_DEBUG_API` | Include raw request/response bodies | `false` |
| `PLAYWRIGHT_ATTACH_API_LOGS` | Attach API logs to test reports | `true` (failed tests only) |
| `PLAYWRIGHT_STDOUT_API_LOGS` | Emit logs to stdout | `false` |
| `PLAYWRIGHT_API_MAX_LOGS` | Max API calls to record | `100` |
| `PLAYWRIGHT_API_MAX_FIELD_CHARS` | Max characters per field | `2000` |
| `PW_ODHIN_API_SUMMARY_LINES` | Stdout summary line limit | `50` |
| `PW_ODHIN_API_STDOUT_KB` | Stdout full mode size limit | `100` |

## Best Practices

### 1. Use Named Constants
Extract magic numbers for clarity:
```typescript
const RETRY_AFTER_MS = 1000;
const MIN_ELAPSED_MS = 900;
const MAX_RETRY_ATTEMPTS = 3;
```

### 2. Test Server Cleanup
Always close test HTTP servers in `finally` blocks:
```typescript
try {
  // ... test code
} finally {
  await client.dispose();
  await new Promise((resolve) => server.close(resolve));
}
```

### 3. Assertion Clarity
Use specific matchers with meaningful messages:
```typescript
expect(response.status).toBe(200);
expect(elapsedMs).toBeGreaterThanOrEqual(MIN_ELAPSED_MS);
expect(apiRecorder.hasEntries()).toBe(true);
```

### 4. Test Data Isolation
Use `seedManifest` fixture for deterministic IDs:
```typescript
test("uses manifest case/task ids", async ({ seedManifest, createApiClient }) => {
  const caseId = seedManifest.data.caseId;
  // Repeatable across test runs
});
```

## Running Tests

```bash
# All API tests
yarn playwright test tests/api

# Specific file
yarn playwright test tests/api/circuit-breaker.spec.ts

# Watch mode (development)
yarn playwright test tests/api --ui

# Debug mode
yarn playwright test tests/api/token.exchange.spec.ts --debug

# Headed mode (see browser)
yarn playwright test tests/api --headed

# Generate report
yarn playwright test tests/api && yarn playwright show-report
```

## Security Considerations

1. **No Secrets in Tests**: Use environment variables or fixtures
2. **Redaction by Default**: Sensitive data masked automatically
3. **Raw Bodies Fail-Closed**: Only enabled via explicit env var
4. **Local Servers Only**: Test HTTP servers bind to `127.0.0.1`
5. **No External Calls**: All tests use local mock servers

## Maintenance

### Adding New Tests

1. Follow naming convention: action + condition + outcome
2. Apply appropriate tags (`@api`, `@smoke`, `@security`)
3. Extract constants for magic numbers
4. Document complex patterns with JSDoc
5. Clean up resources in `finally` blocks

### Refactoring Large Files

If a test file exceeds ~200 lines, consider splitting by feature:
```
tests/api/circuit-breaker/
  ├── basic-flow.spec.ts
  ├── metrics.spec.ts
  ├── edge-cases.spec.ts
  └── standalone-breaker.spec.ts
```

## References

- **API Client Docs**: [docs/api-client.md](../../docs/api-client.md)
- **Fixtures Guide**: [docs/FIXTURES.md](../../docs/FIXTURES.md)
- **Best Practices**: [docs/BEST_PRACTICE.md](../../docs/BEST_PRACTICE.md)
- **@hmcts/playwright-common**: [npm package](https://www.npmjs.com/package/@hmcts/playwright-common)
- **Circuit Breaker Pattern**: [Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
