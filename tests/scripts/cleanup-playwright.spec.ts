import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { basename, join, resolve } from "path";
import {
  lstatSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import os from "os";

let cleanupPlaywrightModules: (baseDir?: string) => void;

beforeEach(async () => {
  ({ cleanupPlaywrightModules } = await import(
    "../../scripts/cleanup-playwright.mjs"
  ));
});

describe("cleanup-playwright script", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(os.tmpdir(), "cleanup-playwright-"));
    seedTopLevelModules(tempDir);
    seedNestedCopies(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("replaces nested module copies with symlinks to the top-level install", () => {
    cleanupPlaywrightModules(tempDir);

    for (const { nested, topLevel } of modulePairs(tempDir)) {
      const stats = lstatSync(nested);
      expect(stats.isSymbolicLink()).toBe(true);
      expect(realpathSync(nested)).toBe(realpathSync(topLevel));
    }
  });

  it("is idempotent when run multiple times", () => {
    cleanupPlaywrightModules(tempDir);
    const firstTargets = modulePairs(tempDir).map(({ nested, topLevel }) => ({
      nested,
      topLevel,
      resolved: realpathSync(nested),
    }));

    cleanupPlaywrightModules(tempDir);

    for (const target of firstTargets) {
      expect(lstatSync(target.nested).isSymbolicLink()).toBe(true);
      expect(realpathSync(target.nested)).toBe(target.resolved);
    }
  });

  it("rebuilds dangling symlinks that point to stale locations", () => {
    cleanupPlaywrightModules(tempDir);
    const staleRoot = join(tempDir, "stale");

    for (const { nested } of modulePairs(tempDir)) {
      rmSync(nested, { recursive: true, force: true });
      const staleTarget = join(staleRoot, basename(nested));
      symlinkSync(staleTarget, nested, "junction");
    }

    cleanupPlaywrightModules(tempDir);

    for (const { nested, topLevel } of modulePairs(tempDir)) {
      expect(lstatSync(nested).isSymbolicLink()).toBe(true);
      expect(realpathSync(nested)).toBe(realpathSync(topLevel));
    }
  });

  it("skips work when the top-level module is absent", () => {
    rmSync(join(tempDir, "node_modules", "playwright"), { recursive: true });
    cleanupPlaywrightModules(tempDir);
    const nestedPath = join(
      tempDir,
      "node_modules",
      "@hmcts",
      "playwright-common",
      "node_modules",
      "playwright"
    );
    expect(lstatSync(nestedPath).isDirectory()).toBe(true);
  });
});

function modulePairs(baseDir: string) {
  const nestedRoot = join(
    baseDir,
    "node_modules",
    "@hmcts",
    "playwright-common",
    "node_modules"
  );
  const topRoot = join(baseDir, "node_modules");

  return [
    {
      nested: resolve(nestedRoot, "@playwright"),
      topLevel: resolve(topRoot, "@playwright"),
    },
    {
      nested: resolve(nestedRoot, "playwright"),
      topLevel: resolve(topRoot, "playwright"),
    },
    {
      nested: resolve(nestedRoot, "playwright-core"),
      topLevel: resolve(topRoot, "playwright-core"),
    },
  ];
}

function seedTopLevelModules(baseDir: string) {
  for (const { topLevel } of modulePairs(baseDir)) {
    mkdirSync(topLevel, { recursive: true });
    writeFileSync(join(topLevel, "package.json"), "{}");
  }
}

function seedNestedCopies(baseDir: string) {
  for (const { nested } of modulePairs(baseDir)) {
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(nested, "placeholder.txt"), "duplicate");
  }
}
