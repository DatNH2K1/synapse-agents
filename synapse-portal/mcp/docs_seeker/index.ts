import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchOnlineDocsSchema, analyzeLlmsTxtSchema } from "./schema";
import { fetchOnlineDocs, analyzeLlmsTxt } from "./service";

export * from "./schema";
export * from "./service";

export function registerDocsSeekerTools(server: McpServer): void {
  server.tool(
    McpToolName.FETCH_ONLINE_DOCS,
    "Fetch documentation (like llms.txt) for a given query or library from context7.com.",
    fetchOnlineDocsSchema,
    async ({ query }) => {
      const text = await fetchOnlineDocs(query);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.ANALYZE_LLMS_TXT,
    "Analyze llms.txt content to extract URLs, prioritize them, and suggest optimal agent distribution.",
    analyzeLlmsTxtSchema,
    async ({ content }) => {
      const text = analyzeLlmsTxt(content);
      return { content: [{ type: "text", text }] };
    },
  );
}
