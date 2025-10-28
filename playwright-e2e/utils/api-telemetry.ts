import type { ApiLogEntry } from "@hmcts/playwright-common";

const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on", "all"]);
const FALSY_FLAGS = new Set(["0", "false", "no", "off"]);

type OdhinApiLogMode = "off" | "api-only" | "all";

export class ApiRecorder {
  private readonly entries: ApiLogEntry[] = [];

  constructor(private readonly includeRaw: boolean) {}

  public record(entry: ApiLogEntry): void {
    this.entries.push(entry);
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
