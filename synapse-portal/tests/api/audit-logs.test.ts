import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getAuditLogs } from "@/app/api/audit-logs/route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    node: {
      findMany: vi.fn(),
    },
    archive: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/audit-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully fetch, decorate and sort audit logs", async () => {
    const mockNodes = [
      {
        id: "node-1",
        label: "Node 1",
        type: "LESSON",
        properties: "{}",
        status: "APPROVED",
        memory_tier: "LONG_TERM",
        last_verified: new Date("2026-06-01T12:00:00Z"),
        success_count: 5,
        tags: [{ tag: "tag-1" }],
      },
      {
        id: "node-2",
        label: "Node 2",
        type: "INSIGHT",
        properties: "{}",
        status: "ARCHIVE",
        memory_tier: "SHORT_TERM",
        last_verified: new Date("2026-06-02T12:00:00Z"),
        success_count: 2,
        tags: [],
      },
    ];

    const mockArchives = [
      {
        id: "archive-1",
        fromNodeId: "node-2",
        toNodeId: "node-1",
        reason: "Similarity consolidation",
        similarityScore: 0.92,
        mergedAt: new Date("2026-06-02T12:05:00Z"),
      },
    ];

    vi.mocked(prisma.node.findMany).mockResolvedValue(
      mockNodes as object as Awaited<ReturnType<typeof prisma.node.findMany>>,
    );
    vi.mocked(prisma.archive.findMany).mockResolvedValue(
      mockArchives as object as Awaited<
        ReturnType<typeof prisma.archive.findMany>
      >,
    );

    const response = await getAuditLogs();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(2);

    // Sorted by last_verified descending, so node-2 (June 2) should be first, then node-1 (June 1)
    expect(data.logs[0].id).toBe("node-2");
    expect(data.logs[0].archiveDetail).toEqual({
      toNodeId: "node-1",
      reason: "Similarity consolidation",
      similarityScore: 0.92,
      mergedAt: "2026-06-02T12:05:00.000Z",
    });

    expect(data.logs[1].id).toBe("node-1");
    expect(data.logs[1].archiveDetail).toBeNull();
  });

  it("should return 500 when database query throws an error", async () => {
    vi.mocked(prisma.node.findMany).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await getAuditLogs();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal Server Error");
  });
});
