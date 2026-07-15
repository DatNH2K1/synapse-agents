import { describe, it, expect, vi, beforeEach } from "vitest";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { prisma } from "@/lib/db";
import { queueService } from "@/lib/services/queue-service";

// Mock prisma client
vi.mock("@/lib/db", () => {
  const mockPrisma = {
    node: {
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    tag: {
      findUnique: vi.fn(),
    },
    nodeTag: {
      create: vi.fn(),
    },
    archive: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock queueService
vi.mock("@/lib/services/queue-service", () => ({
  queueService: {
    enqueueEmbeddingTask: vi.fn().mockResolvedValue({}),
  },
}));

describe("Evolution History & Timeline Undo Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rejectPendingUpdate", () => {
    it("TC1: Should set status to REJECTED and set embedding to NULL", async () => {
      const mockId = "mock-rejected-id";
      vi.mocked(prisma.node.update).mockResolvedValue({
        id: mockId,
        status: "REJECTED",
      } as object as Awaited<ReturnType<typeof prisma.node.create>>);

      await knowledgeService.rejectPendingUpdate(mockId);

      // Verify raw SQL execution to nullify embedding
      expect(prisma.$executeRaw).toHaveBeenCalled();
      // Verify node update was called
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: mockId },
        data: {
          status: "REJECTED",
          memory_tier: "ARCHIVE",
          last_verified: expect.any(Date),
        },
      });
    });
  });

  describe("mergeNodes", () => {
    it("TC2: Should create synthetic target node, archive source nodes, nullify source embeddings, and queue target vector creation", async () => {
      const mockParams = {
        sourceNodeIds: ["source-1", "source-2"],
        newLabel: "Merged Topic",
        newType: "LESSON",
        newContent: "This is the merged result",
        selectedTagIds: ["tag-1"],
        reason: "Consolidation",
        similarityScore: 0.92,
      };

      vi.mocked(prisma.node.create).mockResolvedValue({
        id: "merged-target-id",
        label: "Merged Topic",
      } as object as Awaited<ReturnType<typeof prisma.node.create>>);

      await knowledgeService.mergeNodes(mockParams);

      // Verify target node creation
      expect(prisma.node.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            label: "Merged Topic",
            status: "APPROVED",
          }),
        }),
      );

      // Verify archiving source nodes
      expect(prisma.node.updateMany).toHaveBeenCalledWith({
        where: { id: { in: mockParams.sourceNodeIds } },
        data: {
          status: "ARCHIVE",
          memory_tier: "ARCHIVE",
          last_verified: expect.any(Date),
        },
      });

      // Verify source node vector nullification
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);

      // Verify archive record created for each source node
      expect(prisma.archive.create).toHaveBeenCalledTimes(2);

      // Verify target embedding task queued
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
        "merged-target-id",
        "Merged Topic",
      );
    });
  });

  describe("undoAction - REJECTED", () => {
    it("TC3: Should restore rejected node to PENDING and re-enqueue vector generation", async () => {
      const mockId = "rejected-node-id";
      vi.mocked(prisma.node.update).mockResolvedValue({
        id: mockId,
        label: "Rejected Lesson",
      } as object as Awaited<ReturnType<typeof prisma.node.update>>);

      const result = await knowledgeService.undoAction(mockId, "REJECTED");

      expect(result).toEqual({ success: true });
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: mockId },
        data: { status: "PENDING", last_verified: expect.any(Date) },
        select: { id: true, label: true },
      });
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
        mockId,
        "Rejected Lesson",
      );
    });
  });

  describe("undoAction - ARCHIVE (Merged Nodes)", () => {
    it("TC4: Should restore source nodes to APPROVED, queue their vector generation, delete target node and delete archive joins", async () => {
      const mockSourceId = "source-1";
      const mockTargetId = "merged-target-id";

      // Mock find first archive record
      vi.mocked(prisma.archive.findFirst).mockResolvedValue({
        id: "archive-id-1",
        fromNodeId: mockSourceId,
        toNodeId: mockTargetId,
      } as object as Awaited<ReturnType<typeof prisma.archive.findFirst>>);

      // Mock all sibling archives
      vi.mocked(prisma.archive.findMany).mockResolvedValue([
        { id: "archive-id-1", fromNodeId: "source-1", toNodeId: mockTargetId },
        { id: "archive-id-2", fromNodeId: "source-2", toNodeId: mockTargetId },
      ] as object as Awaited<ReturnType<typeof prisma.archive.findMany>>);

      // Mock restored nodes labels
      vi.mocked(prisma.node.findMany).mockResolvedValue([
        { id: "source-1", label: "Source Lesson 1" },
        { id: "source-2", label: "Source Lesson 2" },
      ] as object as Awaited<ReturnType<typeof prisma.node.findMany>>);

      const result = await knowledgeService.undoAction(mockSourceId, "ARCHIVE");

      expect(result).toEqual({ success: true });

      // Verify source nodes status reverted to APPROVED and ACTIVE
      expect(prisma.node.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["source-1", "source-2"] } },
        data: {
          status: "APPROVED",
          memory_tier: "ACTIVE",
          last_verified: expect.any(Date),
        },
      });

      // Verify embeddings re-queued for both restored source nodes
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledTimes(2);
      expect(queueService.enqueueEmbeddingTask).toHaveBeenNthCalledWith(
        1,
        "source-1",
        "Source Lesson 1",
      );
      expect(queueService.enqueueEmbeddingTask).toHaveBeenNthCalledWith(
        2,
        "source-2",
        "Source Lesson 2",
      );

      // Verify target node deleted
      expect(prisma.node.delete).toHaveBeenCalledWith({
        where: { id: mockTargetId },
      });

      // Verify archive logs cleaned up
      expect(prisma.archive.deleteMany).toHaveBeenCalledWith({
        where: { toNodeId: mockTargetId },
      });
    });

    it("TC5: Should return failure if archive merge history is missing", async () => {
      vi.mocked(prisma.archive.findFirst).mockResolvedValue(null);

      const result = await knowledgeService.undoAction("missing-id", "ARCHIVE");

      expect(result).toEqual({
        success: false,
        message: "Merge history not found.",
      });
    });
  });
});
