import { describe, expect, it } from "vitest";
import type { ApiLogEntry } from "@hmcts/playwright-common";
import {
  ApiRecorder,
  shouldIncludeRawBodies,
} from "../../playwright-e2e/utils/api-telemetry.js";

const baseEntry: ApiLogEntry = {
  id: "entry-1",
  name: "test-client",
  method: "GET",
  url: "https://example.com/resource",
  status: 200,
  ok: true,
  timestamp: new Date().toISOString(),
  durationMs: 12,
  request: {
    headers: { authorization: "Bearer [REDACTED]" },
    data: undefined,
    form: undefined,
    query: undefined,
  },
  response: {
    headers: { "content-type": "application/json" },
    body: { result: "ok", token: "[REDACTED]" },
  },
};

describe("shouldIncludeRawBodies", () => {
  it("returns true for recognised truthy values", () => {
    expect(
      shouldIncludeRawBodies({ PLAYWRIGHT_DEBUG_API: "1" })
    ).toBe(true);
    expect(
      shouldIncludeRawBodies({ PLAYWRIGHT_DEBUG_API: "TRUE" })
    ).toBe(true);
  });

  it("returns false when flag is absent or falsy", () => {
    expect(shouldIncludeRawBodies({})).toBe(false);
    expect(
      shouldIncludeRawBodies({ PLAYWRIGHT_DEBUG_API: "0" })
    ).toBe(false);
  });
});

describe("ApiRecorder", () => {
  it("collects entries and outputs sanitised JSON", () => {
    const recorder = new ApiRecorder(false);
    recorder.record(baseEntry);

    const json = recorder.toJson();
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>;

    expect(parsed).toHaveLength(1);
    expect(parsed[0].response).toBeDefined();
    expect(JSON.stringify(parsed[0])).toContain("[REDACTED]");
    expect("rawResponse" in parsed[0]).toBe(false);
  });

  it("includes raw payloads when enabled", () => {
    const recorder = new ApiRecorder(true);
    recorder.record({
      ...baseEntry,
      rawResponse: '{"token":"secret"}',
    });

    const parsed = JSON.parse(recorder.toJson()) as Array<
      Record<string, unknown>
    >;

    expect(parsed[0].rawResponse).toBe('{"token":"secret"}');
  });
});
