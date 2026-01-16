/**
 * Circuit Breaker Pattern - Metrics API Tests
 * 
 * Validates that circuit breaker exposes metrics for monitoring and observability.
 */

import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../../../fixtures";
import { formatError } from "./helpers";

test.describe("Circuit breaker - metrics @api", () => {
  /**
   * Validates that circuit breaker exposes metrics for monitoring.
   * 
   * Metrics include:
   * - state: current circuit state (closed/open/half-open)
   * - failureCount: number of consecutive failures
   * - failureThreshold: configured threshold before opening
   */
  test("reports circuit state and failure count via metrics API", async ({
    createApiClient,
  }) => {
    const server = http.createServer((_, res) => {
      res.writeHead(503).end();
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;

    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      name: "circuit-metrics-demo",
      circuitBreaker: {
        enabled: true,
        options: {
          failureThreshold: 3,
          cooldownMs: 1000,
        },
      },
    });

    try {
      // Trigger failures
      const errors: string[] = [];
      for (let i = 0; i < 3; i++) {
        try {
          await client.get("/fail", { throwOnError: true });
        } catch (error) {
          errors.push(formatError(error));
        }
      }

      const metrics = client.getCircuitBreakerMetrics();

      expect(errors).toHaveLength(3);
      expect(metrics).toBeDefined();
      expect(metrics?.state).toBe("open");
      expect(metrics?.failureCount).toBeGreaterThanOrEqual(3);
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
