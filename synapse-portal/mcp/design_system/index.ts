import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateDesignSystemRecommendationSchema } from "./schema";
import { generateDesignSystemRecommendation } from "./service";

export * from "./schema";
export * from "./service";

export function registerDesignSystemTools(server: McpServer): void {
  server.tool(
    McpToolName.GENERATE_DESIGN_SYSTEM_RECOMMENDATION,
    "Generate comprehensive design system recommendations based on a UI concept and styles database.",
    generateDesignSystemRecommendationSchema,
    async ({ query, project_name, format_type }) => {
      const text = generateDesignSystemRecommendation(
        query,
        project_name,
        format_type,
      );
      return { content: [{ type: "text", text }] };
    },
  );
}
