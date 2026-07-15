import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getStats } from "@/app/api/stats/route";
import { knowledgeService } from "@/lib/services/knowledge-service";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getStats: vi.fn(),
  },
}));

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return stats on success", async () => {
    const mockStats = { totalNodes: 10, totalEdges: 5 };
    vi.mocked(knowledgeService.getStats).mockResolvedValue(
      mockStats as object as Awaited<
        ReturnType<typeof knowledgeService.getStats>
      >,
    );

    const response = await getStats();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockStats);
  });

  it("should return 500 status on service failure", async () => {
    vi.mocked(knowledgeService.getStats).mockRejectedValue(
      new Error("Stats error"),
    );

    const response = await getStats();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Failed to fetch stats" });
  });
});
