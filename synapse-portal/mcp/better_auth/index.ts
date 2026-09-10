import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { initBetterAuthSchema } from "./schema";
import { initBetterAuth } from "./service";

export * from "./schema";
export * from "./service";

export function registerBetterAuthTools(server: McpServer): void {
  server.tool(
    McpToolName.INIT_BETTER_AUTH,
    "Initialize Better Auth in a project by generating auth.ts and updating .env file.",
    initBetterAuthSchema,
    async ({ db_type, auth_methods, project_path }) => {
      const text = initBetterAuth(db_type, auth_methods, project_path);
      return { content: [{ type: "text", text }] };
    },
  );
}
