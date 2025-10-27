import type { ApiLogEntry } from "@hmcts/playwright-common";

const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on"]);

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
