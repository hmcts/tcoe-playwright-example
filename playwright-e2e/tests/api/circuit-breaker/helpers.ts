/**
 * Circuit Breaker Pattern - Shared Utilities
 * 
 * Common helpers and types used across circuit breaker tests.
 */

export const FAILURE_THRESHOLD = 5;
export const COOLDOWN_MS = 1000;
export const COOLDOWN_BUFFER_MS = 100;

export const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export type RiskyCall = () => Promise<{ success: boolean }>;

export const createFlakyOperation = (
  failuresBeforeSuccess: number,
  state: { count: number }
): RiskyCall => {
  return async () => {
    state.count += 1;
    if (state.count <= failuresBeforeSuccess) {
      throw new Error("Service unavailable");
    }
    return { success: true };
  };
};

export const runBreakerAttempt = async (
  breaker: { canProceed: () => boolean; onSuccess: () => void; onFailure: () => void },
  operation: RiskyCall
): Promise<{ attempted: boolean; error?: string; result?: { success: boolean } }> => {
  if (!breaker.canProceed()) {
    return { attempted: false };
  }
  try {
    const result = await operation();
    breaker.onSuccess();
    return { attempted: true, result };
  } catch (error) {
    breaker.onFailure();
    return { attempted: true, error: formatError(error) };
  }
};

export const waitForCooldown = async (
  getMetrics: () => { cooldownMs: number; openedAt?: number } | undefined
): Promise<void> => {
  const metrics = getMetrics();
  if (!metrics?.openedAt) {
    return;
  }
  const remainingMs = metrics.openedAt + metrics.cooldownMs - Date.now();
  if (remainingMs > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, remainingMs + COOLDOWN_BUFFER_MS)
    );
  }
};
