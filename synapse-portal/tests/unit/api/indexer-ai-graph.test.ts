import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/indexer/ai/graph/route";
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

describe("API Indexer AI Graph Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return dependency graph for given repo on success", async () => {
    const mockFiles = [
      {
        id: "id-1",
        path: "src/main.ts",
        symbols: [{ name: "main", kind: "function", range: "1:0" }],
      },
      { id: "id-2", path: "src/utils.ts", symbols: [] },
    ];
    const mockDeps = [
      { dependentFileId: "id-1", dependencyFileId: "id-2" },
      { dependentFileId: "id-1", dependencyFileId: "id-2" }, // duplicate
      { dependentFileId: "id-1", dependencyFileId: "id-invalid" }, // invalid
    ];

    vi.mocked(prisma.indexerFile.findMany).mockResolvedValue(
      mockFiles as unknown as IndexerFile[],
    );
    vi.mocked(prisma.indexerDependency.findMany).mockResolvedValue(
      mockDeps as unknown as IndexerDependency[],
    );

    const req = new Request("http://localhost/api/indexer/ai/graph");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.graph["src/main.ts"]).toBeDefined();
    expect(data.graph["src/main.ts"].dependencies).toEqual(["src/utils.ts"]);
    expect(data.graph["src/main.ts"].symbols).toEqual([
      { name: "main", kind: "function", range: "1:0" },
    ]);
  });

  it("should handle exceptions gracefully", async () => {
    vi.mocked(prisma.indexerFile.findMany).mockRejectedValue(
      new Error("Database failure"),
    );

    const req = new Request("http://localhost/api/indexer/ai/graph");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Database failure" });
  });
});
