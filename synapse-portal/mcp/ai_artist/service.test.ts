import { describe, it, expect } from "vitest";
import { generateAiArt, searchAiArtPrompts } from "./index";

describe("AI Artist Tool Module", () => {
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
