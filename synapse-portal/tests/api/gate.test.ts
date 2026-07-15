import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postGate } from "@/app/api/gate/route";
import { POST as postMerge } from "@/app/api/gate/merge/route";
import { POST as postSynthesize } from "@/app/api/gate/synthesize/route";
import { POST as postSleepCycle } from "@/app/api/gate/sleep-cycle/route";

import { knowledgeService } from "@/lib/services/knowledge-service";
import { sleepCycleService } from "@/lib/services/sleep-cycle-service";
import { aiService } from "@/lib/services/ai-service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    rejectPendingUpdate: vi.fn(),
    approvePendingUpdate: vi.fn(),
    undoAction: vi.fn(),
    wakeUpNode: vi.fn(),
    mergeNodes: vi.fn(),
  },
}));

vi.mock("@/lib/services/sleep-cycle-service", () => ({
  sleepCycleService: {
    run: vi.fn(),
  },
}));

vi.mock("@/lib/services/ai-service", () => ({
  aiService: {
    synthesizeKnowledge: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    node: {
      findMany: vi.fn(),
    },
  },
}));

describe("Gate API Routes Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/gate", () => {
    it("should return 400 if id is not a string", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: 123, action: "REJECT" }),
      });

      const response = await postGate(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain("Invalid ID format");
    });

    it("should handle REJECT action", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "REJECT" }),
      });

      const response = await postGate(req);
      expect(response.status).toBe(200);
      expect(knowledgeService.rejectPendingUpdate).toHaveBeenCalledWith(
        "node-id",
      );
    });

    it("should handle APPROVE action", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "APPROVE" }),
      });

      const response = await postGate(req);
      expect(response.status).toBe(200);
      expect(knowledgeService.approvePendingUpdate).toHaveBeenCalledWith(
        "node-id",
      );
    });

    it("should handle UNDO action successfully", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "UNDO", type: "LESSON" }),
      });

      vi.mocked(knowledgeService.undoAction).mockResolvedValue({
        success: true,
      });

      const response = await postGate(req);
      expect(response.status).toBe(200);
      expect(knowledgeService.undoAction).toHaveBeenCalledWith(
        "node-id",
        "LESSON",
      );
    });

    it("should return 400 if UNDO action fails", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "UNDO", type: "LESSON" }),
      });

      vi.mocked(knowledgeService.undoAction).mockResolvedValue({
        success: false,
        message: "Undo failed",
      });

      const response = await postGate(req);
      expect(response.status).toBe(400);
    });

    it("should handle WAKEUP action", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "WAKEUP" }),
      });

      const response = await postGate(req);
      expect(response.status).toBe(200);
      expect(knowledgeService.wakeUpNode).toHaveBeenCalledWith("node-id");
    });

    it("should return 400 for unknown action", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "INVALID" }),
      });

      const response = await postGate(req);
      expect(response.status).toBe(400);
    });

    it("should return 500 on server error", async () => {
      const req = new Request("http://localhost/api/gate", {
        method: "POST",
        body: JSON.stringify({ id: "node-id", action: "APPROVE" }),
      });

      vi.mocked(knowledgeService.approvePendingUpdate).mockRejectedValue(
        new Error("Database crash"),
      );

      const response = await postGate(req);
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/gate/merge", () => {
    it("should return 400 if action is not MERGE", async () => {
      const req = new Request("http://localhost/api/gate/merge", {
        method: "POST",
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const response = await postMerge(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should merge nodes successfully", async () => {
      const req = new Request("http://localhost/api/gate/merge", {
        method: "POST",
        body: JSON.stringify({
          action: "MERGE",
          sourceNodeIds: ["node-1", "node-2"],
          newLabel: "Merged Node",
          newType: "LESSON",
          newContent: "Merged Body",
        }),
      });

      vi.mocked(knowledgeService.mergeNodes).mockResolvedValue({
        id: "merged-id",
      } as object as Awaited<ReturnType<typeof knowledgeService.mergeNodes>>);

      const response = await postMerge(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.newNodeId).toBe("merged-id");
    });

    it("should return 500 if merge service fails", async () => {
      const req = new Request("http://localhost/api/gate/merge", {
        method: "POST",
        body: JSON.stringify({ action: "MERGE" }),
      });

      vi.mocked(knowledgeService.mergeNodes).mockRejectedValue(
        new Error("Merge error"),
      );

      const response = await postMerge(req);
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/gate/synthesize", () => {
    it("should return 400 if less than two node IDs are provided", async () => {
      const req = new Request("http://localhost/api/gate/synthesize", {
        method: "POST",
        body: JSON.stringify({ nodeIds: ["node-1"] }),
      });

      const response = await postSynthesize(req);
      expect(response.status).toBe(400);
    });

    it("should return 404 if some nodes are not found", async () => {
      const req = new Request("http://localhost/api/gate/synthesize", {
        method: "POST",
        body: JSON.stringify({ nodeIds: ["node-1", "node-2"] }),
      });

      vi.mocked(prisma.node.findMany).mockResolvedValue([
        { id: "node-1" },
      ] as object as Awaited<ReturnType<typeof prisma.node.findMany>>);

      const response = await postSynthesize(req);
      expect(response.status).toBe(404);
    });

    it("should synthesize nodes successfully", async () => {
      const req = new Request("http://localhost/api/gate/synthesize", {
        method: "POST",
        body: JSON.stringify({ nodeIds: ["node-1", "node-2"] }),
      });

      vi.mocked(prisma.node.findMany).mockResolvedValue([
        {
          id: "node-1",
          label: "Node 1",
          properties: JSON.stringify({ content: "C1" }),
        },
        {
          id: "node-2",
          label: "Node 2",
          properties: JSON.stringify({ content: "C2" }),
        },
      ] as object as Awaited<ReturnType<typeof prisma.node.findMany>>);

      const mockSynthesisResult = {
        label: "Synthesized",
        content: "Resulting content",
        reason: "Good reason",
      };
      vi.mocked(aiService.synthesizeKnowledge).mockResolvedValue(
        mockSynthesisResult,
      );

      const response = await postSynthesize(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.label).toBe("Synthesized");
    });

    it("should return 500 if synthesis service fails", async () => {
      const req = new Request("http://localhost/api/gate/synthesize", {
        method: "POST",
        body: JSON.stringify({ nodeIds: ["node-1", "node-2"] }),
      });

      vi.mocked(prisma.node.findMany).mockRejectedValue(
        new Error("Prisma error"),
      );

      const response = await postSynthesize(req);
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/gate/sleep-cycle", () => {
    it("should trigger sleep cycle service successfully", async () => {
      const mockSummary = { forgotten: 2, kept: 8 };
      vi.mocked(sleepCycleService.run).mockResolvedValue(
        mockSummary as object as Awaited<
          ReturnType<typeof sleepCycleService.run>
        >,
      );

      const response = await postSleepCycle();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.summary).toEqual(mockSummary);
    });

    it("should return 500 if sleep cycle service fails", async () => {
      vi.mocked(sleepCycleService.run).mockRejectedValue(
        new Error("Sleep cycle crashed"),
      );

      const response = await postSleepCycle();
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Sleep cycle crashed");
    });

    it("should return 500 with default message if sleep cycle service fails with non-Error", async () => {
      vi.mocked(sleepCycleService.run).mockRejectedValue(
        "Unexpected rejection string",
      );

      const response = await postSleepCycle();
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
