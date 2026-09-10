import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMemoryTools } from "./memory";
import { registerBetterAuthTools } from "./better_auth";
import { registerRepoIndexerTools } from "./repo_indexer";
import { registerDocsSeekerTools } from "./docs_seeker";
import { registerContextAnalyzerTools } from "./context_analyzer";
import { registerCopywritingTools } from "./copywriting";
import { registerDistillatorTools } from "./distillator";
import { registerDesignSystemTools } from "./design_system";
import { registerAiArtistTools } from "./ai_artist";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "SynapsePortal",
    version: "1.0.0",
  });

  registerMemoryTools(server);
  registerBetterAuthTools(server);
  registerRepoIndexerTools(server);
  registerDocsSeekerTools(server);
  registerContextAnalyzerTools(server);
  registerCopywritingTools(server);
  registerDistillatorTools(server);
  registerDesignSystemTools(server);
  registerAiArtistTools(server);

  return server;
}
