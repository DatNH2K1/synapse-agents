import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/indexer/ai/details/route";
import { prisma } from "@/lib/db";

import { IndexerFile, IndexerDependency } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      indexerFile: {
        findFirst: vi.fn(),
      },
      indexerDependency: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("API Indexer AI Details Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if file parameter is missing", async () => {
    const req = new Request("http://localhost/api/indexer/ai/details");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Missing required query parameter: file" });
  });

  it("should return 404 if file is not found in database", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(null);

    const req = new Request(
      "http://localhost/api/indexer/ai/details?file=unknown.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "File not found: unknown.ts in repository synapse",
    });
  });

  it("should return details for file on success", async () => {
    const mockFile = {
      id: "uuid-1",
      hash: "hash-123",
      symbols: [{ name: "MyClass", kind: "class", range: "1:0" }],
    };
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(
      mockFile as unknown as IndexerFile,
    );

    vi.mocked(prisma.indexerDependency.findMany)
      .mockResolvedValueOnce([
        { dependencyFile: { path: "src/utils.ts" } },
      ] as unknown as IndexerDependency[])
      .mockResolvedValueOnce([
        { dependentFile: { path: "src/main.ts" } },
      ] as unknown as IndexerDependency[]);

    const req = new Request(
      "http://localhost/api/indexer/ai/details?file=src/index.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.symbols).toEqual([
      { name: "MyClass", kind: "class", range: "1:0" },
    ]);
    expect(data.dependencies).toEqual(["src/utils.ts"]);
    expect(data.dependents).toEqual(["src/main.ts"]);
  });

  it("should handle exceptions gracefully", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockRejectedValue(
      new Error("Database failure"),
    );

    const req = new Request(
      "http://localhost/api/indexer/ai/details?file=src/index.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Database failure" });
  });
});
