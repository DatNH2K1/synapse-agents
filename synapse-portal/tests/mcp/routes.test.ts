import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/mcp/route";
import { listWritingStyles, extractWritingStyle } from "@/mcp/copywriting";

describe("MCP API Route & Extra Tools", () => {
  describe("Next.js /api/mcp route", () => {
    it("GET /api/mcp should return tools manifest", async () => {
      const response = await GET();
      const data = await response.json();
      expect(data.status).toBe("online");
      expect(data.tools).toBeInstanceOf(Array);
      expect(data.tools.length).toBeGreaterThan(10);
    });

    it("POST /api/mcp with initialize method", async () => {
      const req = new Request("http://localhost:3100/api/mcp", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {},
        }),
      });

      const response = await POST(req);
      const data = await response.json();
      expect(data.jsonrpc).toBe("2.0");
      expect(data.result.serverInfo.name).toBe("SynapsePortal");
    });

    it("POST /api/mcp with tools/list method", async () => {
      const req = new Request("http://localhost:3100/api/mcp", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        }),
      });

      const response = await POST(req);
      const data = await response.json();
      expect(data.result.tools).toBeInstanceOf(Array);
    });

    it("POST /api/mcp with tools/call calculate_context_budget", async () => {
      const req = new Request("http://localhost:3100/api/mcp", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "calculate_context_budget",
            arguments: {
              system_tokens: 1000,
              tools_tokens: 1000,
              docs_tokens: 1000,
              history_tokens: 1000,
              buffer_percentage: 0.1,
            },
          },
        }),
      });

      const response = await POST(req);
      const data = await response.json();
      expect(data.result.content[0].type).toBe("text");
      const parsed = JSON.parse(data.result.content[0].text);
      expect(parsed.total_budget).toBe(4400);
    });
  });

  describe("Copywriting Tool", () => {
    it("listWritingStyles should return table or informative message", () => {
      const result = listWritingStyles();
      expect(result).toBeDefined();
    });

    it("extractWritingStyle on missing style returns error", () => {
      const result = extractWritingStyle("non_existent_style_xyz");
      expect(result).toBeDefined();
    });
  });
});
