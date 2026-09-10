import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { initBetterAuth } from "./index";

describe("Better Auth Tool Module", () => {
  it("should generate config for postgresql with github & google auth", () => {
    const testDir = path.resolve(__dirname, "../../tests/fixtures/test-better-auth");
    try {
      const result = initBetterAuth(
        "postgresql",
        ["email", "github", "google"],
        testDir,
      );
      expect(result).toContain("Better Auth Initialization Successful");
      expect(result).toContain("auth.ts");
    } finally {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    }
  });

  it("should return error on invalid db type", () => {
    const result = initBetterAuth("invalid_db", ["email"]);
    expect(result).toContain("Error: Invalid db_type");
  });
});
