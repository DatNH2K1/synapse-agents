# Service / Worker: Model Context Protocol (MCP) Cognitive Gateway

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Trigger & Scheduling Matrix

| Process / Job Name              | Trigger Mechanism         | Frequency / Event Source                             | Idempotency Key / Lock |
| :------------------------------ | :------------------------ | :--------------------------------------------------- | :--------------------- |
| **MCP Server Info & Handshake** | HTTP GET / JSON-RPC       | `GET /api/mcp` or `POST /api/mcp` (`initialize`)     | Client Session ID      |
| **MCP Tool Listing**            | JSON-RPC 2.0              | `POST /api/mcp` (`tools/list`)                       | Stateless              |
| **MCP Tool Execution**          | JSON-RPC 2.0 / SSE Stream | `POST /api/mcp` (`tools/call`) or `GET /api/mcp/sse` | Request UUID / Node ID |

---

## 2. Business Flow & Tool Capabilities Matrix

### A. Supported MCP Tools Catalog

| Tool Name                                   | Scope & Domain       | Parameters                                                                            | Output & Business Impact                                                          |
| :------------------------------------------ | :------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| **`query_memory`**                          | Long-term Knowledge  | `tags: string[]`                                                                      | Returns relevant approved knowledge nodes and active project lessons.             |
| **`propose_memory`**                        | Long-term Knowledge  | `label: string`, `content: string`, `tags: string[]`                                  | Creates a new knowledge node in `PENDING` status for Gate review.                 |
| **`approve_proposal`**                      | The Gate             | `node_id: string`                                                                     | Promotes proposal to `APPROVED` / `BETA` tier.                                    |
| **`reject_proposal`**                       | The Gate             | `node_id: string`                                                                     | Rejects proposal to `REJECTED` status.                                            |
| **`increment_efficacy`**                    | Reinforcement        | `node_id: string`                                                                     | Increments `success_count` by 1 and updates `last_verified`.                      |
| **`list_nodes`**                            | Knowledge Directory  | None                                                                                  | Lists all active/approved nodes and their metadata.                               |
| **`init_better_auth`**                      | Developer Experience | `db_type: string`, `auth_methods: string[]`, `project_path?: string`                  | Scaffolds `auth.ts` and updates `.env` with Better-Auth templates.                |
| **`index_repository`**                      | Code Intelligence    | `repo_path: string`, `repo_name?: string`                                             | Builds AST dependency graph and symbol tables for the target repository.          |
| **`query_repository_index`**                | Code Intelligence    | `repo_name: string`, `file_path?: string`                                             | Fetches dependency and symbol information for a specific file.                    |
| **`fetch_online_docs`**                     | Documentation        | `query: string`                                                                       | Fetches live documentation and `llms.txt` specifications from context7.com.       |
| **`analyze_llms_txt`**                      | Documentation        | `content: string`                                                                     | Analyzes and prioritizes documentation URLs from `llms.txt`.                      |
| **`analyze_context_health`**                | Context Management   | `context_file_path: string`, `token_limit?: number`                                   | Calculates token breakdown and assesses degradation risk.                         |
| **`calculate_context_budget`**              | Context Management   | `system_tokens`, `tools_tokens`, `docs_tokens`, `history_tokens`, `buffer_percentage` | Returns recommended token quota allocation.                                       |
| **`list_writing_styles`**                   | Copywriting          | None                                                                                  | Lists available writing style templates in `assets/writing-styles/`.              |
| **`extract_writing_style`**                 | Copywriting          | `style_name: string`, `output_json?: boolean`                                         | Extracts voice, tone, rhythm, and sentence structures from style templates.       |
| **`analyze_distillation_sources`**          | Distillation         | `sources: string[]`                                                                   | Validates and extracts knowledge from raw text and Markdown sources.              |
| **`generate_design_system_recommendation`** | Design Intelligence  | `query: string`, `project_name?: string`, `format_type?: string`                      | Generates UX reasoning, color palettes, typography, and React component guidance. |
| **`generate_ai_art`**                       | Visual Intelligence  | `concept: string`, `mode?: string`, `aspect_ratio?: string`                           | Generates optimized prompts with lighting, style, and platform parameters.        |
| **`search_ai_art_prompts`**                 | Visual Intelligence  | `query: string`, `category?: string`, `limit?: number`                                | Searches curated CSV prompt templates for artistic patterns.                      |

---

## 3. Communication Protocols

1. **Standard HTTP JSON-RPC 2.0**: Dispatched via `POST /api/mcp` with standard JSON-RPC envelope (`{ "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "...", "arguments": { ... } } }`).
2. **Server-Sent Events (SSE) Transport**: Streamed via `GET /api/mcp/sse` for continuous duplex agent interaction with session keep-alives.
