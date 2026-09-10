import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { indexRepositorySchema, queryRepositoryIndexSchema } from "./schema";
import { queryRepositoryIndex, indexRepository } from "./service";

export * from "./schema";
export * from "./service";

export function registerRepoIndexerTools(server: McpServer): void {
  server.tool(
    McpToolName.INDEX_REPOSITORY,
    "Index a codebase/repository to build AST dependencies and sync them to Synapse Portal.",
    indexRepositorySchema,
    async ({ repo_path, repo_name }) => {
      const text = await indexRepository(repo_path, repo_name);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.QUERY_REPOSITORY_INDEX,
    "Query indexed files, symbols, dependencies, and dependents from the Synapse Portal database.",
    queryRepositoryIndexSchema,
    async ({ repo_name, file_path }) => {
      const text = await queryRepositoryIndex(repo_name, file_path);
      return { content: [{ type: "text", text }] };
    },
  );
}
