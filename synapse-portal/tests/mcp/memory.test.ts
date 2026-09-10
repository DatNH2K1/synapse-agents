import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  queryMemory,
  proposeMemory,
  approveProposal,
  rejectProposal,
  incrementEfficacy,
  listNodes,
} from "@/mcp/memory";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getNodesByContext: vi.fn(),
    formatAsMarkdown: vi.fn(),
    proposeKnowledge: vi.fn(),
    approvePendingUpdate: vi.fn(),
    rejectPendingUpdate: vi.fn(),
    getNodesWithColor: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    node: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("MCP Memory Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("queryMemory", () => {
    it("should return error if no tags provided", async () => {
      const res = await queryMemory([]);
      expect(res).toContain("Error: At least one tag must be provided");
    });

    it("should query nodes and return markdown", async () => {
      vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue([
        {
          id: "node-1",
          label: "Test Node",
          type: "CONTEXT",
          content: "Sample content",
          status: "APPROVED",
          memory_tier: "WORKING",
          success_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
          properties: null,
          color: "#3B82F6",
        } as unknown as import("@/lib/db").Node,
      ]);
      vi.mocked(knowledgeService.formatAsMarkdown).mockReturnValue("# Test Node\nSample content");

      const res = await queryMemory(["project:synapse"]);
      expect(res).toContain("# Test Node");
    });

    it("should handle empty search results", async () => {
      vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue([]);
      const res = await queryMemory(["project:unknown"]);
      expect(res).toContain("No matching knowledge nodes found");
    });
  });

  describe("proposeMemory", () => {
    it("should validate type", async () => {
      const res = await proposeMemory("Title", "Content", "INVALID_TYPE", []);
      expect(res).toContain("Error: type must be 'LESSON', 'CONTEXT', or 'FEATURE'");
    });

    it("should require section tag for LESSON", async () => {
      const res = await proposeMemory("Title", "Content", "LESSON", ["project:synapse"]);
      expect(res).toContain("LESSON type requires a 'section:<name>' tag");
    });

    it("should successfully record proposal", async () => {
      vi.mocked(knowledgeService.proposeKnowledge).mockResolvedValue({
        success: true,
        id: "prop-123",
      });

      const res = await proposeMemory("Title", "Content", "CONTEXT", ["project:synapse"]);
      expect(res).toContain("Success: Recorded CONTEXT 'Title' (ID: prop-123)");
    });
  });

  describe("approveProposal & rejectProposal", () => {
    it("should approve proposal", async () => {
      vi.mocked(knowledgeService.approvePendingUpdate).mockResolvedValue(undefined as never);
      const res = await approveProposal("prop-123");
      expect(res).toContain("Success: Proposal prop-123 approved");
    });

    it("should reject proposal", async () => {
      vi.mocked(knowledgeService.rejectPendingUpdate).mockResolvedValue(undefined as never);
      const res = await rejectProposal("prop-123");
      expect(res).toContain("Success: Proposal prop-123 rejected");
    });
  });

  describe("incrementEfficacy", () => {
    it("should increment success count", async () => {
      vi.mocked(prisma.node.findUnique).mockResolvedValue({
        id: "node-1",
        label: "Node 1",
      } as unknown as import("@/lib/db").Node);
      vi.mocked(prisma.node.update).mockResolvedValue({
        id: "node-1",
        success_count: 5,
      } as unknown as import("@/lib/db").Node);

      const res = await incrementEfficacy("node-1");
      expect(res).toContain("Current success count: 5");
    });
  });

  describe("listNodes", () => {
    it("should list active nodes", async () => {
      vi.mocked(knowledgeService.getNodesWithColor).mockResolvedValue([
        {
          id: "node-1",
          label: "Arch Pattern",
          type: "CONTEXT",
          status: "APPROVED",
          memory_tier: "LONG_TERM",
          success_count: 10,
          color: "#3B82F6",
          tags: [
            {
              id: "tag-1",
              scope: "project",
              name: "synapse",
              version: null,
              color: "#3B82F6",
              virtual_clock: 0,
            },
          ],
        } as never,
      ]);

      const res = await listNodes();
      expect(res).toContain("Active/Approved Knowledge Nodes");
      expect(res).toContain("Arch Pattern");
    });
  });
});
