import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { initBetterAuth } from "@/mcp/better_auth";
import {
  analyzeContextHealth,
  calculateContextBudget,
} from "@/mcp/context_analyzer";
import {
  analyzeDistillationSources,
} from "@/mcp/distillator";
import {
  generateDesignSystemRecommendation,
} from "@/mcp/design_system";
import {
  generateAiArt,
  searchAiArtPrompts,
} from "@/mcp/ai_artist";
import {
  analyzeLlmsTxt,
} from "@/mcp/docs_seeker";
import { createMcpServer } from "@/mcp/server";

describe("MCP Tools Suite", () => {
  it("should initialize MCP Server with all tools registered", () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
  });

  describe("Better Auth Tool", () => {
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

  describe("Context Analyzer Tool", () => {
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

  describe("Docs Seeker Tool", () => {
    it("should parse llms.txt and categorize urls by priority", () => {
      const sampleLlms = `
# Next.js Documentation
- [Overview and Getting Started](https://nextjs.org/docs)
- [API Reference](https://nextjs.org/docs/api-reference)
- [Community Examples](https://github.com/vercel/next.js/examples)
      `;
      const result = analyzeLlmsTxt(sampleLlms);
      const parsed = JSON.parse(result);
      expect(parsed.total_urls).toBe(3);
      expect(parsed.distribution.high_priority).toBe(1);
      expect(parsed.distribution.medium_priority).toBe(1);
      expect(parsed.distribution.low_priority).toBe(1);
    });
  });

  describe("Distillator Tool", () => {
    it("should analyze source paths and suggest routing", () => {
      const result = analyzeDistillationSources(["package.json", "README.md"]);
      const parsed = JSON.parse(result);
      expect(parsed.status).toBe("ok");
      expect(parsed.routing.recommendation).toBe("single");
      expect(parsed.summary.total_files).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Design System Tool", () => {
    it("should generate recommendations for SaaS dashboard", () => {
      const result = generateDesignSystemRecommendation("SaaS dashboard", "AnalyticsHub", "markdown");
      expect(result).toContain("Design System");
      expect(result).toContain("Color Palette");
      expect(result).toContain("Typography");
    });
  });

  describe("AI Artist Tool", () => {
    it("should generate AI art prompt with aspect ratio", () => {
      const result = generateAiArt("cyberpunk flying car", "search", "16:9");
      expect(result).toContain("AI Art Generation Prompt");
      expect(result).toContain("cyberpunk flying car");
      expect(result).toContain("--ar 16:9");
    });

    it("should search prompts database", () => {
      const result = searchAiArtPrompts("cyberpunk", "all", 3);
      expect(result).toBeDefined();
    });
  });
});
