import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIService } from "@/lib/services/ai-service";

const generateContentMock = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: generateContentMock,
        };
      }
    },
  };
});

describe("AIService Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should perform a manual merge when GEMINI_API_KEY is not defined", async () => {
    delete process.env.GEMINI_API_KEY;

    const service = new AIService();
    const nodes = [
      { label: "Node A", content: "Content of A" },
      { label: "Node B", content: "Content of B" },
    ];

    const result = await service.synthesizeKnowledge(nodes);

    expect(result.label).toBe("Node A");
    expect(result.content).toContain("Content of A");
    expect(result.content).toContain("Content of B");
    expect(result.reason).toContain("Manual merge");
  });

  it("should throw error if GEMINI_MODEL is not set but API key is present", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;

    const service = new AIService();
    const nodes = [{ label: "A", content: "B" }];

    await expect(service.synthesizeKnowledge(nodes)).rejects.toThrow(
      "GEMINI_MODEL environment variable is not defined",
    );
  });

  it("should parse Gemini synthesized response correctly", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-1.5-flash";

    const mockResponse = {
      label: "Synthesized Title",
      content: "Synthesized markdown body",
      reason: "Justification statement",
    };

    generateContentMock.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    });

    const service = new AIService();
    const result = await service.synthesizeKnowledge([
      { label: "A", content: "B" },
    ]);

    expect(result).toEqual(mockResponse);
  });

  it("should handle block-markdown quotes wrap in JSON return", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-1.5-flash";

    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          '```json\n{"label": "Title", "content": "Body", "reason": "Reason"}\n```',
      },
    });

    const service = new AIService();
    const result = await service.synthesizeKnowledge([
      { label: "A", content: "B" },
    ]);

    expect(result.label).toBe("Title");
    expect(result.content).toBe("Body");
  });

  it("should fallback gracefully if JSON parsing or generation fails", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-1.5-flash";

    generateContentMock.mockRejectedValue(new Error("API Timeout"));

    const service = new AIService();
    const result = await service.synthesizeKnowledge([
      { label: "Node A", content: "Content of A" },
    ]);

    expect(result.label).toBe("Node A");
    expect(result.reason).toContain("Failed to synthesize");
  });
});
