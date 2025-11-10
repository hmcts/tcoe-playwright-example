import type { ApiLogEntry } from "@hmcts/playwright-common";
import { Buffer } from "node:buffer";

const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on", "all"]);
const FALSY_FLAGS = new Set(["0", "false", "no", "off"]);

type OdhinApiLogMode = "off" | "api-only" | "all";
type ApiStdoutMode = "summary" | "json";
type AttachmentMode = "raw" | "sanitised" | "summary";

const DEFAULT_STDOUT_LIMIT_KB = 64;
const DEFAULT_STDOUT_MODE: ApiStdoutMode = "summary";
const DEFAULT_SUMMARY_LIMIT = 50;
const SUMMARY_URL_LIMIT = 160;
const SUMMARY_BODY_LIMIT = 120;
const DEFAULT_ATTACHMENT_LIMIT_KB = 256;
const DEFAULT_MAX_LOGS = 250;
const DEFAULT_MAX_FIELD_CHARS = 4000;

interface ApiRecorderOptions {
  includeRaw: boolean;
  maxEntries: number;
  maxFieldChars: number;
}

export class ApiRecorder {
  private readonly entries: ApiLogEntry[] = [];
  private readonly includeRaw: boolean;
  private readonly maxEntries: number;
  private readonly maxFieldChars: number;
  private droppedEntries = 0;
  private trimmedFields = 0;

  constructor(includeRaw: boolean, options?: Partial<ApiRecorderOptions>) {
    this.includeRaw = includeRaw;
    this.maxEntries = options?.maxEntries ?? DEFAULT_MAX_LOGS;
    this.maxFieldChars = options?.maxFieldChars ?? DEFAULT_MAX_FIELD_CHARS;
  }

  public record(entry: ApiLogEntry): void {
    if (this.entries.length >= this.maxEntries) {
      this.droppedEntries += 1;
      return;
    }
    this.entries.push(this.cloneWithLimits(entry));
  }

  public hasEntries(): boolean {
    return this.entries.length > 0;
  }

  public get includeRawBodies(): boolean {
    return this.includeRaw;
  }

  public toJson(includeRawOverride?: boolean): string {
    const includeRaw =
      includeRawOverride !== undefined ? includeRawOverride : this.includeRaw;

    const payload = this.entries.map((entry) => ({
      ...entry,
      rawRequest: includeRaw ? entry.rawRequest : undefined,
      rawResponse: includeRaw ? entry.rawResponse : undefined,
    }));

    return JSON.stringify(payload, (_key, value) => {
      if (value === undefined) {
        return undefined;
      }
      return value;
    }, 2);
  }

  public clear(): void {
    this.entries.length = 0;
    this.droppedEntries = 0;
    this.trimmedFields = 0;
  }

  public toArray(): ApiLogEntry[] {
    return [...this.entries];
  }

  public count(): number {
    return this.entries.length;
  }

  public stats(): { droppedEntries: number; trimmedFields: number } {
    return {
      droppedEntries: this.droppedEntries,
      trimmedFields: this.trimmedFields,
    };
  }

  private cloneWithLimits(entry: ApiLogEntry): ApiLogEntry {
    return this.limitValue(entry) as ApiLogEntry;
  }

  private limitValue(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      return this.limitString(value);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.limitValue(item));
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      const asString = value.toString("utf8");
      return this.limitString(asString);
    }

    if (typeof value === "object") {
      const clone: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(
        value as Record<string, unknown>
      )) {
        clone[key] = this.limitValue(child);
      }
      return clone;
    }

    return value;
  }

  private limitString(value: string): string {
    if (this.maxFieldChars <= 0 || value.length <= this.maxFieldChars) {
      return value;
    }
    this.trimmedFields += 1;
    const omitted = value.length - this.maxFieldChars;
    return `${value.slice(0, this.maxFieldChars)}… [${omitted} chars truncated]`;
  }
}

export function shouldIncludeRawBodies(
  env: Record<string, string | undefined>
): boolean {
  const value = env.PLAYWRIGHT_DEBUG_API;
  if (!value) return false;
  return TRUTHY_FLAGS.has(value.trim().toLowerCase());
}

export function shouldAttachApiLogs(
  env: Record<string, string | undefined>
): boolean {
  const value = env.PLAYWRIGHT_API_LOG_ATTACH;
  if (!value) return true;
  const normalised = value.trim().toLowerCase();
  if (FALSY_FLAGS.has(normalised)) return false;
  return true;
}

export function shouldEmitApiLogsToStdout(
  env: Record<string, string | undefined>,
  projectName: string
): boolean {
  const mode = parseOdhinApiLogMode(env);
  if (mode === "off") {
    return false;
  }
  if (mode === "all") {
    return true;
  }

  return projectName.toLowerCase().includes("api");
}

export function parseOdhinApiLogMode(
  env: Record<string, string | undefined>
): OdhinApiLogMode {
  const value = env.PW_ODHIN_API_LOGS?.trim().toLowerCase();
  if (!value) {
    return "api-only";
  }

  if (FALSY_FLAGS.has(value)) {
    return "off";
  }

  if (value === "api" || value === "api-only") {
    return "api-only";
  }

  if (TRUTHY_FLAGS.has(value) || value === "all") {
    return "all";
  }

  return "api-only";
}

export function resolveApiLogStdoutLimit(
  env: Record<string, string | undefined>
): number {
  const raw = env.PW_ODHIN_API_STDOUT_KB;
  if (!raw) {
    return DEFAULT_STDOUT_LIMIT_KB * 1024;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_STDOUT_LIMIT_KB * 1024;
  }
  if (parsed <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return parsed * 1024;
}

export function truncateApiLogPayload(
  payload: string,
  limitBytes: number
): { payload: string; truncatedBytes: number } {
  if (!Number.isFinite(limitBytes) || limitBytes <= 0) {
    return { payload, truncatedBytes: 0 };
  }

  if (payload.length <= limitBytes) {
    return { payload, truncatedBytes: 0 };
  }

  return {
    payload: payload.slice(0, limitBytes),
    truncatedBytes: payload.length - limitBytes,
  };
}

export function resolveApiAttachmentLimit(
  env: Record<string, string | undefined>
): number {
  const raw = env.PW_ODHIN_API_ATTACH_KB;
  if (!raw) {
    return DEFAULT_ATTACHMENT_LIMIT_KB * 1024;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return parsed * 1024;
}

export function resolveApiMaxLogs(
  env: Record<string, string | undefined>
): number {
  const raw = env.PW_ODHIN_API_MAX_LOGS;
  if (!raw) {
    return DEFAULT_MAX_LOGS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_MAX_LOGS;
  }
  return parsed;
}

export function resolveApiMaxFieldChars(
  env: Record<string, string | undefined>
): number {
  const raw = env.PW_ODHIN_API_MAX_FIELD_CHARS;
  if (!raw) {
    return DEFAULT_MAX_FIELD_CHARS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_MAX_FIELD_CHARS;
  }
  return parsed;
}

export function buildApiAttachmentPayload(
  recorder: ApiRecorder,
  options: {
    includeRawBodies: boolean;
    limitBytes: number;
    summaryLimit: number;
  }
): { payload: string; mode: AttachmentMode; note?: string } {
  const attempts: Array<{
    payload: string;
    mode: AttachmentMode;
    note?: string;
  }> = [];

  const primaryPayload = recorder.toJson(options.includeRawBodies);
  attempts.push({
    payload: primaryPayload,
    mode: options.includeRawBodies ? "raw" : "sanitised",
  });

  if (options.includeRawBodies) {
    attempts.push({
      payload: recorder.toJson(false),
      mode: "sanitised",
      note: "Raw request/response bodies omitted to keep the attachment under the configured size limit.",
    });
  }

  const summary = buildApiLogSummary(
    recorder.toArray(),
    options.summaryLimit
  );
  const summaryPayload = JSON.stringify(summary, null, 2);
  attempts.push({
    payload: summaryPayload,
    mode: "summary",
    note:
      summary.truncated > 0
        ? `${summary.truncated} entr${
            summary.truncated === 1 ? "y" : "ies"
          } omitted from the attachment summary.`
        : "Attachment contains summary data only.",
  });

  for (const attempt of attempts) {
    if (
      !Number.isFinite(options.limitBytes) ||
      attempt.payload.length <= options.limitBytes
    ) {
      return attempt;
    }
  }

  const hardLimit = Number.isFinite(options.limitBytes)
    ? Math.max(0, Math.floor(options.limitBytes))
    : summaryPayload.length;
  return {
    payload: summaryPayload.slice(0, hardLimit),
    mode: "summary",
    note: `Attachment truncated to ${formatBytes(
      options.limitBytes
    )}; review the stdout summary for the full list of API calls.`,
  };
}

export function buildApiLogSummary(
  entries: ReadonlyArray<ApiLogEntry>,
  limit: number
): { summary: string; truncated: number } {
  if (!entries.length) {
    return { summary: "(no API calls captured)", truncated: 0 };
  }

  const lines: string[] = [];
  const maxEntries = Number.isFinite(limit) ? Math.floor(limit) : entries.length;
  entries.slice(0, maxEntries).forEach((entry, index) => {
    lines.push(formatSummaryLine(entry, index));
  });

  return {
    summary: lines.join("\n"),
    truncated: Math.max(0, entries.length - maxEntries),
  };
}

function formatSummaryLine(entry: ApiLogEntry, index: number): string {
  const prefix = `${index + 1}.`;
  const name = entry.name ? `[${entry.name}] ` : "";
  const method = entry.method;
  const url = truncateMiddle(entry.url, SUMMARY_URL_LIMIT);
  const status = `${entry.status}${entry.ok ? "" : " ❌"}`;
  const duration = `${entry.durationMs}ms`;
  const correlation = entry.correlationId
    ? ` cid=${truncateMiddle(entry.correlationId, 32)}`
    : "";

  let bodyNote = "";
  if (entry.request?.data) {
    bodyNote = ` req=${truncateValue(
      JSON.stringify(entry.request.data),
      SUMMARY_BODY_LIMIT
    )}`;
  } else if (entry.request?.form) {
    bodyNote = ` form=${truncateValue(
      JSON.stringify(entry.request.form),
      SUMMARY_BODY_LIMIT
    )}`;
  }

  return `${prefix} ${name}${method} ${url} -> ${status} (${duration})${correlation}${bodyNote}`;
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const half = Math.floor(maxLength / 2);
  return `${value.slice(0, half)}…${value.slice(-half)}`;
}

function truncateValue(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

export function resolveApiStdoutMode(
  env: Record<string, string | undefined>
): ApiStdoutMode {
  const raw = env.PW_ODHIN_API_STDOUT_MODE?.trim().toLowerCase();
  if (!raw) {
    return DEFAULT_STDOUT_MODE;
  }
  if (raw === "json") {
    return "json";
  }
  return "summary";
}

export function resolveApiSummaryLimit(
  env: Record<string, string | undefined>
): number {
  const raw = env.PW_ODHIN_API_SUMMARY_LINES;
  if (!raw) {
    return DEFAULT_SUMMARY_LIMIT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return parsed;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) {
    return "unbounded";
  }
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}
