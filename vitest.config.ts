import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    environment: "node",
    reporters: "default",
    coverage: {
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      exclude: ["**/dist/**"],
    },
  },
});
