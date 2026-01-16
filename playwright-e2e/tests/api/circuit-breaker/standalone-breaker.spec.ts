/**
 * Circuit Breaker Pattern - Standalone Usage Tests
 * 
 * Demonstrates manual circuit breaker usage without ApiClient for custom retry logic.
 */

import { expect, test } from "../../../fixtures";
import { createFlakyOperation, runBreakerAttempt, waitForCooldown } from "./helpers";

test.describe("Circuit breaker - standalone usage @api", () => {
  /**
   * Demonstrates manual circuit breaker usage for custom retry logic.
   * 
   * Use this pattern when you need fine-grained control over:
   * - When to check if operations can proceed
   * - When to record successes/failures
   * - Custom error handling or fallback strategies
   */
  test("wraps risky operations with standalone CircuitBreaker instance", async () => {
    const { CircuitBreaker } = await import("@hmcts/playwright-common");
    
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 50,
      halfOpenMaxAttempts: 1,
    });

    const state = { count: 0 };
    const riskyCall = createFlakyOperation(3, state);

    // Phase 1: Accumulate failures until circuit opens
    for (let i = 0; i < 3; i++) {
      await runBreakerAttempt(breaker, riskyCall);
    }

    expect(breaker.getMetrics().state).toBe("open");
    expect(breaker.getMetrics().failureCount).toBe(3);
    expect(state.count).toBe(3);

    // Phase 2: Circuit open - calls blocked
    expect(breaker.canProceed()).toBe(false);
    expect(state.count).toBe(3); // No new calls

    // Phase 3: Wait for cooldown
    await waitForCooldown(() => breaker.getMetrics());

    // Phase 4: Half-open - allow trial
    const trial = await runBreakerAttempt(breaker, riskyCall);
    expect(trial.attempted).toBe(true);
    expect(trial.result?.success).toBe(true);

    // Circuit should now be closed
    expect(breaker.getMetrics().state).toBe("closed");
    expect(breaker.getMetrics().failureCount).toBe(0);
  });
});
