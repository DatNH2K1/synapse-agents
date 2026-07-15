import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getNodes } from "@/app/api/nodes/route";
import { POST as postEfficacy } from "@/app/api/nodes/efficacy/route";
import { knowledgeService } from "@/lib/services/knowledge-service";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getNodesWithColor: vi.fn(),
    incrementSuccessCount: vi.fn(),
  },
}));

describe("Nodes API Routes Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nodes", () => {
    it("should return nodes list on success", async () => {
      const mockNodes = [{ id: "node-1", label: "Node 1" }];
      vi.mocked(knowledgeService.getNodesWithColor).mockResolvedValue(
        mockNodes as object as Awaited<
          ReturnType<typeof knowledgeService.getNodesWithColor>
        >,
      );

      const response = await getNodes();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockNodes);
    });

    it("should return 500 status on service failure", async () => {
      vi.mocked(knowledgeService.getNodesWithColor).mockRejectedValue(
        new Error("Database failure"),
      );

      const response = await getNodes();
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch nodes" });
    });
  });

  describe("POST /api/nodes/efficacy", () => {
    it("should return 400 if nodeId is missing in request", async () => {
      const req = new Request("http://localhost/api/nodes/efficacy", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await postEfficacy(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ success: false, message: "Node ID is required" });
    });

    it("should return updated successCount on success", async () => {
      const req = new Request("http://localhost/api/nodes/efficacy", {
        method: "POST",
        body: JSON.stringify({ nodeId: "node-123" }),
      });

      vi.mocked(knowledgeService.incrementSuccessCount).mockResolvedValue({
        id: "node-123",
        success_count: 3,
      } as object as Awaited<
        ReturnType<typeof knowledgeService.incrementSuccessCount>
      >);

      const response = await postEfficacy(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.nodeId).toBe("node-123");
      expect(data.successCount).toBe(3);
    });

    it("should return 500 on database error", async () => {
      const req = new Request("http://localhost/api/nodes/efficacy", {
        method: "POST",
        body: JSON.stringify({ nodeId: "node-123" }),
      });

      vi.mocked(knowledgeService.incrementSuccessCount).mockRejectedValue(
        new Error("DB Error"),
      );

      const response = await postEfficacy(req);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("DB Error");
    });

    it("should return 500 with default message on non-Error database rejection", async () => {
      const req = new Request("http://localhost/api/nodes/efficacy", {
        method: "POST",
        body: JSON.stringify({ nodeId: "node-123" }),
      });

      vi.mocked(knowledgeService.incrementSuccessCount).mockRejectedValue(
        "String error rejection",
      );

      const response = await postEfficacy(req);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to increment efficacy");
    });
  });
});
