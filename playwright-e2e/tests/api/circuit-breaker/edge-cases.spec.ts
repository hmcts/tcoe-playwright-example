/**
 * Circuit Breaker Pattern - Edge Cases Tests
 * 
 * Tests boundary conditions and edge cases for circuit breaker behavior.
 */

import { expect, test } from "../../../fixtures";
import { waitForCooldown } from "./helpers";

test.describe("Circuit breaker - edge cases @api", () => {
  /**
   * Edge case: Circuit opens exactly at threshold, not before.
   * 
   * Validates that:
   * - Circuit remains closed at (threshold - 1) failures
   * - Circuit opens precisely at threshold failures
   */
  test("opens circuit exactly at failure threshold, not before", async () => {
    const { CircuitBreaker } = await import("@hmcts/playwright-common");
    
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 50,
    });

    // Fail (threshold - 1) times - circuit should stay closed
    for (let i = 0; i < 2; i++) {
      expect(breaker.canProceed()).toBe(true);
      breaker.onFailure();
      expect(breaker.getMetrics().state).toBe("closed");
    }

    expect(breaker.getMetrics().failureCount).toBe(2);
    expect(breaker.getMetrics().state).toBe("closed");

    // One more failure should open the circuit
    expect(breaker.canProceed()).toBe(true);
    breaker.onFailure();
    
    expect(breaker.getMetrics().state).toBe("open");
    expect(breaker.getMetrics().failureCount).toBe(3);
    expect(breaker.canProceed()).toBe(false);
  });

  /**
   * Edge case: Half-open state respects maxAttempts limit.
   * 
   * Validates that:
   * - Circuit allows exactly maxAttempts trials in half-open state
   * - Additional requests are blocked until trial completes
   * - Failed trial returns circuit to open state
   */
  test("blocks requests after half-open max attempts reached", async () => {
    const { CircuitBreaker } = await import("@hmcts/playwright-common");
    
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 50,
      halfOpenMaxAttempts: 2,
    });

    // Open the circuit
    breaker.onFailure();
    breaker.onFailure();
    expect(breaker.getMetrics().state).toBe("open");

    // Wait for cooldown
    await waitForCooldown(() => breaker.getMetrics());

    // Half-open: first trial allowed
    expect(breaker.canProceed()).toBe(true);
    expect(breaker.getMetrics().state).toBe("half-open");

    // Half-open: second trial allowed
    expect(breaker.canProceed()).toBe(true);

    // Half-open: third trial blocked (exceeded maxAttempts)
    expect(breaker.canProceed()).toBe(false);

    // Fail one of the trials - circuit goes back to open
    breaker.onFailure();
    expect(breaker.getMetrics().state).toBe("open");
    expect(breaker.canProceed()).toBe(false);
  });

  /**
   * Edge case: Successful request in closed state resets failure count.
   * 
   * Validates that partial failures don't accumulate indefinitely when
   * interspersed with successes.
   */
  test("resets failure count after success in closed state", async () => {
    const { CircuitBreaker } = await import("@hmcts/playwright-common");
    
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 50,
    });

    // Two failures
    breaker.onFailure();
    breaker.onFailure();
    expect(breaker.getMetrics().failureCount).toBe(2);
    expect(breaker.getMetrics().state).toBe("closed");

    // One success resets the counter
    breaker.onSuccess();
    expect(breaker.getMetrics().failureCount).toBe(0);
    expect(breaker.getMetrics().state).toBe("closed");

    // Two more failures don't open circuit (counter was reset)
    breaker.onFailure();
    breaker.onFailure();
    expect(breaker.getMetrics().failureCount).toBe(2);
    expect(breaker.getMetrics().state).toBe("closed");
  });
});
