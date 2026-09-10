import { describe, it, expect, vi } from "vitest";
import { queryRepositoryIndex, indexRepository } from "./index";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    indexerFile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    indexerDependency: {
      findMany: vi.fn(),
    },
    indexerRepo: {
      upsert: vi.fn(),
    },
  },
}));

describe("Repo Indexer Tool Module", () => {
  it("should return error on non-existent directory", async () => {
    const result = await indexRepository("non-existent-directory-xyz");
    expect(result).toContain("Error: Path");
  });

  it("should query repository index successfully", async () => {
    vi.mocked(prisma.indexerFile.findMany).mockResolvedValueOnce([
      { path: "src/index.ts" } as never,
    ]);
    const result = await queryRepositoryIndex("synapse");
    const parsed = JSON.parse(result);
    expect(parsed.repo).toBe("synapse");
    expect(parsed.files).toContain("src/index.ts");
  });
});
