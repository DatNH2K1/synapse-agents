import { describe, it, expect } from "vitest";
import { formatTagName, formatFullTag } from "@/lib/format-utils";

describe("format-utils Tests", () => {
  describe("formatTagName", () => {
    it("should format kebab-case names properly", () => {
      expect(formatTagName("react-query")).toBe("React Query");
    });

    it("should format snake_case names properly", () => {
      expect(formatTagName("vector_service")).toBe("Vector Service");
    });

    it("should handle mixed separators and filter empty strings", () => {
      expect(formatTagName("mixed-snake_case--test")).toBe(
        "Mixed Snake Case Test",
      );
    });

    it("should append version if provided", () => {
      expect(formatTagName("react", "18.2.0")).toBe("React v18.2.0");
      expect(formatTagName("next-js", "14")).toBe("Next Js v14");
    });

    it("should ignore empty/null/undefined version", () => {
      expect(formatTagName("react", null)).toBe("React");
      expect(formatTagName("react", "")).toBe("React");
      expect(formatTagName("react", undefined)).toBe("React");
    });
  });

  describe("formatFullTag", () => {
    it("should format with uppercase scope and tag name", () => {
      expect(formatFullTag("project", "synapse-portal")).toBe(
        "[PROJECT] Synapse Portal",
      );
    });

    it("should format with scope, name and version", () => {
      expect(formatFullTag("technology", "nextjs", "15")).toBe(
        "[TECHNOLOGY] Nextjs v15",
      );
    });
  });
});
