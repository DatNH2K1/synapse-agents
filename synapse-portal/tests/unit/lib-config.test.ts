import { describe, it, expect } from "vitest";
import {
  getAIConfig,
  AGENT_MANIFEST_PATH,
  SKILL_MANIFEST_PATH,
  ADDITIONAL_SKILL_MANIFEST_PATH,
} from "@/lib/config";

describe("lib/config", () => {
  it("should return valid AI configuration options", () => {
    const config = getAIConfig();
    expect(config).toHaveProperty("gemini");
    expect(config).toHaveProperty("stitch");
    expect(config).toHaveProperty("context7");
    expect(typeof config.gemini.is_active).toBe("boolean");
  });

  it("should resolve manifest paths to valid non-empty strings", () => {
    expect(typeof AGENT_MANIFEST_PATH).toBe("string");
    expect(typeof SKILL_MANIFEST_PATH).toBe("string");
    expect(typeof ADDITIONAL_SKILL_MANIFEST_PATH).toBe("string");
    expect(AGENT_MANIFEST_PATH.length).toBeGreaterThan(0);
  });
});
