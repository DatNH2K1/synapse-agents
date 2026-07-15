import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/indexer/impact/route";
import { prisma } from "@/lib/db";
import { IndexerFile } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      indexerFile: {
        findFirst: vi.fn(),
      },
      $queryRaw: vi.fn(),
    },
  };
});

describe("API Indexer Impact Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if file parameter is missing", async () => {
    const req = new Request("http://localhost/api/indexer/impact");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Missing required query parameter: file" });
  });

  it("should return exists: false if file is not found in database", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(null);

    const req = new Request(
      "http://localhost/api/indexer/impact?file=unknown.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      file: "unknown.ts",
      exists: false,
      impactedFiles: [],
    });
    expect(prisma.indexerFile.findFirst).toHaveBeenCalledWith({
      where: {
        path: "unknown.ts",
        repo: {
          name: "synapse",
        },
      },
    });
  });

  it("should return impacted files with depths on success", async () => {
    const mockFileNode = { id: "uuid-123", path: "target.ts", repo: "synapse" };
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(
      mockFileNode as unknown as IndexerFile,
    );
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { path: "dependent-1.ts", depth: 1 },
      { path: "dependent-2.ts", depth: 2 },
    ] as unknown as { path: string; depth: number }[]);

    const req = new Request(
      "http://localhost/api/indexer/impact?file=target.ts&repo=synapse",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      file: "target.ts",
      exists: true,
      impactedFiles: [
        { path: "dependent-1.ts", depth: 1 },
        { path: "dependent-2.ts", depth: 2 },
      ],
    });
  });

  it("should return 500 error on query failure", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockRejectedValue(
      new Error("Query Failure"),
    );

    const req = new Request(
      "http://localhost/api/indexer/impact?file=error.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Query Failure" });
  });

  it("should default to repo synapse if repo param is missing", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(null);

    const req = new Request("http://localhost/api/indexer/impact?file=test.ts");
    await GET(req);

    expect(prisma.indexerFile.findFirst).toHaveBeenCalledWith({
      where: {
        path: "test.ts",
        repo: {
          name: "synapse",
        },
      },
    });
  });

  it("should handle non-Error exceptions gracefully", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockRejectedValue("String error");

    const req = new Request(
      "http://localhost/api/indexer/impact?file=error.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal Server Error" });
  });
});
