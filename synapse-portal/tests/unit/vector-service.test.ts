// Set env variables BEFORE any imports so the module-level constants evaluate correctly
process.env.GEMINI_API_KEY = "test-key";
process.env.GEMINI_EMBEDDING_MODEL = "test-model";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      node: {
        findUnique: vi.fn(),
      },
    },
  };
});

const embedContentMock = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          embedContent: embedContentMock,
        };
      }
    },
  };
});

describe("VectorService Tests", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateEmbedding", () => {
    it("should return null if GEMINI_API_KEY is not defined", async () => {
      delete process.env.GEMINI_API_KEY;
      const { vectorService } = await import("@/lib/services/vector-service");
      const embedding = await vectorService.generateEmbedding("test text");
      expect(embedding).toBeNull();
    });

    it("should return null if GEMINI_EMBEDDING_MODEL is not defined", async () => {
      vi.resetModules();
      delete process.env.GEMINI_EMBEDDING_MODEL;
      const { vectorService } = await import("@/lib/services/vector-service");
      const embedding = await vectorService.generateEmbedding("test text");
      expect(embedding).toBeNull();
    });

    it("should return embedding values if model returns correct dimensions", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      const dummyEmbedding = new Array(3072).fill(0.1);
      embedContentMock.mockResolvedValue({
        embedding: { values: dummyEmbedding },
      } as object as { embedding: { values: number[] } });

      const embedding = await vectorService.generateEmbedding("test text");
      expect(embedding).toEqual(dummyEmbedding);
    });

    it("should return null and warn if dimension mismatch", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      const dummyEmbedding = [0.1, 0.2];
      embedContentMock.mockResolvedValue({
        embedding: { values: dummyEmbedding },
      } as object as { embedding: { values: number[] } });

      const embedding = await vectorService.generateEmbedding("test text");
      expect(embedding).toBeNull();
    });

    it("should return null if generator throws an error", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      embedContentMock.mockRejectedValue(new Error("API Error"));

      const embedding = await vectorService.generateEmbedding("test text");
      expect(embedding).toBeNull();
    });
  });

  describe("findSimilarNodes", () => {
    it("should return empty list if API key is not present", async () => {
      vi.resetModules();
      delete process.env.GEMINI_API_KEY;
      const { vectorService } = await import("@/lib/services/vector-service");

      const results = await vectorService.findSimilarNodes("query", "LESSON");
      expect(results).toEqual([]);
    });

    it("should query database and map results on success", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      const dummyEmbedding = new Array(3072).fill(0.1);
      embedContentMock.mockResolvedValue({
        embedding: { values: dummyEmbedding },
      } as object as { embedding: { values: number[] } });

      const mockDbResults = [
        { id: "node-1", label: "Similar Node 1", score: 0.85 },
      ];
      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockDbResults);

      const results = await vectorService.findSimilarNodes("query", "LESSON");
      expect(results).toEqual([
        { id: "node-1", label: "Similar Node 1", score: 0.85 },
      ]);
    });

    it("should return empty list if database query fails", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      const dummyEmbedding = new Array(3072).fill(0.1);
      embedContentMock.mockResolvedValue({
        embedding: { values: dummyEmbedding },
      } as object as { embedding: { values: number[] } });

      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("DB Error"));

      const results = await vectorService.findSimilarNodes("query", "LESSON");
      expect(results).toEqual([]);
    });
  });

  describe("findSimilarToNode", () => {
    it("should perform DB-side vector similarity check if node has embedding", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      vi.mocked(prisma.node.findUnique).mockResolvedValue({
        id: "node-abc",
        label: "Source Node",
        properties: JSON.stringify({ content: "Source content" }),
      } as object as Awaited<ReturnType<typeof prisma.node.findUnique>>);

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ has_embedding: true }]) // first raw call: embeddingCheck
        .mockResolvedValueOnce([
          { id: "node-xyz", label: "Target Node", score: 0.9 },
        ]); // second raw call: DB-side search

      const results = await vectorService.findSimilarToNode(
        "node-abc",
        "LESSON",
        "fallback",
      );
      expect(results).toEqual([
        { id: "node-xyz", label: "Target Node", score: 0.9 },
      ]);
    });

    it("should fallback to text-based search if node does not have embedding", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      vi.mocked(prisma.node.findUnique).mockResolvedValue({
        id: "node-abc",
        label: "Source Node",
        properties: JSON.stringify({ content: "Source content" }),
      } as object as Awaited<ReturnType<typeof prisma.node.findUnique>>);

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ has_embedding: false }]) // embeddingCheck
        .mockResolvedValueOnce([
          { id: "node-xyz", label: "Target Node 2", score: 0.88 },
        ]); // queryRaw in findSimilarNodes

      const dummyEmbedding = new Array(3072).fill(0.1);
      embedContentMock.mockResolvedValue({
        embedding: { values: dummyEmbedding },
      } as object as { embedding: { values: number[] } });

      const results = await vectorService.findSimilarToNode(
        "node-abc",
        "LESSON",
        "fallback",
      );
      expect(results).toEqual([
        { id: "node-xyz", label: "Target Node 2", score: 0.88 },
      ]);
    });
  });

  describe("updateNodeEmbedding", () => {
    it("should update database embedding on success", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      const dummyEmbedding = new Array(3072).fill(0.1);
      embedContentMock.mockResolvedValue({
        embedding: { values: dummyEmbedding },
      } as object as { embedding: { values: number[] } });

      const success = await vectorService.updateNodeEmbedding(
        "node-id",
        "some text",
      );
      expect(success).toBe(true);
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it("should set embedding to NULL and return false if embedding generation fails", async () => {
      vi.resetModules();
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GEMINI_EMBEDDING_MODEL = "test-model";
      const { vectorService } = await import("@/lib/services/vector-service");

      embedContentMock.mockRejectedValue(new Error("API Failure"));

      const success = await vectorService.updateNodeEmbedding(
        "node-id",
        "some text",
      );
      expect(success).toBe(false);
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });
  });
});
