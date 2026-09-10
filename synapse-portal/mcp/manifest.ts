import { McpToolName } from "./enums";

export interface McpToolManifestItem {
  name: McpToolName;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOLS_MANIFEST: McpToolManifestItem[] = [
  {
    name: McpToolName.QUERY_MEMORY,
    description: "Query knowledge nodes from the Synapse Knowledge Portal by tags.",
    inputSchema: {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" }, description: "Tags to filter by" },
      },
      required: ["tags"],
    },
  },
  {
    name: McpToolName.PROPOSE_MEMORY,
    description: "Propose a new knowledge node / lesson to the Synapse Knowledge Portal.",
    inputSchema: {
      type: "object",
      properties: {
        label: { type: "string", description: "Title of the lesson / knowledge node" },
        content: { type: "string", description: "Markdown content of the lesson" },
        tags: { type: "array", items: { type: "string" }, description: "Tags including mandatory section tag" },
      },
      required: ["label", "content", "tags"],
    },
  },
  {
    name: McpToolName.APPROVE_PROPOSAL,
    description: "Approve a pending knowledge proposal in the Synapse Knowledge Portal.",
    inputSchema: {
      type: "object",
      properties: { node_id: { type: "string" } },
      required: ["node_id"],
    },
  },
  {
    name: McpToolName.REJECT_PROPOSAL,
    description: "Reject a pending knowledge proposal in the Synapse Knowledge Portal.",
    inputSchema: {
      type: "object",
      properties: { node_id: { type: "string" } },
      required: ["node_id"],
    },
  },
  {
    name: McpToolName.INCREMENT_EFFICACY,
    description: "Increment the success count of a knowledge node.",
    inputSchema: {
      type: "object",
      properties: { node_id: { type: "string" } },
      required: ["node_id"],
    },
  },
  {
    name: McpToolName.LIST_NODES,
    description: "List all active/approved knowledge nodes.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: McpToolName.INIT_BETTER_AUTH,
    description: "Initialize Better Auth in a project by generating auth.ts and updating .env file.",
    inputSchema: {
      type: "object",
      properties: {
        db_type: { type: "string" },
        auth_methods: { type: "array", items: { type: "string" } },
        project_path: { type: "string" },
      },
      required: ["db_type", "auth_methods"],
    },
  },
  {
    name: McpToolName.INDEX_REPOSITORY,
    description: "Index a codebase/repository to build AST dependencies.",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: { type: "string" },
        repo_name: { type: "string" },
      },
      required: ["repo_path"],
    },
  },
  {
    name: McpToolName.QUERY_REPOSITORY_INDEX,
    description: "Query indexed files, symbols, dependencies, and dependents.",
    inputSchema: {
      type: "object",
      properties: {
        repo_name: { type: "string" },
        file_path: { type: "string" },
      },
      required: ["repo_name"],
    },
  },
  {
    name: McpToolName.FETCH_ONLINE_DOCS,
    description: "Fetch documentation (like llms.txt) for a given query or library from context7.com.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: McpToolName.ANALYZE_LLMS_TXT,
    description: "Analyze llms.txt content to extract URLs and prioritize them.",
    inputSchema: {
      type: "object",
      properties: { content: { type: "string" } },
      required: ["content"],
    },
  },
  {
    name: McpToolName.ANALYZE_CONTEXT_HEALTH,
    description: "Analyze the health, token utilization, and degradation risk of an agent's context.",
    inputSchema: {
      type: "object",
      properties: {
        context_file_path: { type: "string" },
        token_limit: { type: "number" },
      },
      required: ["context_file_path"],
    },
  },
  {
    name: McpToolName.CALCULATE_CONTEXT_BUDGET,
    description: "Calculate and suggest a context/token budget allocation.",
    inputSchema: {
      type: "object",
      properties: {
        system_tokens: { type: "number" },
        tools_tokens: { type: "number" },
        docs_tokens: { type: "number" },
        history_tokens: { type: "number" },
        buffer_percentage: { type: "number" },
      },
    },
  },
  {
    name: McpToolName.LIST_WRITING_STYLES,
    description: "List all available writing style template files inside assets/writing-styles/.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: McpToolName.EXTRACT_WRITING_STYLE,
    description: "Extract writing style characteristics from a style template file.",
    inputSchema: {
      type: "object",
      properties: {
        style_name: { type: "string" },
        output_json: { type: "boolean" },
      },
      required: ["style_name"],
    },
  },
  {
    name: McpToolName.ANALYZE_DISTILLATION_SOURCES,
    description: "Analyze source documents for distillation generator.",
    inputSchema: {
      type: "object",
      properties: { sources: { type: "array", items: { type: "string" } } },
      required: ["sources"],
    },
  },
  {
    name: McpToolName.GENERATE_DESIGN_SYSTEM_RECOMMENDATION,
    description: "Generate comprehensive design system recommendations based on UI concept.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        project_name: { type: "string" },
        format_type: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: McpToolName.GENERATE_AI_ART,
    description: "Generate optimized AI Art prompts for image generation models.",
    inputSchema: {
      type: "object",
      properties: {
        concept: { type: "string" },
        mode: { type: "string" },
        aspect_ratio: { type: "string" },
      },
      required: ["concept"],
    },
  },
  {
    name: McpToolName.SEARCH_AI_ART_PROMPTS,
    description: "Search the curated AI Art prompts database for matching templates.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  },
];
