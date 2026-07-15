import { describe, it, expect } from "vitest";
import { NODE_TYPES } from "@/lib/constants";

describe("lib/constants", () => {
  it("should contain standard Node types", () => {
    expect(NODE_TYPES).toContain("Lesson");
    expect(NODE_TYPES).toContain("Context");
    expect(NODE_TYPES).toContain("Feature");
    expect(NODE_TYPES).toHaveLength(3);
  });
});
