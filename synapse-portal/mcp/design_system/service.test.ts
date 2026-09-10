import { describe, it, expect } from "vitest";
import { generateDesignSystemRecommendation } from "./index";

describe("Design System Tool Module", () => {
  it("should generate recommendations for SaaS dashboard", () => {
    const result = generateDesignSystemRecommendation("SaaS dashboard", "AnalyticsHub", "markdown");
    expect(result).toContain("Design System");
    expect(result).toContain("Color Palette");
    expect(result).toContain("Typography");
  });
});
