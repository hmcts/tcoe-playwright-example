import { describe, expect, it } from "vitest";
import type { ApiLogEntry } from "@hmcts/playwright-common";
import {
  ApiRecorder,
  buildApiAttachmentPayload,
  buildApiLogSummary,
  formatBytes,
  resolveApiAttachmentLimit,
  resolveApiLogStdoutLimit,
  resolveApiMaxFieldChars,
  resolveApiMaxLogs,
  resolveApiStdoutMode,
  resolveApiSummaryLimit,
  shouldIncludeRawBodies,
  truncateApiLogPayload,
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

  it("drops entries beyond the configured limit", () => {
    const recorder = new ApiRecorder(false, { maxEntries: 1 });
    recorder.record(baseEntry);
    recorder.record({ ...baseEntry, id: "entry-2" });
    expect(recorder.count()).toBe(1);
    expect(recorder.stats().droppedEntries).toBe(1);
  });

  it("trims oversized string fields", () => {
    const recorder = new ApiRecorder(false, { maxFieldChars: 5 });
    recorder.record({
      ...baseEntry,
      response: {
        headers: {},
        body: "abcdefghijklmnopqrstuvwxyz",
      },
    });
    const parsed = JSON.parse(recorder.toJson()) as Array<
      Record<string, unknown>
    >;
    expect((parsed[0].response as Record<string, string>).body).toContain(
      "chars truncated"
    );
    expect(recorder.stats().trimmedFields).toBeGreaterThanOrEqual(1);
  });
});

describe("resolveApiLogStdoutLimit", () => {
  it("returns the default when unset", () => {
    expect(resolveApiLogStdoutLimit({})).toBe(64 * 1024);
  });

  it("accepts custom values", () => {
    expect(
      resolveApiLogStdoutLimit({ PW_ODHIN_API_STDOUT_KB: "1024" })
    ).toBe(1024 * 1024);
  });

  it("treats zero/negative values as unbounded", () => {
    expect(
      resolveApiLogStdoutLimit({ PW_ODHIN_API_STDOUT_KB: "0" })
    ).toBe(Number.POSITIVE_INFINITY);
    expect(
      resolveApiLogStdoutLimit({ PW_ODHIN_API_STDOUT_KB: "-10" })
    ).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("truncateApiLogPayload", () => {
  it("returns payload untouched when below the limit", () => {
    const result = truncateApiLogPayload("abc", 10);
    expect(result.payload).toBe("abc");
    expect(result.truncatedBytes).toBe(0);
  });

  it("truncates payloads above the limit", () => {
    const result = truncateApiLogPayload("abcdefghijklmnopqrstuvwxyz", 5);
    expect(result.payload).toBe("abcde");
    expect(result.truncatedBytes).toBe(21);
  });

  it("skips truncation when the limit is unbounded", () => {
    const result = truncateApiLogPayload("abcdef", Number.POSITIVE_INFINITY);
    expect(result.payload).toBe("abcdef");
    expect(result.truncatedBytes).toBe(0);
  });
});

describe("resolveApiStdoutMode", () => {
  it("defaults to summary", () => {
    expect(resolveApiStdoutMode({})).toBe("summary");
  });

  it("switches to json when explicitly requested", () => {
    expect(resolveApiStdoutMode({ PW_ODHIN_API_STDOUT_MODE: "json" })).toBe(
      "json"
    );
  });
});

describe("resolveApiSummaryLimit", () => {
  it("defaults to 50 entries", () => {
    expect(resolveApiSummaryLimit({})).toBe(50);
  });

  it("accepts overrides", () => {
    expect(resolveApiSummaryLimit({ PW_ODHIN_API_SUMMARY_LINES: "10" })).toBe(
      10
    );
  });

  it("treats non-positive values as unlimited", () => {
    expect(resolveApiSummaryLimit({ PW_ODHIN_API_SUMMARY_LINES: "0" })).toBe(
      Number.POSITIVE_INFINITY
    );
  });
});

describe("buildApiLogSummary", () => {
  const entries = Array.from({ length: 3 }, (_, index) => ({
    ...baseEntry,
    id: `entry-${index}`,
    method: index === 1 ? "POST" : "GET",
    url: `https://example.com/resource/${index}`,
    status: index === 2 ? 500 : 200,
    ok: index !== 2,
    durationMs: 100 + index,
  }));

  it("formats entries with index, method, url and status", () => {
    const { summary, truncated } = buildApiLogSummary(entries, 10);
    expect(truncated).toBe(0);
    expect(summary.split("\n")).toHaveLength(3);
    expect(summary).toContain("1. [test-client] GET https://example.com/resource/0 -> 200");
  });

  it("truncates when limit reached", () => {
    const { summary, truncated } = buildApiLogSummary(entries, 2);
    expect(summary.split("\n")).toHaveLength(2);
    expect(truncated).toBe(1);
  });
});

describe("resolveApiAttachmentLimit", () => {
  it("returns default when unset", () => {
    expect(resolveApiAttachmentLimit({})).toBe(256 * 1024);
  });

  it("treats zero/negative as unlimited", () => {
    expect(
      resolveApiAttachmentLimit({ PW_ODHIN_API_ATTACH_KB: "0" })
    ).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("buildApiAttachmentPayload", () => {
  it("prefers raw payload when within limit", () => {
    const recorder = new ApiRecorder(true);
    recorder.record(baseEntry);
    const result = buildApiAttachmentPayload(recorder, {
      includeRawBodies: true,
      limitBytes: 10_000,
      summaryLimit: 10,
    });
    expect(result.mode).toBe("raw");
    expect(result.payload).toContain("token");
  });

  it("falls back to summary when limit is tiny", () => {
    const recorder = new ApiRecorder(true);
    recorder.record(baseEntry);
    const result = buildApiAttachmentPayload(recorder, {
      includeRawBodies: true,
      limitBytes: 10,
      summaryLimit: 5,
    });
    expect(result.mode).toBe("summary");
    expect(result.note).toContain("Attachment truncated");
  });
});

describe("formatBytes", () => {
  it("converts to human readable units", () => {
    expect(formatBytes(512)).toBe("512 bytes");
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
});

describe("resolveApiMaxLogs", () => {
  it("defaults to 250", () => {
    expect(resolveApiMaxLogs({})).toBe(250);
  });

  it("parses positive overrides", () => {
    expect(resolveApiMaxLogs({ PW_ODHIN_API_MAX_LOGS: "10" })).toBe(10);
  });
});

describe("resolveApiMaxFieldChars", () => {
  it("defaults to 4000", () => {
    expect(resolveApiMaxFieldChars({})).toBe(4000);
  });

  it("parses positive overrides", () => {
    expect(resolveApiMaxFieldChars({ PW_ODHIN_API_MAX_FIELD_CHARS: "100" })).toBe(
      100
    );
  });
});
