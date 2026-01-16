import type { ApiResponsePayload } from "@hmcts/playwright-common";
import { expect } from "@playwright/test";

export type StatusProfile = "success" | "validation" | "auth";

const STATUS_PROFILES: Record<StatusProfile, number[]> = {
  success: [200, 201],
  validation: [400, 422],
  auth: [401, 403],
};

export function assertStatusProfile(
  response: ApiResponsePayload<unknown>,
  profile: StatusProfile
): void {
  expect(STATUS_PROFILES[profile]).toContain(response.status);

  if (profile === "success") {
    const body = ensureRecord(response.data, "success response body");
    expect(typeof body.status).toBe("string");
    return;
  }

  if (profile === "validation") {
    const body = ensureRecord(response.data, "validation error body");
    const errors = body.errors;
    expect(Array.isArray(errors)).toBe(true);
    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const entry = ensureRecord(error, "validation error entry");
        expect(typeof entry.message).toBe("string");
      });
    }
    return;
  }

  const body = ensureRecord(response.data, "auth error body");
  expect(typeof body.message).toBe("string");
}

function ensureRecord(
  value: unknown,
  label: string
): Record<string, unknown> {
  expect(value, label).toBeTruthy();
  expect(typeof value, label).toBe("object");
  expect(Array.isArray(value), label).toBe(false);
  return value as Record<string, unknown>;
}
