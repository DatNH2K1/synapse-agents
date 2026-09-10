import { describe, it, expect } from "vitest";
import { listWritingStyles, extractWritingStyle } from "./index";

describe("Copywriting Tool Module", () => {
  it("should handle list writing styles when dir exists or not", () => {
    const result = listWritingStyles();
    expect(result).toBeDefined();
  });

  it("should extract writing style or return error when not found", () => {
    const result = extractWritingStyle("non-existent-style");
    expect(result).toContain("Error");
  });
});
