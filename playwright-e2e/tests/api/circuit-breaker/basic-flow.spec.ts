/**
 * Circuit Breaker Pattern - Basic Flow Tests
 * 
 * Tests the complete circuit breaker lifecycle: closed → open → half-open → closed.
 * 
 * **State Machine:**
 * ```
 * CLOSED ──[threshold failures]──> OPEN ──[cooldown expires]──> HALF-OPEN
 *   ↑                                                               │
 *   └────────────────[success in half-open]────────────────────────┘
 *                    [failure in half-open]──> OPEN
 * ```
 * 
 * **States:**
 * - CLOSED: Normal operation, requests proceed
 * - OPEN: Circuit broken, requests blocked (fast-fail)
 * - HALF-OPEN: Testing recovery with limited trial requests
 * 
 * @see {@link https://martinfowler.com/bliki/CircuitBreaker.html}
 */

import { ApiClientError } from "@hmcts/playwright-common";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../../../fixtures";
import { FAILURE_THRESHOLD, COOLDOWN_MS, formatError, waitForCooldown } from "./helpers";

const captureApiClientError = async (
  request: Promise<unknown>
): Promise<ApiClientError> => {
  try {
    await request;
  } catch (error) {
    return error as ApiClientError;
  }
  throw new Error("Expected ApiClientError");
};

test.describe("Circuit breaker - basic flow @api", () => {
  /**
   * Tests the complete circuit breaker lifecycle: closed → open → half-open → closed.
   * 
   * Verifies that:
   * 1. Circuit remains closed during initial failures (up to threshold)
   * 2. Circuit opens after threshold failures, blocking subsequent requests
   * 3. Circuit transitions to half-open after cooldown period
   * 4. Circuit closes after successful trial request in half-open state
   */
  test("returns fast-fail errors when circuit opens after 5 backend failures", async ({
    createApiClient,
  }) => {
    let callCount = 0;
    const server = http.createServer((_, res) => {
      callCount += 1;
      // First 5 calls fail (triggers circuit open)
      if (callCount <= 5) {
        res.writeHead(503, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "service_unavailable" }));
        return;
      }
      // Later calls succeed (when circuit allows half-open)
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const client = createApiClient({
      baseUrl,
      name: "circuit-breaker-demo",
      circuitBreaker: {
        enabled: true,
        options: {
          failureThreshold: FAILURE_THRESHOLD,
          cooldownMs: COOLDOWN_MS,
          halfOpenMaxAttempts: 1,
        },
      },
    });

    try {
      // Phase 1: Circuit closed - failures are attempted
      const failedCalls: Array<{ attempt: number; error: string }> = [];
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await client.get("/flaky", { throwOnError: true });
        } catch (error) {
          failedCalls.push({
            attempt,
            error: formatError(error),
          });
        }
      }

      expect(failedCalls).toHaveLength(5);
      expect(callCount).toBe(5);

      // Phase 2: Circuit opened - fast-fail without hitting backend
      const circuitOpenErrors: ApiClientError[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        circuitOpenErrors.push(
          await captureApiClientError(
            client.get("/flaky", { throwOnError: true })
          )
        );
      }

      // Circuit breaker prevents calls, so callCount stays at 5
      expect(callCount).toBe(5);
      expect(circuitOpenErrors).toHaveLength(3);
      circuitOpenErrors.forEach((err) => {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err.status).toBe(503);
        expect(err.logEntry.durationMs).toBe(0);
      });

      // Phase 3: Wait for circuit to enter half-open state
      await waitForCooldown(() => client.getCircuitBreakerMetrics());

      // Half-open allows one test call through
      const halfOpenResponse = await client.get("/flaky", {
        throwOnError: false,
      });
      expect(halfOpenResponse.status).toBe(200);
      expect(callCount).toBe(6);

      // Circuit should now be closed again
      const recoveredResponse = await client.get("/flaky", {
        throwOnError: false,
      });
      expect(recoveredResponse.status).toBe(200);
      expect(callCount).toBe(7);
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
