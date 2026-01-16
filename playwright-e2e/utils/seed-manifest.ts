import fs from "node:fs";
import path from "node:path";

export type SeedManifest = {
  version: number;
  environment: string;
  data: {
    caseId: string;
    taskId: string;
    userId: string;
    refData?: Record<string, string>;
  };
};

const DEFAULT_MANIFEST_PATH = path.resolve(
  process.cwd(),
  "playwright-e2e",
  "data",
  "seed-manifest.json"
);

const REQUIRED_DATA_KEYS = ["caseId", "taskId", "userId"] as const;

export function resolveSeedManifestPath(
  env: NodeJS.ProcessEnv = process.env
): string {
  return env.SEED_MANIFEST_PATH?.trim() || DEFAULT_MANIFEST_PATH;
}

export function loadSeedManifest(
  manifestPath: string = resolveSeedManifestPath()
): SeedManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      [
        `Seed manifest not found at: ${manifestPath}`,
        "Set SEED_MANIFEST_PATH or copy/edit the sample manifest at:",
        DEFAULT_MANIFEST_PATH,
      ].join("\n")
    );
  }

  let parsed: SeedManifest;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to parse seed manifest JSON at ${manifestPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  validateSeedManifest(parsed, manifestPath);
  return parsed;
}

function validateSeedManifest(
  manifest: SeedManifest,
  manifestPath: string
): void {
  if (!manifest || typeof manifest !== "object") {
    throw new Error(`Seed manifest at ${manifestPath} is not an object.`);
  }
  if (!Number.isFinite(manifest.version) || manifest.version <= 0) {
    throw new Error(
      `Seed manifest at ${manifestPath} must include a positive "version" number.`
    );
  }
  if (!isNonEmptyString(manifest.environment)) {
    throw new Error(
      `Seed manifest at ${manifestPath} must include an "environment" string.`
    );
  }
  if (!manifest.data || typeof manifest.data !== "object") {
    throw new Error(
      `Seed manifest at ${manifestPath} must include a "data" object.`
    );
  }

  const missing = REQUIRED_DATA_KEYS.filter(
    (key) => !isNonEmptyString(manifest.data[key])
  );
  if (missing.length > 0) {
    throw new Error(
      `Seed manifest at ${manifestPath} missing required data keys: ${missing.join(
        ", "
      )}`
    );
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
