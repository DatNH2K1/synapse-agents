import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listWritingStylesSchema, extractWritingStyleSchema } from "./schema";
import { listWritingStyles, extractWritingStyle } from "./service";

export * from "./schema";
export * from "./service";

export function registerCopywritingTools(server: McpServer): void {
  server.tool(
    McpToolName.LIST_WRITING_STYLES,
    "List all available writing style template files inside assets/writing-styles/.",
    listWritingStylesSchema,
    async () => {
      const text = listWritingStyles();
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.EXTRACT_WRITING_STYLE,
    "Extract writing style characteristics from a specific style template file in assets/writing-styles/.",
    extractWritingStyleSchema,
    async ({ style_name, output_json }) => {
      const text = extractWritingStyle(style_name, output_json);
      return { content: [{ type: "text", text }] };
    },
  );
}
