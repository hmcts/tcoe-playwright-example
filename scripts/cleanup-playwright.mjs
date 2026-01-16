import {
  lstatSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function cleanupPlaywrightModules(baseDir = path.join(__dirname, "..")) {
  const commonRoot = path.join(
    baseDir,
    "node_modules",
    "@hmcts",
    "playwright-common"
  );
  if (!safeLstat(commonRoot)) {
    return;
  }

  const nestedModulesRoot = ensureNestedModulesRoot(commonRoot);
  const topLevelRoot = path.join(baseDir, "node_modules");

  const targets = [
    { name: "@playwright" },
    { name: "playwright" },
    { name: "playwright-core" },
  ];

  for (const { name } of targets) {
    symlinkTargetIfNeeded(
      path.join(nestedModulesRoot, name),
      path.join(topLevelRoot, name)
    );
  }
}

function ensureNestedModulesRoot(commonRoot) {
  const nestedModulesRoot = path.join(commonRoot, "node_modules");
  if (!safeLstat(nestedModulesRoot)) {
    mkdirSync(nestedModulesRoot, { recursive: true });
  }
  return nestedModulesRoot;
}

function symlinkTargetIfNeeded(nested, topLevel) {
  if (!safeLstat(topLevel)) {
    return;
  }

  if (isAlreadyLinked(nested, topLevel)) {
    return;
  }

  removeIfExists(nested);

  if (!safeLstat(nested)) {
    symlinkSync(topLevel, nested, "junction");
  }
}

function isAlreadyLinked(nested, topLevel) {
  const nestedStats = safeLstat(nested);
  if (!nestedStats) {
    return false;
  }

  const resolvedNested = safeRealpath(nested);
  const resolvedTopLevel = safeRealpath(topLevel);
  
  return resolvedNested && resolvedTopLevel && resolvedNested === resolvedTopLevel;
}

function removeIfExists(nested) {
  const nestedStats = safeLstat(nested);
  if (!nestedStats) {
    return;
  }

  if (nestedStats.isSymbolicLink()) {
    unlinkSync(nested);
  } else {
    rmSync(nested, { recursive: true, force: true });
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
