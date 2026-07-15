import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postContextExport } from "@/app/api/context/export/route";
import { knowledgeService } from "@/lib/services/knowledge-service";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getNodesByContext: vi.fn(),
    formatAsMarkdown: vi.fn(),
    getNodesWithTagsByIds: vi.fn(),
  },
}));

describe("POST /api/context/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty response when no matching nodes are found", async () => {
    vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue([]);

    const req = new Request("http://localhost/api/context/export", {
      method: "POST",
      body: JSON.stringify({ tags: ["test"], format: "json" }),
    });

    const response = await postContextExport(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("should return empty markdown response when format is md and no matching nodes are found", async () => {
    vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue([]);

    const req = new Request("http://localhost/api/context/export", {
      method: "POST",
      body: JSON.stringify({ tags: ["test"], format: "md" }),
    });

    const response = await postContextExport(req);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/markdown");
    const text = await response.text();
    expect(text).toBe("");
  });

  it("should export as markdown when format is md", async () => {
    const mockNodes = [{ id: "node-1", label: "Node 1", content: "Content 1" }];
    vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue(
      mockNodes as object as Awaited<
        ReturnType<typeof knowledgeService.getNodesByContext>
      >,
    );
    vi.mocked(knowledgeService.formatAsMarkdown).mockReturnValue(
      "# Node 1\nContent 1",
    );

    const req = new Request("http://localhost/api/context/export", {
      method: "POST",
      body: JSON.stringify({ tags: ["test"], format: "md" }),
    });

    const response = await postContextExport(req);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/markdown");
    const text = await response.text();
    expect(text).toBe("# Node 1\nContent 1");
    expect(knowledgeService.formatAsMarkdown).toHaveBeenCalled();
  });

  it("should export as json with mapped tags by default", async () => {
    const mockNodes = [
      {
        id: "node-1",
        label: "Node 1",
        properties: JSON.stringify({ key: "value" }),
        embedding: "vector-data-should-be-removed",
        embeddingModel: "model-name",
        content_hash: "hash-123",
      },
    ];
    const mockNodesWithTags = [
      {
        id: "node-1",
        tags: [
          { scope: "system", name: "test-tag", version: 1 },
          { scope: "user", name: "another-tag" },
        ],
      },
    ];

    vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue(
      mockNodes as object as Awaited<
        ReturnType<typeof knowledgeService.getNodesByContext>
      >,
    );
    vi.mocked(knowledgeService.getNodesWithTagsByIds).mockResolvedValue(
      mockNodesWithTags as object as Awaited<
        ReturnType<typeof knowledgeService.getNodesWithTagsByIds>
      >,
    );

    const req = new Request("http://localhost/api/context/export", {
      method: "POST",
      body: JSON.stringify({ tags: ["test"] }),
    });

    const response = await postContextExport(req);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("node-1");
    expect(data[0].label).toBe("Node 1");
    // embedding, embeddingModel, content_hash should be sanitized out
    expect(data[0].embedding).toBeUndefined();
    expect(data[0].embeddingModel).toBeUndefined();
    expect(data[0].content_hash).toBeUndefined();
    // properties should be safely parsed
    expect(data[0].properties).toEqual({ key: "value" });
    // tags should be formatted
    expect(data[0].tags).toEqual(["system:test-tag@1", "user:another-tag"]);
  });

  it("should parse properties as raw string if JSON parsing fails", async () => {
    const mockNodes = [
      {
        id: "node-1",
        label: "Node 1",
        properties: "not-a-json-string",
      },
    ];
    vi.mocked(knowledgeService.getNodesByContext).mockResolvedValue(
      mockNodes as object as Awaited<
        ReturnType<typeof knowledgeService.getNodesByContext>
      >,
    );
    vi.mocked(knowledgeService.getNodesWithTagsByIds).mockResolvedValue(
      [] as object as Awaited<
        ReturnType<typeof knowledgeService.getNodesWithTagsByIds>
      >,
    );

    const req = new Request("http://localhost/api/context/export", {
      method: "POST",
      body: JSON.stringify({ tags: [] }),
    });

    const response = await postContextExport(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].properties).toBe("not-a-json-string");
  });

  it("should return 500 when knowledgeService throws an error", async () => {
    vi.mocked(knowledgeService.getNodesByContext).mockRejectedValue(
      new Error("Database failure"),
    );

    const req = new Request("http://localhost/api/context/export", {
      method: "POST",
      body: JSON.stringify({ tags: [] }),
    });

    const response = await postContextExport(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Database failure");
  });
});
