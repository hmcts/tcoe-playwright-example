import { lstatSync, realpathSync, rmSync, symlinkSync, unlinkSync } from "fs";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function cleanupPlaywrightModules(baseDir = path.join(__dirname, "..")) {
  const nestedModulesRoot = path.join(
    baseDir,
    "node_modules",
    "@hmcts",
    "playwright-common",
    "node_modules"
  );

  const topLevelRoot = path.join(baseDir, "node_modules");

  const targets = [
    {
      nested: path.join(nestedModulesRoot, "@playwright"),
      topLevel: path.join(topLevelRoot, "@playwright"),
    },
    {
      nested: path.join(nestedModulesRoot, "playwright"),
      topLevel: path.join(topLevelRoot, "playwright"),
    },
    {
      nested: path.join(nestedModulesRoot, "playwright-core"),
      topLevel: path.join(topLevelRoot, "playwright-core"),
    },
  ];

  for (const { nested, topLevel } of targets) {
    const topLevelStats = safeLstat(topLevel);
    if (!topLevelStats) continue;

    const nestedStats = safeLstat(nested);
    if (nestedStats) {
      const resolvedNested = safeRealpath(nested);
      const resolvedTopLevel = safeRealpath(topLevel);
      if (resolvedNested && resolvedTopLevel && resolvedNested === resolvedTopLevel) {
        continue;
      }
      if (nestedStats.isSymbolicLink()) {
        unlinkSync(nested);
      } else {
        rmSync(nested, { recursive: true, force: true });
      }
    }

    if (!safeLstat(nested)) {
      symlinkSync(topLevel, nested, "junction");
    }
  }
}

function safeLstat(target) {
  try {
    return lstatSync(target);
  } catch {
    return undefined;
  }
}

function safeRealpath(target) {
  try {
    return realpathSync(target);
  } catch {
    return undefined;
  }
}

const isDirectExecution =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  cleanupPlaywrightModules();
}
