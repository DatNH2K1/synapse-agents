import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/indexer/repos/route";
import { prisma } from "@/lib/db";
import { IndexerRepo } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      indexerRepo: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("API Indexer Repos Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return list of repos on success", async () => {
    const lastSyncedAt = new Date();
    vi.mocked(prisma.indexerRepo.findMany).mockResolvedValue([
      { id: "1", name: "repo-1", lastSyncedAt },
      { id: "2", name: "repo-2", lastSyncedAt },
    ] as IndexerRepo[]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      repos: [
        { name: "repo-1", lastSyncedAt: lastSyncedAt.toISOString() },
        { name: "repo-2", lastSyncedAt: lastSyncedAt.toISOString() },
      ],
    });
    expect(prisma.indexerRepo.findMany).toHaveBeenCalledWith({
      orderBy: { lastSyncedAt: "desc" },
    });
  });

  it("should return 500 error on database failure", async () => {
    vi.mocked(prisma.indexerRepo.findMany).mockRejectedValue(
      new Error("DB Error"),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "DB Error" });
  });

  it("should handle non-Error exceptions gracefully", async () => {
    vi.mocked(prisma.indexerRepo.findMany).mockRejectedValue("String DB Error");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal Server Error" });
  });
});
