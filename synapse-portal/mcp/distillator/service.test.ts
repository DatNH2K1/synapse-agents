import { describe, it, expect } from "vitest";
import { analyzeDistillationSources } from "./index";

describe("Distillator Tool Module", () => {
  it("should analyze source paths and suggest routing", () => {
    const result = analyzeDistillationSources(["package.json", "README.md"]);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe("ok");
    expect(parsed.routing.recommendation).toBe("single");
    expect(parsed.summary.total_files).toBeGreaterThanOrEqual(1);
  });
});
