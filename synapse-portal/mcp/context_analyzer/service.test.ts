import { describe, it, expect } from "vitest";
import { analyzeContextHealth, calculateContextBudget } from "./index";

describe("Context Analyzer Tool Module", () => {
  it("should calculate context budget accurately", () => {
    const budgetJson = calculateContextBudget(2000, 1500, 3000, 5000, 0.15);
    const data = JSON.parse(budgetJson);
    expect(data.total_budget).toBe(13225);
    expect(data.allocation.system_prompt).toBe(2000);
    expect(data.warning_threshold).toBeDefined();
  });

  it("should analyze context health on valid JSON or return error on missing file", () => {
    const result = analyzeContextHealth("non-existent-context.json", 128000);
    expect(result).toContain("Error: File not found");
  });
});
