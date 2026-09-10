import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { analyzeContextHealthSchema, calculateContextBudgetSchema } from "./schema";
import { analyzeContextHealth, calculateContextBudget } from "./service";

export * from "./schema";
export * from "./service";

export function registerContextAnalyzerTools(server: McpServer): void {
  server.tool(
    McpToolName.ANALYZE_CONTEXT_HEALTH,
    "Analyze the health, token utilization, degradation risk, and attention budget of an agent's context.",
    analyzeContextHealthSchema,
    async ({ context_file_path, token_limit }) => {
      const text = analyzeContextHealth(context_file_path, token_limit);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.CALCULATE_CONTEXT_BUDGET,
    "Calculate and suggest a context/token budget allocation for system prompts, tools, documents, and history.",
    calculateContextBudgetSchema,
    async ({
      system_tokens,
      tools_tokens,
      docs_tokens,
      history_tokens,
      buffer_percentage,
    }) => {
      const text = calculateContextBudget(
        system_tokens,
        tools_tokens,
        docs_tokens,
        history_tokens,
        buffer_percentage,
      );
      return { content: [{ type: "text", text }] };
    },
  );
}
