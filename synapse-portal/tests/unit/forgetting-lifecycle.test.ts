import { describe, it, expect, vi, beforeEach } from "vitest";
import { sleepCycleService } from "@/lib/services/sleep-cycle-service";
import { prisma } from "@/lib/db";
import { aiService } from "@/lib/services/ai-service";
import { vectorService } from "@/lib/services/vector-service";

// Mock the dependencies
vi.mock("@/lib/db", () => {
  const mockPrisma = {
    systemConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    node: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    tag: {
      findUnique: vi.fn(),
    },
    nodeTag: {
      create: vi.fn(),
    },
    archive: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  return { prisma: mockPrisma };
});

vi.mock("@/lib/services/ai-service", () => ({
  aiService: {
    synthesizeKnowledge: vi.fn(),
  },
}));

vi.mock("@/lib/services/vector-service", () => ({
  vectorService: {
    findSimilarToNode: vi.fn(),
  },
}));

vi.mock("@/lib/services/queue-service", () => ({
  queueService: {
    enqueueEmbeddingTask: vi.fn().mockResolvedValue({}),
  },
}));

describe("Forgetting Lifecycle Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Memory Decay Loop", () => {
    it("should decay a node to COLD tier if all its connections exceed virtual age 90 and score falls below 40", async () => {
      // Configure config mocks
      (
        vi.mocked(prisma.systemConfig.findUnique) as object as {
          mockImplementation: (
            fn: (params: object) => Promise<object | null>,
          ) => void;
        }
      ).mockImplementation((params: object) => {
        const uParams = params as object as { where: { key: string } };
        if (uParams.where.key === "forget_mode_enabled") {
          return Promise.resolve({
            key: "forget_mode_enabled",
            value: "true",
            updatedAt: new Date(),
          } as object as Awaited<
            ReturnType<typeof prisma.systemConfig.findUnique>
          >);
        }
        if (uParams.where.key === "forget_dry_run_enabled") {
          return Promise.resolve({
            key: "forget_dry_run_enabled",
            value: "false",
            updatedAt: new Date(),
          } as object as Awaited<
            ReturnType<typeof prisma.systemConfig.findUnique>
          >);
        }
        return Promise.resolve(null);
      });

      // Active node with decayed connection:
      // tag virtual_clock = 100, accessed_at_virtual_day = 5. Age = 95 (>90).
      // node success_count = 0.
      // score = (20 * 0 + 80 * exp(-0.05 * 95)) * 1.0 = 80 * 0.0086 = 0.69 (<40).
      const mockActiveNode = {
        id: "active-node-1",
        label: "Decayed Rule",
        success_count: 0,
        memory_tier: "ACTIVE",
        tags: [
          {
            tagId: "tag-1",
            accessed_at_virtual_day: 5,
            tag: {
              id: "tag-1",
              scope: "project",
              name: "synapse",
              virtual_clock: 100,
            },
          },
        ],
      };

      vi.mocked(prisma.node.findMany).mockResolvedValue([
        mockActiveNode,
      ] as object as Awaited<ReturnType<typeof prisma.node.findMany>>);

      const logs: string[] = [];
      await sleepCycleService.runDecayLoop(logs);

      // Verify node was updated to COLD memory tier
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: "active-node-1" },
        data: { memory_tier: "COLD" },
      });
      expect(
        logs.some((l) =>
          l.includes(
            '[SleepCycle] Decayed Node "Decayed Rule" (ID: active-node-1) to COLD tier',
          ),
        ),
      ).toBe(true);
    });

    it("should NOT decay a node if its score is kept high by QA Agent modifier (3.0x)", async () => {
      (
        vi.mocked(prisma.systemConfig.findUnique) as object as {
          mockImplementation: (
            fn: (params: object) => Promise<object | null>,
          ) => void;
        }
      ).mockImplementation((params: object) => {
        const uParams = params as object as { where: { key: string } };
        if (uParams.where.key === "forget_mode_enabled") {
          return Promise.resolve({
            key: "forget_mode_enabled",
            value: "true",
            updatedAt: new Date(),
          } as object as Awaited<
            ReturnType<typeof prisma.systemConfig.findUnique>
          >);
        }
        if (uParams.where.key === "forget_dry_run_enabled") {
          return Promise.resolve({
            key: "forget_dry_run_enabled",
            value: "false",
            updatedAt: new Date(),
          } as object as Awaited<
            ReturnType<typeof prisma.systemConfig.findUnique>
          >);
        }
        return Promise.resolve(null);
      });

      // QA Agent node:
      // tag virtual_clock = 100, accessed_at_virtual_day = 5. Age = 95 (>90).
      // node success_count = 4.
      // score = 80 * exp(-0.01667 * 95) * 3.0 = 49.28 (>40 due to QA Agent weight 3.0).
      const mockActiveNode = {
        id: "qa-node-1",
        label: "QA Protected Rule",
        success_count: 4,
        memory_tier: "ACTIVE",
        tags: [
          {
            tagId: "tag-qa",
            accessed_at_virtual_day: 5,
            tag: {
              id: "tag-qa",
              scope: "agent",
              name: "synapse-agent-qa",
              virtual_clock: 100,
            },
          },
        ],
      };

      vi.mocked(prisma.node.findMany).mockResolvedValue([
        mockActiveNode,
      ] as object as Awaited<ReturnType<typeof prisma.node.findMany>>);

      const logs: string[] = [];
      await sleepCycleService.runDecayLoop(logs);

      // Verify node was NOT updated
      expect(prisma.node.update).not.toHaveBeenCalled();
    });
  });

  describe("Knowledge Crystal Consolidation", () => {
    it("should consolidate highly similar COLD nodes into a single CORE crystal", async () => {
      const mockColdNodes = [
        {
          id: "cold-1",
          label: "Cold Rule 1",
          type: "LESSON",
          properties: JSON.stringify({
            content: "Avoid redundant state in React.",
          }),
          tags: [
            {
              tagId: "tag-react",
              tag: {
                id: "tag-react",
                scope: "technology",
                name: "react",
                virtual_clock: 10,
              },
            },
          ],
        },
        {
          id: "cold-2",
          label: "Cold Rule 2",
          type: "LESSON",
          properties: JSON.stringify({
            content: "Do not store computed values in React state.",
          }),
          tags: [
            {
              tagId: "tag-react",
              tag: {
                id: "tag-react",
                scope: "technology",
                name: "react",
                virtual_clock: 10,
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.node.findMany).mockResolvedValue(
        mockColdNodes as object as Awaited<
          ReturnType<typeof prisma.node.findMany>
        >,
      );
      vi.mocked(vectorService.findSimilarToNode).mockResolvedValue([
        { id: "cold-2", score: 0.88, label: "Cold Rule 2" },
      ] as object as Awaited<
        ReturnType<typeof vectorService.findSimilarToNode>
      >);
      vi.mocked(aiService.synthesizeKnowledge).mockResolvedValue({
        label: "React Computed Properties Best Practice",
        content: "Consolidated React guideline regarding redundant state.",
        reason: "Similarity consolidation",
      });

      vi.mocked(prisma.node.create).mockResolvedValue({
        id: "new-crystal-id",
        label: "🔮 Crystal: React Computed Properties Best Practice",
      } as object as Awaited<ReturnType<typeof prisma.node.create>>);

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: "tag-react",
        virtual_clock: 12,
      } as object as Awaited<ReturnType<typeof prisma.tag.findUnique>>);

      const logs: string[] = [];
      await sleepCycleService.consolidateColdNodes(logs);

      // Verify synthesis was called
      expect(aiService.synthesizeKnowledge).toHaveBeenCalled();

      // Verify transaction created the crystal node with tier = CORE
      expect(prisma.node.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            label: "🔮 Crystal: React Computed Properties Best Practice",
            memory_tier: "CORE",
            status: "PENDING_MERGE",
          }),
        }),
      );

      // Verify connection was created
      expect(prisma.nodeTag.create).toHaveBeenCalledWith({
        data: {
          nodeId: "new-crystal-id",
          tagId: "tag-react",
          accessed_at_virtual_day: 12,
        },
      });

      // Verify source nodes were archived
      expect(prisma.node.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["cold-1", "cold-2"] } },
        data: { status: "ARCHIVE", memory_tier: "ARCHIVE" },
      });
    });
  });
});
