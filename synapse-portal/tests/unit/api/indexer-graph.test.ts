import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/indexer/graph/route";
import { prisma } from "@/lib/db";
import { IndexerFile, IndexerDependency } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      indexerFile: {
        findMany: vi.fn(),
      },
      indexerDependency: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("API Indexer Graph Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return graph data for given repo", async () => {
    const mockFiles = [
      { id: "file-1", path: "src/index.ts", repo: "test-repo", symbols: [] },
      { id: "file-2", path: "src/utils.ts", repo: "test-repo", symbols: [] },
    ];
    const mockDeps = [
      {
        id: "dep-1",
        dependentFileId: "file-1",
        dependencyFileId: "file-2",
        symbolName: "foo",
      },
    ];

    vi.mocked(prisma.indexerFile.findMany).mockResolvedValue(
      mockFiles as unknown as IndexerFile[],
    );
    vi.mocked(prisma.indexerDependency.findMany).mockResolvedValue(
      mockDeps as unknown as IndexerDependency[],
    );

    const req = new Request(
      "http://localhost/api/indexer/graph?repo=test-repo",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      files: mockFiles,
      dependencies: mockDeps,
    });

    expect(prisma.indexerFile.findMany).toHaveBeenCalledWith({
      where: {
        repo: {
          name: "test-repo",
        },
      },
      include: { symbols: true },
    });
    expect(prisma.indexerDependency.findMany).toHaveBeenCalledWith({
      where: {
        dependentFileId: { in: ["file-1", "file-2"] },
        dependencyFileId: { in: ["file-1", "file-2"] },
      },
    });
  });

  it("should fallback to default repo 'synapse' if not specified", async () => {
    vi.mocked(prisma.indexerFile.findMany).mockResolvedValue([]);
    vi.mocked(prisma.indexerDependency.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/indexer/graph");
    await GET(req);

    expect(prisma.indexerFile.findMany).toHaveBeenCalledWith({
      where: {
        repo: {
          name: "synapse",
        },
      },
      include: { symbols: true },
    });
  });

  it("should return 500 error on database failure", async () => {
    vi.mocked(prisma.indexerFile.findMany).mockRejectedValue(
      new Error("DB Error"),
    );

    const req = new Request("http://localhost/api/indexer/graph");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "DB Error" });
  });

  it("should handle non-Error exceptions gracefully", async () => {
    vi.mocked(prisma.indexerFile.findMany).mockRejectedValue("String DB Error");

    const req = new Request("http://localhost/api/indexer/graph");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal Server Error" });
  });
});
