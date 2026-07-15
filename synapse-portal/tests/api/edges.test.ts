import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getEdges } from "@/app/api/edges/route";
import { knowledgeService } from "@/lib/services/knowledge-service";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getEdges: vi.fn(),
  },
}));

describe("GET /api/edges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return edges list on success", async () => {
    const mockEdges = [{ id: "edge-1", source: "A", target: "B" }];
    vi.mocked(knowledgeService.getEdges).mockResolvedValue(
      mockEdges as object as Awaited<
        ReturnType<typeof knowledgeService.getEdges>
      >,
    );

    const response = await getEdges();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockEdges);
  });

  it("should return 500 status on service failure", async () => {
    vi.mocked(knowledgeService.getEdges).mockRejectedValue(
      new Error("Database failure"),
    );

    const response = await getEdges();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Failed to fetch edges" });
  });
});
