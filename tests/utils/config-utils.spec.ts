import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigUtils } from "@hmcts/playwright-common";

const ORIGINAL_ENV = process.env;

describe("ConfigUtils.getEnvVar", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns the value when present", () => {
    process.env.SERVICE_BASE_URL = "https://example.test";
    expect(ConfigUtils.getEnvVar("SERVICE_BASE_URL")).toBe(
      "https://example.test"
    );
  });

  it("throws when missing", () => {
    expect(() => ConfigUtils.getEnvVar("MISSING_ENV")).toThrow(
      "MISSING_ENV"
    );
  });
});
