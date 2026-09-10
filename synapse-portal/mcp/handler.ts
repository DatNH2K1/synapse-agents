import { McpToolName } from "./enums";
import {
  queryMemory,
  proposeMemory,
  approveProposal,
  rejectProposal,
  incrementEfficacy,
  listNodes,
} from "./memory";
import { initBetterAuth } from "./better_auth";
import { fetchOnlineDocs, analyzeLlmsTxt } from "./docs_seeker";
import {
  analyzeContextHealth,
  calculateContextBudget,
} from "./context_analyzer";
import { listWritingStyles, extractWritingStyle } from "./copywriting";
import { analyzeDistillationSources } from "./distillator";
import { generateDesignSystemRecommendation } from "./design_system";
import { generateAiArt, searchAiArtPrompts } from "./ai_artist";
import { indexRepository, queryRepositoryIndex } from "./repo_indexer";

export async function handleToolCall(
  name: McpToolName | string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case McpToolName.QUERY_MEMORY:
      return await queryMemory((args.tags as string[]) || []);
    case McpToolName.PROPOSE_MEMORY:
      return await proposeMemory(
        String(args.label || ""),
        String(args.content || ""),
        String(args.type || "CONTEXT"),
        (args.tags as string[]) || [],
      );
    case McpToolName.APPROVE_PROPOSAL:
      return await approveProposal(String(args.node_id || ""));
    case McpToolName.REJECT_PROPOSAL:
      return await rejectProposal(String(args.node_id || ""));
    case McpToolName.INCREMENT_EFFICACY:
      return await incrementEfficacy(String(args.node_id || ""));
    case McpToolName.LIST_NODES:
      return await listNodes();
    case McpToolName.INIT_BETTER_AUTH:
      return initBetterAuth(
        String(args.db_type || ""),
        (args.auth_methods as string[]) || [],
        String(args.project_path || "."),
      );
    case McpToolName.INDEX_REPOSITORY:
      return await indexRepository(
        String(args.repo_path || ""),
        args.repo_name ? String(args.repo_name) : undefined,
      );
    case McpToolName.QUERY_REPOSITORY_INDEX:
      return await queryRepositoryIndex(
        String(args.repo_name || ""),
        args.file_path ? String(args.file_path) : undefined,
      );
    case McpToolName.FETCH_ONLINE_DOCS:
      return await fetchOnlineDocs(String(args.query || ""));
    case McpToolName.ANALYZE_LLMS_TXT:
      return analyzeLlmsTxt(String(args.content || ""));
    case McpToolName.ANALYZE_CONTEXT_HEALTH:
      return analyzeContextHealth(
        String(args.context_file_path || ""),
        Number(args.token_limit || 128000),
      );
    case McpToolName.CALCULATE_CONTEXT_BUDGET:
      return calculateContextBudget(
        Number(args.system_tokens || 2000),
        Number(args.tools_tokens || 1500),
        Number(args.docs_tokens || 3000),
        Number(args.history_tokens || 5000),
        Number(args.buffer_percentage || 0.15),
      );
    case McpToolName.LIST_WRITING_STYLES:
      return listWritingStyles();
    case McpToolName.EXTRACT_WRITING_STYLE:
      return extractWritingStyle(
        String(args.style_name || ""),
        Boolean(args.output_json),
      );
    case McpToolName.ANALYZE_DISTILLATION_SOURCES:
      return analyzeDistillationSources((args.sources as string[]) || []);
    case McpToolName.GENERATE_DESIGN_SYSTEM_RECOMMENDATION:
      return generateDesignSystemRecommendation(
        String(args.query || ""),
        String(args.project_name || ""),
        String(args.format_type || "markdown"),
      );
    case McpToolName.GENERATE_AI_ART:
      return generateAiArt(
        String(args.concept || ""),
        String(args.mode || "search"),
        String(args.aspect_ratio || "16:9"),
      );
    case McpToolName.SEARCH_AI_ART_PROMPTS:
      return searchAiArtPrompts(
        String(args.query || ""),
        String(args.category || "all"),
        Number(args.limit || 5),
      );
    default:
      throw new Error("Unknown tool: " + name);
  }
}
