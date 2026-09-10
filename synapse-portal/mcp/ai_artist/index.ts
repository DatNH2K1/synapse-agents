import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateAiArtSchema, searchAiArtPromptsSchema } from "./schema";
import { searchAiArtPrompts, generateAiArt } from "./service";

export * from "./schema";
export * from "./service";

export function registerAiArtistTools(server: McpServer): void {
  server.tool(
    McpToolName.GENERATE_AI_ART,
    "Generate optimized AI Art prompts for image generation models based on concept and aspect ratio.",
    generateAiArtSchema,
    async ({ concept, mode, aspect_ratio }) => {
      const text = generateAiArt(concept, mode, aspect_ratio);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.SEARCH_AI_ART_PROMPTS,
    "Search the curated AI Art prompts database for matching templates.",
    searchAiArtPromptsSchema,
    async ({ query, category, limit }) => {
      const text = searchAiArtPrompts(query, category, limit);
      return { content: [{ type: "text", text }] };
    },
  );
}
