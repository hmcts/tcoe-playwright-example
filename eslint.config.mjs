import { LintingConfig } from "@hmcts/playwright-common";
import tseslint from "typescript-eslint";

const ignored = {
  ignores: [
    ...LintingConfig.ignored.ignores,
    "playwright-report/**",
    "test-results/**",
    "functional-output/**",
  ],
};

const playwrightConfig = {
  ...LintingConfig.playwright,
  files: ["playwright-e2e/**/*.ts"],
};

export default tseslint.config(
  LintingConfig.tseslintRecommended,
  ignored,
  LintingConfig.tseslintPlugin,
  playwrightConfig
);
