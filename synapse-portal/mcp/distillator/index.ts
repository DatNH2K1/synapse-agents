import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { analyzeDistillationSourcesSchema } from "./schema";
import { analyzeDistillationSources } from "./service";

export * from "./schema";
export * from "./service";

export function registerDistillatorTools(server: McpServer): void {
  server.tool(
    McpToolName.ANALYZE_DISTILLATION_SOURCES,
    "Analyze source documents for the distillation generator to determine routing and size.",
    analyzeDistillationSourcesSchema,
    async ({ sources }) => {
      const text = analyzeDistillationSources(sources);
      return { content: [{ type: "text", text }] };
    },
  );
}
