import { describe, it, expect, vi, beforeEach } from "vitest";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { prisma } from "@/lib/db";
import { vectorService } from "@/lib/services/vector-service";
import { queueService } from "@/lib/services/queue-service";
import { Node, Tag, Archive } from "@prisma/client";

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

interface NodeWithTagsQueryRow {
  id: string;
  type: string;
  label: string;
  properties: string | null;
  status: string;
  last_verified: Date;
  success_count: number;
  embeddingModel: string | null;
  tags: { tag: Tag }[];
}

interface NodeWithTagsAndColorRow {
  id: string;
  type: string;
  label: string;
  properties: string | null;
  status: string;
  memory_tier: string;
  last_verified: Date;
  success_count: number;
  embeddingModel: string | null;
  tags: { tag: Tag }[];
}

interface NodeWithTagsByContextRow {
  id: string;
  label: string;
  type: string;
  properties: string | null;
  status: string;
  memory_tier: string;
  last_verified: Date;
  success_count: number;
  tags: {
    tagId: string;
    accessed_at_virtual_day: number;
    last_accessed_at: Date;
    tag: Tag;
  }[];
}

interface NodeCountGroupByRow {
  status: string;
  _count: {
    id: number;
  };
}

interface RelatedNodeQueryRow {
  id: string;
  label: string;
  type: string;
  properties: string | null;
  status: string;
  last_verified: Date;
  overlap_count: bigint;
}

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    node: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    nodeTag: {
      createMany: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    archive: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: object) => Promise<object>) =>
      cb(mockPrisma),
    ),
    $executeRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  };
  return { prisma: mockPrisma };
});

vi.mock("@/lib/services/vector-service", () => {
  return {
    vectorService: {
      findSimilarToNode: vi.fn(),
      updateNodeEmbedding: vi.fn(),
    },
  };
});

vi.mock("@/lib/services/manifest-service", () => {
  return {
    manifestService: {
      getAgents: vi.fn(() => [
        { name: "synapse-agent-analyst" },
        { name: "synapse-agent-tech-writer" },
        { name: "synapse-agent-pm" },
        { name: "synapse-agent-ux-designer" },
        { name: "synapse-agent-architect" },
        { name: "synapse-agent-web-dev" },
        { name: "synapse-agent-cto" },
        { name: "synapse-agent-user" },
        { name: "synapse-agent-creative" },
        { name: "synapse-agent-qa" },
        { name: "synapse-agent-mobile-dev" },
        { name: "synapse-agent-game-dev" },
      ]),
      getSkills: vi.fn(() => []),
    },
  };
});
vi.mock("@/lib/services/queue-service", () => {
  return {
    queueService: {
      enqueueEmbeddingTask: vi.fn().mockResolvedValue(undefined),
    },
  };
});

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

describe("KnowledgeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getNodes - should retrieve active nodes", async () => {
    const mockNodes = [
      createMockNode({ id: "n1", label: "Node 1", status: "APPROVED" }),
    ];
    asMock<Node[]>(prisma.node.findMany).mockResolvedValue(mockNodes);

    const result = await knowledgeService.getNodes();
    expect(result).toEqual(mockNodes);
    expect(prisma.node.findMany).toHaveBeenCalled();
  });

  it("getNodesWithColor - should retrieve nodes with tags and determine color priority", async () => {
    const mockNodes: NodeWithTagsAndColorRow[] = [
      {
        id: "n1",
        type: "LESSON",
        label: "Node 1",
        properties: "{}",
        status: "APPROVED",
        memory_tier: "ACTIVE",
        last_verified: new Date(),
        success_count: 0,
        embeddingModel: null,
        tags: [
          {
            tag: createMockTag({
              scope: "custom-scope",
              name: "coder",
              color: "blue",
            }),
          },
          {
            tag: createMockTag({
              scope: "technology",
              name: "js",
              color: "yellow",
            }),
          },
        ],
      },
      {
        id: "n2",
        type: "LESSON",
        label: "Node 2",
        properties: null,
        status: "APPROVED",
        memory_tier: "ACTIVE",
        last_verified: new Date(),
        success_count: 0,
        embeddingModel: null,
        tags: [],
      },
    ];
    asMock<NodeWithTagsAndColorRow[]>(prisma.node.findMany).mockResolvedValue(
      mockNodes,
    );

    const result = await knowledgeService.getNodesWithColor();
    expect(result).toHaveLength(2);
    expect(result[0].color).toBe("yellow");
    expect(result[1].color).toBe("#64748b");
  });

  it("getNodesWithTagsByIds - should fetch specified nodes", async () => {
    asMock<NodeWithTagsQueryRow[]>(prisma.node.findMany).mockResolvedValue([]);
    const emptyResult = await knowledgeService.getNodesWithTagsByIds([]);
    expect(emptyResult).toEqual([]);

    const mockNodes: NodeWithTagsQueryRow[] = [
      {
        id: "n1",
        type: "LESSON",
        label: "Node 1",
        properties: "{}",
        status: "APPROVED",
        last_verified: new Date(),
        success_count: 0,
        embeddingModel: null,
        tags: [{ tag: createMockTag({ name: "t1" }) }],
      },
    ];
    asMock<NodeWithTagsQueryRow[]>(prisma.node.findMany).mockResolvedValue(
      mockNodes,
    );
    const result = await knowledgeService.getNodesWithTagsByIds(["n1"]);
    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([createMockTag({ name: "t1" })]);
  });

  it("getEdges - should return empty array", async () => {
    const result = await knowledgeService.getEdges();
    expect(result).toEqual([]);
  });

  it("getTags - should return ordered tags", async () => {
    const mockTags = [createMockTag({ id: "t1", name: "t1" })];
    asMock<Tag[]>(prisma.tag.findMany).mockResolvedValue(mockTags);
    const result = await knowledgeService.getTags();
    expect(result).toEqual(mockTags);
  });

  it("getTagEdges - should construct virtual edges", async () => {
    interface NodeWithTagsIds {
      id: string;
      tags: { tagId: string }[];
    }
    const mockNodes: NodeWithTagsIds[] = [
      { id: "n1", tags: [{ tagId: "t1" }, { tagId: "t2" }] },
    ];
    asMock<NodeWithTagsIds[]>(prisma.node.findMany).mockResolvedValue(
      mockNodes,
    );

    const result = await knowledgeService.getTagEdges();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 900000,
      from_id: "n1",
      to_id: "t1",
      relation_type: "TAGGED_WITH",
      properties: "{}",
    });
  });

  it("getStats - should return counts", async () => {
    asMock<number>(prisma.node.count).mockResolvedValue(5);
    const result = await knowledgeService.getStats();
    expect(result).toEqual({ nodeCount: 5, edgeCount: 0 });
  });

  it("getDashboardMetrics - should aggregate count of statuses and archives", async () => {
    asMock<NodeCountGroupByRow[]>(prisma.node.groupBy).mockResolvedValue([
      { status: "APPROVED", _count: { id: 10 } },
    ]);
    asMock<number>(prisma.archive.count).mockResolvedValue(2);

    const result = await knowledgeService.getDashboardMetrics();
    expect(result.statusCounts).toEqual([{ status: "APPROVED", count: 10 }]);
    expect(result.archiveCount).toBe(2);
  });

  it("getPendingUpdates - should fetch and decorate pending nodes with similarity", async () => {
    interface PendingQueryRow {
      id: string;
      type: string;
      label: string;
      properties: string | null;
      status: string;
      last_verified: Date;
      success_count: number;
      embeddingModel: string | null;
      tags: { tag: Tag }[];
    }
    const mockPending: PendingQueryRow[] = [
      {
        id: "p1",
        type: "LESSON",
        label: "L1",
        properties: "{}",
        status: "PENDING",
        last_verified: new Date(),
        success_count: 0,
        embeddingModel: null,
        tags: [{ tag: createMockTag({ id: "t1", name: "tag1" }) }],
      },
    ];
    asMock<PendingQueryRow[]>(prisma.node.findMany).mockResolvedValue(
      mockPending,
    );
    interface SimilarityResult {
      id: string;
      label: string;
      score: number;
    }
    asMock<SimilarityResult[]>(
      vectorService.findSimilarToNode,
    ).mockResolvedValue([{ id: "s1", label: "Similar 1", score: 0.85 }]);

    const result = await knowledgeService.getPendingUpdates();
    expect(result).toHaveLength(1);
    expect(result[0].matches).toEqual([
      { id: "s1", label: "Similar 1", score: 0.85 },
    ]);
  });

  describe("approvePendingUpdate", () => {
    it("should throw if node not found", async () => {
      asMock<Node | null>(prisma.node.findUnique).mockResolvedValue(null);
      await expect(
        knowledgeService.approvePendingUpdate("non-existent"),
      ).rejects.toThrow("Node not found");
    });

    it("should approve standard pending update", async () => {
      const mockNode = createMockNode({
        id: "n1",
        label: "Node 1",
        status: "PENDING",
      });
      asMock<Node | null>(prisma.node.findUnique).mockResolvedValue(mockNode);
      asMock<Node>(prisma.node.update).mockResolvedValue(mockNode);

      const result = await knowledgeService.approvePendingUpdate("n1");
      expect(result).toEqual(mockNode);
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
        "n1",
        "Node 1",
      );
    });

    it("should approve merge pending update", async () => {
      const mockNode = createMockNode({
        id: "n-merge",
        label: "Merged Node",
        status: "PENDING_MERGE",
        properties: JSON.stringify({
          sourceNodeIds: ["src-1", "src-2"],
          similarityScore: 0.9,
        }),
      });
      asMock<Node | null>(prisma.node.findUnique).mockResolvedValue(mockNode);
      asMock<Node>(prisma.node.update).mockResolvedValue(mockNode);

      const result = await knowledgeService.approvePendingUpdate("n-merge");
      expect(result).toBeDefined();
      expect(prisma.node.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["src-1", "src-2"] } },
        data: expect.objectContaining({ status: "ARCHIVE" }),
      });
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
      expect(prisma.archive.create).toHaveBeenCalledTimes(2);
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
        "n-merge",
        "Merged Node",
      );
    });

    it("should handle JSON parse failure during merge pending update", async () => {
      const mockNode = createMockNode({
        id: "n-merge-fail",
        label: "Merged Node Fail",
        status: "PENDING_MERGE",
        properties: "invalid-json{",
      });
      asMock<Node | null>(prisma.node.findUnique).mockResolvedValue(mockNode);
      asMock<Node>(prisma.node.update).mockResolvedValue(mockNode);

      const result =
        await knowledgeService.approvePendingUpdate("n-merge-fail");
      expect(result).toBeDefined();
      expect(prisma.node.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("proposeKnowledge", () => {
    it("should create new node and resolve tags (creating new ones if needed)", async () => {
      asMock<Tag | null>(prisma.tag.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          createMockTag({ id: "t-existing", virtual_clock: 5 }),
        );
      asMock<Tag>(prisma.tag.create).mockResolvedValueOnce(
        createMockTag({ id: "t-new", virtual_clock: 1 }),
      );
      asMock<Node>(prisma.node.create).mockResolvedValue(
        createMockNode({ id: "node-proposed" }),
      );

      const result = await knowledgeService.proposeKnowledge({
        label: "Proposed Node",
        type: "LESSON",
        content: "Some content here",
        tags: ["project:myproject", "tech:react@18"],
      });

      expect(result).toEqual({ success: true, id: "node-proposed" });
      expect(prisma.nodeTag.createMany).toHaveBeenCalled();
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
        "node-proposed",
        "Proposed Node",
      );
    });

    it("should handle concurrent tag creation conflict and fall back to findFirst", async () => {
      asMock<Tag | null>(prisma.tag.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          createMockTag({ id: "t-conflict", virtual_clock: 2 }),
        );

      asMock<Tag>(prisma.tag.create).mockRejectedValueOnce(
        new Error("Unique constraint violation"),
      );
      asMock<Node>(prisma.node.create).mockResolvedValue(
        createMockNode({ id: "node-proposed-conflict" }),
      );

      const result = await knowledgeService.proposeKnowledge({
        label: "Conflict Node",
        type: "LESSON",
        content: "Content",
        tags: ["project:conflict"],
      });

      expect(result).toEqual({ success: true, id: "node-proposed-conflict" });
    });

    it("should throw if tag resolution fails completely", async () => {
      asMock<Tag | null>(prisma.tag.findFirst).mockResolvedValue(null);
      asMock<Tag>(prisma.tag.create).mockRejectedValue(
        new Error("Creation error"),
      );

      await expect(
        knowledgeService.proposeKnowledge({
          label: "Fail Node",
          type: "LESSON",
          content: "Content",
          tags: ["project:fail"],
        }),
      ).rejects.toThrow("Failed to resolve tag: project:fail");
    });

    it("should log error if enqueueEmbeddingTask rejects during proposal", async () => {
      asMock<Tag | null>(prisma.tag.findFirst).mockResolvedValue(
        createMockTag({ id: "t1" }),
      );
      asMock<Node>(prisma.node.create).mockResolvedValue(
        createMockNode({ id: "node-fail-queue" }),
      );
      asMock<void>(queueService.enqueueEmbeddingTask).mockRejectedValueOnce(
        new Error("Enqueue failed"),
      );

      const result = await knowledgeService.proposeKnowledge({
        label: "Queue Fail Node",
        type: "LESSON",
        content: "Content",
        tags: ["project:myproject"],
      });
      expect(result.success).toBe(true);
    });

    it("should throw if an invalid section tag name is provided", async () => {
      await expect(
        knowledgeService.proposeKnowledge({
          label: "Invalid Section Node",
          type: "LESSON",
          content: "Content",
          tags: ["section:invalid-section-name"],
        }),
      ).rejects.toThrow('Invalid section tag: "invalid-section-name"');
    });

    it("should throw if an invalid agent tag name is provided", async () => {
      await expect(
        knowledgeService.proposeKnowledge({
          label: "Invalid Agent Node",
          type: "LESSON",
          content: "Content",
          tags: ["agent:synapse-agent-hacker"],
        }),
      ).rejects.toThrow('Invalid agent tag: "synapse-agent-hacker"');
    });

    it("should successfully create node when valid section and agent tags are provided", async () => {
      asMock<Tag | null>(prisma.tag.findFirst).mockResolvedValue(
        createMockTag({ id: "t1" }),
      );
      asMock<Node>(prisma.node.create).mockResolvedValue(
        createMockNode({ id: "node-valid-tags" }),
      );

      const result = await knowledgeService.proposeKnowledge({
        label: "Valid Tags Node",
        type: "LESSON",
        content: "Content",
        tags: ["section:mistakes-to-avoid", "agent:synapse-agent-web-dev"],
      });
      expect(result.success).toBe(true);
    });
  });

  it("rejectPendingUpdate - should reject node and nullify embedding", async () => {
    const mockNode = createMockNode({ id: "n1", status: "REJECTED" });
    asMock<Node>(prisma.node.update).mockResolvedValue(mockNode);

    const result = await knowledgeService.rejectPendingUpdate("n1");
    expect(result).toEqual(mockNode);
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it("getRelatedNodes - should execute raw query and format result", async () => {
    const mockQueryResults: RelatedNodeQueryRow[] = [
      {
        id: "n2",
        label: "Related Node",
        type: "LESSON",
        properties: "{}",
        status: "APPROVED",
        last_verified: new Date(),
        overlap_count: BigInt(3),
      },
    ];
    asMock<RelatedNodeQueryRow[]>(prisma.$queryRawUnsafe).mockResolvedValue(
      mockQueryResults,
    );

    const result = await knowledgeService.getRelatedNodes("n1");
    expect(result).toHaveLength(1);
    expect(result[0].overlap_count).toBe(3);
    expect(result[0].distance).toBe(1);
  });

  describe("getNodesByContext", () => {
    it("should return empty array if context has no tags", async () => {
      const result = await knowledgeService.getNodesByContext({ tags: [] });
      expect(result).toEqual([]);
    });

    it("should filter nodes, increment clocks and update access times", async () => {
      asMock<Tag[]>(prisma.tag.findMany).mockResolvedValue([
        createMockTag({
          id: "t1",
          scope: "project",
          name: "p1",
          virtual_clock: 10,
        }),
      ]);
      interface NodeTagGroupRow {
        tagId: string;
        _max: {
          last_accessed_at: Date | null;
        };
      }
      asMock<NodeTagGroupRow[]>(prisma.nodeTag.groupBy).mockResolvedValue([
        { tagId: "t1", _max: { last_accessed_at: new Date(2020, 1, 1) } },
      ]);

      const mockNodes: NodeWithTagsByContextRow[] = [
        {
          id: "n-match",
          label: "Matching Node",
          type: "LESSON",
          properties: "{}",
          status: "APPROVED",
          memory_tier: "ACTIVE",
          last_verified: new Date(),
          success_count: 0,
          tags: [
            {
              tagId: "t1",
              accessed_at_virtual_day: 8,
              last_accessed_at: new Date(),
              tag: createMockTag({
                id: "t1",
                scope: "project",
                name: "p1",
                version: "2.0",
                virtual_clock: 10,
              }),
            },
          ],
        },
        {
          id: "n-cold-match",
          label: "Cold Matching Node",
          type: "LESSON",
          properties: JSON.stringify({ content: "Cold content details." }),
          status: "APPROVED",
          memory_tier: "COLD",
          last_verified: new Date(),
          success_count: 0,
          tags: [
            {
              tagId: "t1",
              accessed_at_virtual_day: 5,
              last_accessed_at: new Date(),
              tag: createMockTag({
                id: "t1",
                scope: "project",
                name: "p1",
                version: "2.0",
                virtual_clock: 10,
              }),
            },
          ],
        },
        {
          id: "n-cold-match-2",
          label: "Cold Matching Node 2",
          type: "LESSON",
          properties: JSON.stringify({ content: "Cold content details 2." }),
          status: "APPROVED",
          memory_tier: "COLD",
          last_verified: new Date(),
          success_count: 0,
          tags: [
            {
              tagId: "t1",
              accessed_at_virtual_day: 5,
              last_accessed_at: new Date(),
              tag: createMockTag({
                id: "t1",
                scope: "project",
                name: "p1",
                version: "2.0",
                virtual_clock: 10,
              }),
            },
          ],
        },
        {
          id: "n-global",
          label: "Global Node",
          type: "LESSON",
          properties: "{}",
          status: "APPROVED",
          memory_tier: "ACTIVE",
          last_verified: new Date(),
          success_count: 0,
          tags: [
            {
              tagId: "t-global",
              accessed_at_virtual_day: 10,
              last_accessed_at: new Date(),
              tag: createMockTag({
                id: "t-global",
                scope: "scope",
                name: "global",
                virtual_clock: 10,
              }),
            },
          ],
        },
      ];
      asMock<NodeWithTagsByContextRow[]>(
        prisma.node.findMany,
      ).mockResolvedValue(mockNodes);

      const result = await knowledgeService.getNodesByContext({
        tags: ["project:p1@2.0", "p1"],
      });
      expect(result).toHaveLength(4);
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(prisma.nodeTag.updateMany).toHaveBeenCalled();
    });
  });

  it("updateTagColor - should update tag color", async () => {
    asMock<Tag>(prisma.tag.update).mockResolvedValue(createMockTag({}));
    const result = await knowledgeService.updateTagColor("t1", "red");
    expect(result).toEqual({ success: true });
  });

  describe("formatAsMarkdown", () => {
    it("should format active/core and beta/cold nodes cleanly", () => {
      const nodes = [
        {
          id: "n1",
          label: "Active Lesson",
          type: "LESSON",
          properties: JSON.stringify({ content: "This is a key lesson." }),
          distance: 0.1234,
          status: "APPROVED",
          memory_tier: "ACTIVE",
          tags: [
            createMockTag({ scope: "section", name: "mistakes-to-avoid" }),
          ],
        },
        {
          id: "n2",
          label: "Beta Feature",
          type: "FEATURE",
          properties: JSON.stringify({ content: "This is a beta feature." }),
          distance: 0.5678,
          status: "BETA",
          memory_tier: "ACTIVE",
          tags: [],
        },
        {
          id: "n3",
          label: "Cold Context Node",
          type: "CONTEXT",
          properties: JSON.stringify({
            content:
              "This context has hibernated for a very long time indeed, and we must ensure that the very first sentence of this content is exceptionally long, exceeding one hundred and twenty characters without any sentence-ending punctuation like periods or exclamation marks.",
          }),
          distance: 0.99,
          status: "APPROVED",
          memory_tier: "COLD",
          virtual_age: 120,
          representative_tag: "project:synapse",
          tag_overlap: "2/3",
          tags: [],
        },
        {
          id: "n4",
          label: "Context Lesson",
          type: "CONTEXT",
          properties: JSON.stringify({ content: "This is a context lesson." }),
          distance: 0.22,
          status: "APPROVED",
          memory_tier: "ACTIVE",
          tags: [
            createMockTag({ scope: "custom", name: "mock-tag", version: null }),
            createMockTag({
              scope: "custom-with-version",
              name: "mock-tag",
              version: "1.0",
            }),
          ],
        },
      ];

      const markdown = knowledgeService.formatAsMarkdown(
        nodes as object as (Node & { distance: number })[],
      );
      expect(markdown).toContain("Active Lesson");
      expect(markdown).toContain("Beta Feature");
      expect(markdown).toContain("Beta Rule");
      expect(markdown).toContain("COLD STORAGE");
      expect(markdown).toContain("Hibernating Memory");
      expect(markdown).toContain("🔮");
      expect(markdown).toContain("custom:mock-tag");
      expect(markdown).toContain("custom-with-version:mock-tag@1.0");
    });
  });

  it("mergeNodes - should archive source nodes and create new merged node in transaction", async () => {
    asMock<Node>(prisma.node.create).mockResolvedValue(
      createMockNode({ id: "merged-node" }),
    );
    asMock<Tag | null>(prisma.tag.findUnique).mockResolvedValue(
      createMockTag({ id: "tag-id", virtual_clock: 3 }),
    );

    const result = await knowledgeService.mergeNodes({
      sourceNodeIds: ["s1", "s2"],
      newLabel: "New Label",
      newType: "FEATURE",
      newContent: "Merged content",
      selectedTagIds: ["tag-id"],
      reason: "consolidation",
      similarityScore: 0.88,
    });

    expect(result.id).toBe("merged-node");
    expect(prisma.node.create).toHaveBeenCalled();
    expect(prisma.node.updateMany).toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(prisma.archive.create).toHaveBeenCalledTimes(2);
    expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
      "merged-node",
      "New Label",
    );
  });

  describe("undoAction", () => {
    it("should handle REJECTED undo action", async () => {
      asMock<Node>(prisma.node.update).mockResolvedValue(
        createMockNode({ id: "n1", label: "L1" }),
      );

      const result = await knowledgeService.undoAction("n1", "REJECTED");
      expect(result).toEqual({ success: true });
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledWith(
        "n1",
        "L1",
      );
    });

    it("should handle ARCHIVE undo action and restore source nodes", async () => {
      asMock<Archive | null>(prisma.archive.findFirst).mockResolvedValue({
        id: "a1",
        fromNodeId: "src-1",
        toNodeId: "merged-c",
        reason: null,
        similarityScore: null,
        mergedAt: new Date(),
      });
      asMock<Archive[]>(prisma.archive.findMany).mockResolvedValue([
        {
          id: "a1",
          fromNodeId: "src-1",
          toNodeId: "merged-c",
          reason: null,
          similarityScore: null,
          mergedAt: new Date(),
        },
        {
          id: "a2",
          fromNodeId: "src-2",
          toNodeId: "merged-c",
          reason: null,
          similarityScore: null,
          mergedAt: new Date(),
        },
      ]);
      asMock<Node[]>(prisma.node.findMany).mockResolvedValue([
        createMockNode({ id: "src-1", label: "L1" }),
        createMockNode({ id: "src-2", label: "L2" }),
      ]);

      const result = await knowledgeService.undoAction("src-1", "ARCHIVE");
      expect(result).toEqual({ success: true });
      expect(prisma.node.updateMany).toHaveBeenCalled();
      expect(prisma.node.delete).toHaveBeenCalledWith({
        where: { id: "merged-c" },
      });
      expect(prisma.archive.deleteMany).toHaveBeenCalledWith({
        where: { toNodeId: "merged-c" },
      });
      expect(queueService.enqueueEmbeddingTask).toHaveBeenCalledTimes(2);
    });

    it("should return failure if archive history not found", async () => {
      asMock<Archive | null>(prisma.archive.findFirst).mockResolvedValue(null);
      const result = await knowledgeService.undoAction(
        "non-existent-archive",
        "ARCHIVE",
      );
      expect(result).toEqual({
        success: false,
        message: "Merge history not found.",
      });
    });

    it("should return failure for unknown action type", async () => {
      const result = await knowledgeService.undoAction(
        "n1",
        "UNKNOWN" as string as "REJECTED",
      );
      expect(result).toEqual({ success: false, message: "Unknown undo type." });
    });
  });

  describe("incrementSuccessCount", () => {
    it("should throw if node not found", async () => {
      asMock<Node | null>(prisma.node.findUnique).mockResolvedValue(null);
      await expect(
        knowledgeService.incrementSuccessCount("n-none"),
      ).rejects.toThrow("Node not found");
    });

    it("should increment success count and elevate to GOLD if BETA and count >= 3", async () => {
      interface NodeWithTags {
        id: string;
        success_count: number;
        status: string;
        memory_tier: string;
        tags: { tag: Tag }[];
      }
      const mockNode: NodeWithTags = {
        id: "n-beta",
        success_count: 2,
        status: "BETA",
        memory_tier: "ACTIVE",
        tags: [],
      };
      asMock<NodeWithTags | null>(prisma.node.findUnique).mockResolvedValue(
        mockNode,
      );
      asMock<Node>(prisma.node.update).mockResolvedValue(
        createMockNode({ id: "n-beta", success_count: 3, status: "GOLD" }),
      );

      const result = await knowledgeService.incrementSuccessCount("n-beta");
      expect(result.status).toBe("GOLD");
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: "n-beta" },
        data: expect.objectContaining({ status: "GOLD", success_count: 3 }),
      });
    });

    it("should handle COLD node reset when success count increments", async () => {
      interface NodeWithTags {
        id: string;
        success_count: number;
        status: string;
        memory_tier: string;
        tags: { tag: Tag }[];
      }
      const mockNode: NodeWithTags = {
        id: "n-cold",
        success_count: 0,
        status: "APPROVED",
        memory_tier: "COLD",
        tags: [{ tag: createMockTag({ id: "t1", virtual_clock: 10 }) }],
      };
      asMock<NodeWithTags | null>(prisma.node.findUnique).mockResolvedValue(
        mockNode,
      );
      asMock<Node>(prisma.node.update).mockResolvedValue(createMockNode({}));

      await knowledgeService.incrementSuccessCount("n-cold");
      expect(prisma.nodeTag.update).toHaveBeenCalled();
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: "n-cold" },
        data: expect.objectContaining({ memory_tier: "ACTIVE" }),
      });
    });
  });

  describe("wakeUpNode", () => {
    it("should throw if node not found", async () => {
      asMock<Node | null>(prisma.node.findUnique).mockResolvedValue(null);
      await expect(knowledgeService.wakeUpNode("n-none")).rejects.toThrow(
        "Node not found",
      );
    });

    it("should restore node and update tag accessed times", async () => {
      interface NodeWithTags {
        id: string;
        success_count: number;
        status: string;
        memory_tier: string;
        tags: { tag: Tag }[];
      }
      const mockNode: NodeWithTags = {
        id: "n-wake",
        success_count: 0,
        status: "APPROVED",
        memory_tier: "COLD",
        tags: [{ tag: createMockTag({ id: "t1", virtual_clock: 5 }) }],
      };
      asMock<NodeWithTags | null>(prisma.node.findUnique).mockResolvedValue(
        mockNode,
      );
      asMock<Node>(prisma.node.update).mockResolvedValue(createMockNode({}));

      await knowledgeService.wakeUpNode("n-wake");
      expect(prisma.nodeTag.update).toHaveBeenCalled();
      expect(prisma.node.update).toHaveBeenCalledWith({
        where: { id: "n-wake" },
        data: expect.objectContaining({ memory_tier: "ACTIVE" }),
      });
    });
  });
});
