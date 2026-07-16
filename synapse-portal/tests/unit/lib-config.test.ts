import { describe, it, expect } from "vitest";
import {
  getAIConfig,
  MANIFEST_PATH,
} from "@/lib/config";

describe("lib/config", () => {
  it("should return valid AI configuration options", () => {
    const config = getAIConfig();
    expect(config).toHaveProperty("gemini");
    expect(config).toHaveProperty("stitch");
    expect(config).toHaveProperty("context7");
    expect(typeof config.gemini.is_active).toBe("boolean");
  });

  it("should resolve manifest path to a valid non-empty string", () => {
    expect(typeof MANIFEST_PATH).toBe("string");
    expect(MANIFEST_PATH.length).toBeGreaterThan(0);
  });
});
