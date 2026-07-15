import { describe, it, expect, vi, beforeEach } from "vitest";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { prisma } from "@/lib/db";

// Mock the prisma client
vi.mock("@/lib/db", () => {
  return {
    prisma: {
      node: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      nodeTag: {
        update: vi.fn(),
      },
    },
  };
});

describe("Efficacy Tracker Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC1: Should call prisma.node.update with increment data when incrementSuccessCount is called and escalate to GOLD", async () => {
    const mockNodeId = "mock-uuid-12345";
    const mockUpdatedNode = {
      id: mockNodeId,
      type: "LESSON",
      label: "Test Lesson",
      content_hash: null,
      success_count: 5,
      last_verified: new Date(),
      properties: null,
      status: "GOLD",
      memory_tier: "ACTIVE",
      embeddingModel: null,
      tags: [],
    };

    // Configure the mock resolver
    vi.mocked(prisma.node.findUnique).mockResolvedValue({
      id: mockNodeId,
      type: "LESSON",
      label: "Test Lesson",
      content_hash: null,
      success_count: 4,
      last_verified: new Date(),
      properties: null,
      status: "BETA",
      memory_tier: "ACTIVE",
      embeddingModel: null,
      tags: [],
    } as object as Awaited<ReturnType<typeof prisma.node.findUnique>>);

    vi.mocked(prisma.node.update).mockResolvedValue(
      mockUpdatedNode as object as Awaited<
        ReturnType<typeof prisma.node.update>
      >,
    );

    const result = await knowledgeService.incrementSuccessCount(mockNodeId);

    // Assert prisma update was called with correct parameters (escalating to GOLD)
    expect(prisma.node.update).toHaveBeenCalledWith({
      where: { id: mockNodeId },
      data: {
        success_count: 5,
        last_verified: expect.any(Date),
        status: "GOLD",
        memory_tier: "ACTIVE",
      },
    });

    // Assert returned node matches mock result
    expect(result).toEqual(mockUpdatedNode);
  });

  it("TC2: Should bubble up database errors if prisma update fails", async () => {
    const mockNodeId = "non-existent-id";
    vi.mocked(prisma.node.findUnique).mockResolvedValue({
      id: mockNodeId,
      type: "LESSON",
      label: "Test Lesson",
      content_hash: null,
      success_count: 0,
      last_verified: new Date(),
      properties: null,
      status: "PENDING",
      memory_tier: "ACTIVE",
      embeddingModel: null,
      tags: [],
    } as object as Awaited<ReturnType<typeof prisma.node.findUnique>>);

    vi.mocked(prisma.node.update).mockRejectedValue(
      new Error("Record to update not found."),
    );

    await expect(
      knowledgeService.incrementSuccessCount(mockNodeId),
    ).rejects.toThrow("Record to update not found.");
  });

  it("TC3: Should resurrect COLD node back to ACTIVE and reset connection clocks", async () => {
    const mockNodeId = "cold-node-uuid";
    const mockNode = {
      id: mockNodeId,
      type: "LESSON",
      label: "Cold Lesson",
      content_hash: null,
      success_count: 1,
      last_verified: new Date(),
      properties: null,
      status: "APPROVED",
      memory_tier: "COLD",
      embeddingModel: null,
      tags: [
        {
          nodeId: mockNodeId,
          tagId: "tag-1",
          accessed_at_virtual_day: 5,
          last_accessed_at: new Date(),
          tag: {
            id: "tag-1",
            scope: "project",
            name: "synapse",
            virtual_clock: 42,
          },
        },
      ],
    };

    vi.mocked(prisma.node.findUnique).mockResolvedValue(
      mockNode as object as Awaited<ReturnType<typeof prisma.node.findUnique>>,
    );
    vi.mocked(prisma.nodeTag.update).mockResolvedValue(
      {} as object as Awaited<ReturnType<typeof prisma.nodeTag.update>>,
    );
    vi.mocked(prisma.node.update).mockResolvedValue({
      ...mockNode,
      memory_tier: "ACTIVE",
      success_count: 2,
    } as object as Awaited<ReturnType<typeof prisma.node.update>>);

    const result = await knowledgeService.incrementSuccessCount(mockNodeId);

    // Verify connections were updated to the latest tag clock (42)
    expect(prisma.nodeTag.update).toHaveBeenCalledWith({
      where: {
        nodeId_tagId: {
          nodeId: mockNodeId,
          tagId: "tag-1",
        },
      },
      data: {
        accessed_at_virtual_day: 42,
        last_accessed_at: expect.any(Date),
      },
    });

    // Verify node itself was updated to ACTIVE
    expect(prisma.node.update).toHaveBeenCalledWith({
      where: { id: mockNodeId },
      data: {
        success_count: 2,
        last_verified: expect.any(Date),
        status: "APPROVED",
        memory_tier: "ACTIVE",
      },
    });

    expect(result.memory_tier).toBe("ACTIVE");
    expect(result.success_count).toBe(2);
  });
});
