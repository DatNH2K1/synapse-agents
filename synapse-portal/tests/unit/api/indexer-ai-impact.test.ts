import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/indexer/ai/impact/route";
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

describe("API Indexer AI Impact Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if file parameter is missing", async () => {
    const req = new Request("http://localhost/api/indexer/ai/impact");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Missing required query parameter: file" });
  });

  it("should return 404 if file is not found in database", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(null);

    const req = new Request(
      "http://localhost/api/indexer/ai/impact?file=unknown.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "File not found: unknown.ts in repository synapse",
    });
  });

  it("should return blast radius partition on success", async () => {
    const mockFile = { id: "uuid-1" };
    vi.mocked(prisma.indexerFile.findFirst).mockResolvedValue(
      mockFile as unknown as IndexerFile,
    );
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { path: "src/app.ts", depth: 1 },
      { path: "src/main.ts", depth: 2 },
    ]);

    const req = new Request(
      "http://localhost/api/indexer/ai/impact?file=src/index.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.directlyAffected).toEqual(["src/app.ts"]);
    expect(data.indirectlyAffected).toEqual([
      { path: "src/main.ts", depth: 2 },
    ]);
  });

  it("should handle exceptions gracefully", async () => {
    vi.mocked(prisma.indexerFile.findFirst).mockRejectedValue(
      new Error("Database failure"),
    );

    const req = new Request(
      "http://localhost/api/indexer/ai/impact?file=src/index.ts",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Database failure" });
  });
});
