import { describe, it, expect, vi, beforeEach } from "vitest";
import { sleepCycleService } from "@/lib/services/sleep-cycle-service";
import { prisma } from "@/lib/db";
import { vectorService } from "@/lib/services/vector-service";
import { aiService } from "@/lib/services/ai-service";
import { Node, Tag, SystemConfig, Archive } from "@prisma/client";

interface MockMethod<TReturn> {
  mockResolvedValue: (value: TReturn) => MockMethod<TReturn>;
  mockResolvedValueOnce: (value: TReturn) => MockMethod<TReturn>;
  mockRejectedValue: (error: Error) => MockMethod<TReturn>;
  mockRejectedValueOnce: (error: Error) => MockMethod<TReturn>;
  mockImplementation: (
    fn: (...args: object[]) => TReturn | Promise<TReturn>,
  ) => MockMethod<TReturn>;
  mockImplementationOnce: (
    fn: (...args: object[]) => TReturn | Promise<TReturn>,
  ) => MockMethod<TReturn>;
}

function asMock<TReturn>(func: object): MockMethod<TReturn> {
  return func as object as MockMethod<TReturn>;
}

const createMockNode = (overrides: Partial<Node> = {}): Node => ({
  id: "mock-node-id",
  type: "LESSON",
  label: "Mock Label",
  content_hash: null,
  success_count: 0,
  last_verified: new Date(),
  properties: "{}",
  status: "APPROVED",
  memory_tier: "ACTIVE",
  embeddingModel: null,
  ...overrides,
});

const createMockTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: "mock-tag-id",
  scope: "project",
  name: "mock-tag",
  version: null,
  color: "#818cf8",
  virtual_clock: 0,
  ...overrides,
});

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    systemConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue({
        key: "rem_last_run_time",
        value: new Date().toISOString(),
        updatedAt: new Date(),
      }),
    },
    node: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn(),
    },
    nodeTag: {
      create: vi.fn(),
    },
    tag: {
      findUnique: vi.fn(),
    },
    archive: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: object) => Promise<object>) =>
      cb(mockPrisma),
    ),
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  return { prisma: mockPrisma };
});

vi.mock("@/lib/services/vector-service", () => {
  return {
    vectorService: {
      findSimilarToNode: vi.fn(),
    },
  };
});

vi.mock("@/lib/services/ai-service", () => {
  return {
    aiService: {
      synthesizeKnowledge: vi.fn(),
    },
  };
});

vi.mock("@/lib/services/queue-service", () => {
  return {
    queueService: {
      enqueueEmbeddingTask: vi.fn().mockResolvedValue({}),
    },
  };
});

describe("REM Sleep Cycle Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC1: Should skip execution if rem_mode_enabled is disabled", async () => {
    asMock<SystemConfig | null>(
      prisma.systemConfig.findUnique,
    ).mockResolvedValue(null);

    const result = await sleepCycleService.run();

    expect(result.processedCount).toBe(0);
    expect(result.logs[1]).toContain("REM Sleep Mode is disabled");
  });

  it("TC2: Should complete without processing if there are no pending nodes", async () => {
    asMock<SystemConfig | null>(
      prisma.systemConfig.findUnique,
    ).mockImplementation((args: object) => {
      const uArgs = args as { where: { key: string } };
      if (uArgs.where.key === "rem_mode_enabled") {
        return Promise.resolve({
          key: "rem_mode_enabled",
          value: "true",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      return Promise.resolve(null);
    });
    asMock<Node[]>(prisma.node.findMany).mockResolvedValue([]);

    const result = await sleepCycleService.run();

    expect(result.processedCount).toBe(0);
    expect(result.logs[2]).toContain("No pending nodes found in The Gate");
  });

  it("TC3: Should auto-approve a unique proposal (similarity < threshold)", async () => {
    asMock<SystemConfig | null>(
      prisma.systemConfig.findUnique,
    ).mockImplementation((args: object) => {
      const uArgs = args as { where: { key: string } };
      if (uArgs.where.key === "rem_mode_enabled") {
        return Promise.resolve({
          key: "rem_mode_enabled",
          value: "true",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      if (uArgs.where.key === "rem_similarity_threshold") {
        return Promise.resolve({
          key: "rem_similarity_threshold",
          value: "0.85",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      return Promise.resolve(null);
    });

    const mockPendingNode = {
      id: "pending-uuid-1",
      type: "CONTEXT",
      label: "Completely New Idea",
      content_hash: null,
      success_count: 0,
      last_verified: new Date(),
      properties: JSON.stringify({ content: "Unique content details" }),
      status: "PENDING",
      memory_tier: "ACTIVE",
      embeddingModel: null,
      tags: [],
    } as Node;

    asMock<Node[]>(prisma.node.findMany).mockResolvedValue([mockPendingNode]);
    interface MatchResult {
      id: string;
      label: string;
      score: number;
    }
    asMock<MatchResult[]>(vectorService.findSimilarToNode).mockResolvedValue(
      [],
    );
    asMock<Node>(prisma.node.update).mockResolvedValue({
      ...mockPendingNode,
      status: "BETA",
    } as Node);

    const result = await sleepCycleService.run();

    expect(result.processedCount).toBe(1);
    expect(result.autoApprovedCount).toBe(1);
    expect(result.autoMergedCount).toBe(0);
    expect(prisma.node.update).toHaveBeenCalledWith({
      where: { id: "pending-uuid-1" },
      data: {
        status: "BETA",
        last_verified: expect.any(Date),
        properties: expect.any(String),
      },
    });
  });

  it("TC4: Should auto-consolidate (merge) when similarity >= threshold", async () => {
    asMock<SystemConfig | null>(
      prisma.systemConfig.findUnique,
    ).mockImplementation((args: object) => {
      const uArgs = args as { where: { key: string } };
      if (uArgs.where.key === "rem_mode_enabled") {
        return Promise.resolve({
          key: "rem_mode_enabled",
          value: "true",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      if (uArgs.where.key === "rem_similarity_threshold") {
        return Promise.resolve({
          key: "rem_similarity_threshold",
          value: "0.85",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      if (uArgs.where.key === "rem_confidence_threshold") {
        return Promise.resolve({
          key: "rem_confidence_threshold",
          value: "0.90",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      return Promise.resolve(null);
    });

    asMock<Node | null>(prisma.node.findUnique).mockImplementation(
      (args: object) => {
        const uArgs = args as { where: { id: string } };
        if (uArgs.where.id === "active-uuid-1") {
          return Promise.resolve({
            id: "active-uuid-1",
            type: "LESSON",
            label: "Existing SQL Query Optimize",
            content_hash: null,
            success_count: 0,
            last_verified: new Date(),
            properties: JSON.stringify({ content: "Indexing speedups" }),
            status: "APPROVED",
            memory_tier: "ACTIVE",
            embeddingModel: null,
            tags: [],
          } as Node);
        }
        return Promise.resolve(null);
      },
    );

    const mockPendingNode = {
      id: "pending-uuid-2",
      type: "LESSON",
      label: "Optimize DB Queries",
      content_hash: null,
      success_count: 0,
      last_verified: new Date(),
      properties: JSON.stringify({ content: "SQL indexing speedup" }),
      status: "PENDING",
      memory_tier: "ACTIVE",
      embeddingModel: null,
      tags: [],
    } as Node;

    asMock<Node[]>(prisma.node.findMany).mockResolvedValue([mockPendingNode]);

    interface MatchResult {
      id: string;
      label: string;
      score: number;
    }
    asMock<MatchResult[]>(vectorService.findSimilarToNode).mockResolvedValue([
      {
        id: "active-uuid-1",
        label: "Existing SQL Query Optimize",
        score: 0.92,
      },
    ]);

    interface SynthesisResult {
      label: string;
      content: string;
      reason: string;
    }
    asMock<SynthesisResult>(aiService.synthesizeKnowledge).mockResolvedValue({
      label: "Synthesized DB Query Indexing",
      content: "Consolidated index details",
      reason: "Identical optimization topics merged.",
    });

    // Mock the transaction helper
    asMock<Node>(prisma.$transaction).mockImplementation((fn: object) => {
      const tx = {
        node: {
          create: vi.fn().mockResolvedValue({
            id: "merged-uuid-99",
            label: "Synthesized DB Query Indexing",
          } as Node),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        tag: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        nodeTag: {
          create: vi.fn(),
        },
        archive: {
          create: vi.fn(),
        },
        $executeRaw: vi.fn(),
      };
      return (fn as (tx: object) => Promise<Node>)(tx);
    });

    const result = await sleepCycleService.run();

    expect(result.processedCount).toBe(1);
    expect(result.autoApprovedCount).toBe(0);
    expect(result.autoMergedCount).toBe(1);
    expect(aiService.synthesizeKnowledge).toHaveBeenCalled();
  });

  it("TC5: Should skip execution if REM sleep cycle is already running (concurrency lock)", async () => {
    asMock<SystemConfig | null>(
      prisma.systemConfig.findUnique,
    ).mockImplementation((args: object) => {
      const uArgs = args as { where: { key: string } };
      if (uArgs.where.key === "rem_running") {
        return Promise.resolve({
          key: "rem_running",
          value: "true",
          updatedAt: new Date(),
        } as SystemConfig);
      }
      return Promise.resolve(null);
    });

    const result = await sleepCycleService.run();

    expect(result.processedCount).toBe(0);
    expect(result.logs[1]).toContain(
      "REM Sleep Cycle is already running. Skipping execution.",
    );
  });

  describe("runDecayLoop", () => {
    it("should return early if forget_mode is disabled", async () => {
      asMock<SystemConfig | null>(
        prisma.systemConfig.findUnique,
      ).mockResolvedValue(null);
      const logs: string[] = [];
      await sleepCycleService.runDecayLoop(logs);
      expect(logs[1]).toContain("Forget Mode is disabled");
    });

    it("should run decay check and log dry run nodes", async () => {
      asMock<SystemConfig | null>(
        prisma.systemConfig.findUnique,
      ).mockImplementation((args: object) => {
        const uArgs = args as { where: { key: string } };
        if (uArgs.where.key === "forget_mode_enabled") {
          return Promise.resolve({
            key: "forget_mode_enabled",
            value: "true",
          } as SystemConfig);
        }
        if (uArgs.where.key === "forget_dry_run_enabled") {
          return Promise.resolve({
            key: "forget_dry_run_enabled",
            value: "true",
          } as SystemConfig);
        }
        return Promise.resolve(null);
      });

      interface TagWithClock {
        id: string;
        scope: string;
        name: string;
        version: string | null;
        color: string;
        virtual_clock: number;
      }
      interface NodeTagWithRelation {
        nodeId: string;
        tagId: string;
        accessed_at_virtual_day: number;
        last_accessed_at: Date;
        tag: TagWithClock;
      }
      interface ActiveNodeWithTagsRelation {
        id: string;
        type: string;
        label: string;
        content_hash: string | null;
        success_count: number;
        last_verified: Date;
        properties: string | null;
        status: string;
        memory_tier: string;
        embeddingModel: string | null;
        tags: NodeTagWithRelation[];
      }

      const mockActiveNodes: ActiveNodeWithTagsRelation[] = [
        {
          id: "n-decay-1",
          type: "LESSON",
          label: "Decaying Node",
          content_hash: null,
          success_count: 0,
          last_verified: new Date(),
          properties: "{}",
          status: "APPROVED",
          memory_tier: "ACTIVE",
          embeddingModel: null,
          tags: [
            {
              nodeId: "n-decay-1",
              tagId: "t1",
              accessed_at_virtual_day: 10,
              last_accessed_at: new Date(),
              tag: {
                id: "t1",
                scope: "project",
                name: "p1",
                version: null,
                color: "blue",
                virtual_clock: 110, // virtualAge = 100 > 90, score will decay < 40
              },
            },
          ],
        },
      ];

      asMock<ActiveNodeWithTagsRelation[]>(
        prisma.node.findMany,
      ).mockResolvedValue(mockActiveNodes);

      const logs: string[] = [];
      await sleepCycleService.runDecayLoop(logs);
      expect(
        logs.some((log) => log.includes("WOULD be decayed to COLD tier")),
      ).toBe(true);
    });

    it("should decay nodes and set tier to COLD if dry run is false", async () => {
      asMock<SystemConfig | null>(
        prisma.systemConfig.findUnique,
      ).mockImplementation((args: object) => {
        const uArgs = args as { where: { key: string } };
        if (uArgs.where.key === "forget_mode_enabled") {
          return Promise.resolve({
            key: "forget_mode_enabled",
            value: "true",
          } as SystemConfig);
        }
        if (uArgs.where.key === "forget_dry_run_enabled") {
          return Promise.resolve({
            key: "forget_dry_run_enabled",
            value: "false",
          } as SystemConfig);
        }
        return Promise.resolve(null);
      });

      interface TagWithClock {
        id: string;
        scope: string;
        name: string;
        version: string | null;
        color: string;
        virtual_clock: number;
      }
      interface NodeTagWithRelation {
        nodeId: string;
        tagId: string;
        accessed_at_virtual_day: number;
        last_accessed_at: Date;
        tag: TagWithClock;
      }
      interface ActiveNodeWithTagsRelation {
        id: string;
        type: string;
        label: string;
        content_hash: string | null;
        success_count: number;
        last_verified: Date;
        properties: string | null;
        status: string;
        memory_tier: string;
        embeddingModel: string | null;
        tags: NodeTagWithRelation[];
      }

      const mockActiveNodes: ActiveNodeWithTagsRelation[] = [
        {
          id: "n-decay-2",
          type: "LESSON",
          label: "Decaying Node 2",
          content_hash: null,
          success_count: 0,
          last_verified: new Date(),
          properties: "{}",
          status: "APPROVED",
          memory_tier: "ACTIVE",
          embeddingModel: null,
          tags: [
            {
              nodeId: "n-decay-2",
              tagId: "t1",
              accessed_at_virtual_day: 10,
              last_accessed_at: new Date(),
              tag: {
                id: "t1",
                scope: "agent",
                name: "synapse-agent-qa",
                version: null,
                color: "blue",
                virtual_clock: 250, // virtualAge = 240, even with M_agent=3.0, score will be < 40
              },
            },
          ],
        },
      ];

      asMock<ActiveNodeWithTagsRelation[]>(
        prisma.node.findMany,
      ).mockResolvedValue(mockActiveNodes);
      asMock<Node>(prisma.node.update).mockResolvedValue({} as Node);

      const logs: string[] = [];
      await sleepCycleService.runDecayLoop(logs);
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: "n-decay-2" },
        data: { memory_tier: "COLD" },
      });
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });
  });

  describe("consolidateColdNodes", () => {
    it("should return early if less than 2 COLD nodes", async () => {
      asMock<Node[]>(prisma.node.findMany).mockResolvedValue([]);
      const logs: string[] = [];
      await sleepCycleService.consolidateColdNodes(logs);
      expect(
        logs.some((log) => log.includes("Less than 2 COLD nodes found")),
      ).toBe(true);
    });

    it("should cluster and propose consolidation of COLD nodes", async () => {
      interface ColdNodeWithTagsRelation {
        id: string;
        type: string;
        label: string;
        content_hash: string | null;
        success_count: number;
        last_verified: Date;
        properties: string | null;
        status: string;
        memory_tier: string;
        embeddingModel: string | null;
        tags: { tagId: string; tag: Tag }[];
      }
      const mockColdNodes: ColdNodeWithTagsRelation[] = [
        {
          id: "cold-1",
          type: "LESSON",
          label: "Cold Node A",
          content_hash: null,
          success_count: 0,
          last_verified: new Date(),
          properties: JSON.stringify({ content: "A content" }),
          status: "APPROVED",
          memory_tier: "COLD",
          embeddingModel: null,
          tags: [
            {
              tagId: "t-tech",
              tag: createMockTag({ scope: "technology", name: "js" }),
            },
          ],
        },
        {
          id: "cold-2",
          type: "LESSON",
          label: "Cold Node B",
          content_hash: null,
          success_count: 0,
          last_verified: new Date(),
          properties: JSON.stringify({ content: "B content" }),
          status: "APPROVED",
          memory_tier: "COLD",
          embeddingModel: null,
          tags: [
            {
              tagId: "t-tech",
              tag: createMockTag({ scope: "technology", name: "js" }),
            },
          ],
        },
        {
          id: "cold-3",
          type: "LESSON",
          label: "Cold Node C",
          content_hash: null,
          success_count: 0,
          last_verified: new Date(),
          properties: JSON.stringify({ content: "C content" }),
          status: "APPROVED",
          memory_tier: "COLD",
          embeddingModel: null,
          tags: [], // No project or technology tag -> falls back to general:general
        },
        {
          id: "cold-4",
          type: "LESSON",
          label: "Cold Node D",
          content_hash: null,
          success_count: 0,
          last_verified: new Date(),
          properties: JSON.stringify({ content: "D content" }),
          status: "APPROVED",
          memory_tier: "COLD",
          embeddingModel: null,
          tags: [], // general:general cluster matching
        },
      ];

      asMock<ColdNodeWithTagsRelation[]>(
        prisma.node.findMany,
      ).mockResolvedValue(mockColdNodes);
      interface MatchResult {
        id: string;
        label: string;
        score: number;
      }
      asMock<MatchResult[]>(vectorService.findSimilarToNode)
        .mockResolvedValueOnce([
          { id: "cold-2", label: "Cold Node B", score: 0.9 },
        ]) // JS cluster
        .mockResolvedValueOnce([
          { id: "cold-4", label: "Cold Node D", score: 0.9 },
        ]); // general:general cluster

      asMock<object>(aiService.synthesizeKnowledge)
        .mockResolvedValueOnce({
          label: "Unified JS Cold Node",
          content: "Consolidated JS cold contents",
          reason: "JS consolidation",
        })
        .mockRejectedValueOnce(
          new Error("Synthesis failed on general cluster"),
        ); // triggers synthesis catch block

      asMock<Node>(prisma.$transaction).mockImplementation((fn: object) => {
        const tx = {
          node: {
            create: vi.fn().mockResolvedValue(
              createMockNode({
                id: "crystal-id",
                label: "Unified Cold Node",
              }),
            ),
            updateMany: vi.fn(),
          },
          tag: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
          nodeTag: {
            create: vi.fn(),
          },
        };
        return (fn as (tx: object) => Promise<Node>)(tx);
      });

      const logs: string[] = [];
      await sleepCycleService.consolidateColdNodes(logs);
      expect(
        logs.some((log) =>
          log.includes("Successfully proposed consolidation of 2 COLD nodes"),
        ),
      ).toBe(true);
      expect(
        logs.some((log) =>
          log.includes('Failed to consolidate cluster "general:general"'),
        ),
      ).toBe(true);
    });
  });

  describe("runGarbageCollection", () => {
    it("should purge expired archives and rejected nodes", async () => {
      asMock<Archive[]>(prisma.archive.findMany).mockResolvedValue([
        {
          id: "arch-1",
          fromNodeId: "expired-node-id",
          toNodeId: "to-node-id",
          reason: "merged",
          similarityScore: 0.9,
          mergedAt: new Date(),
        },
      ]);
      asMock<{ count: number }>(prisma.node.deleteMany)
        .mockResolvedValueOnce({ count: 1 }) // expired archive nodes
        .mockResolvedValueOnce({ count: 2 }); // rejected nodes

      const logs: string[] = [];
      await sleepCycleService.runGarbageCollection(logs);

      expect(prisma.node.deleteMany).toHaveBeenCalled();
      expect(prisma.archive.deleteMany).toHaveBeenCalled();
      expect(
        logs.some((log) =>
          log.includes("GC successfully purged 1 expired archive nodes"),
        ),
      ).toBe(true);
      expect(
        logs.some((log) =>
          log.includes("GC successfully purged 2 rejected nodes"),
        ),
      ).toBe(true);
    });

    it("should log error if GC fails", async () => {
      asMock<Archive[]>(prisma.archive.findMany).mockRejectedValue(
        new Error("DB connection timeout"),
      );
      const logs: string[] = [];
      await sleepCycleService.runGarbageCollection(logs);
      expect(
        logs.some((log) => log.includes("Garbage Collection failed")),
      ).toBe(true);
    });
  });
});
