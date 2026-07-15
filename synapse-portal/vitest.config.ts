import { defineConfig } from "vitest/config";

import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    // Suppress all console.log/warn/error output during tests.
    // Return false = swallow the log. Remove this block to restore logs.
    onConsoleLog() {
      return false;
    },
    exclude: ["node_modules", ".next", "dist", ".git", ".cache"],
    environment: "jsdom",
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["lib/**/*", "components/**/*", "app/**/*"],
      exclude: [
        "app/layout.tsx",
        "app/api/auth/**/*",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/types.ts",
      ],
    },
  },
});
