import { existsSync, realpathSync, rmSync, symlinkSync } from "fs";
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
    if (!existsSync(topLevel)) continue;

    if (existsSync(nested)) {
      const resolved = realpathSync(nested);
      if (resolved === topLevel) {
        continue;
      }
      rmSync(nested, { recursive: true, force: true });
    }

    if (!existsSync(nested)) {
      symlinkSync(topLevel, nested, "junction");
    }
  }
}

const isDirectExecution =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  cleanupPlaywrightModules();
}
