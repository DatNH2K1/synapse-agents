# Synapse Knowledge Portal MCP Server

This directory contains the Model Context Protocol (MCP) server for the **Synapse Knowledge Portal**.

## Directory Layout

- `synapse_mcp_server.py`: The FastMCP server code.
- `requirements.txt`: Python package dependencies.
- `.venv/`: The local virtual environment (auto-generated).

## Installation

1. Create a virtual environment using Python 3.11+ (from this folder):
   ```bash
   python3 -m venv .venv
   ```
2. Activate it and install dependencies:
   ```bash
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

---

## Configuration

Since MCP clients run outside the `synapse-mcp` directory context, you must use **absolute paths** to point to the server Python file and the virtual environment's Python executable.

To get the absolute path of your workspace parent folder:
1. Open a terminal at the project root (`synapse` folder).
2. Run:
   ```bash
   pwd
   ```
3. Copy the output path.
4. Replace `/<path-to-your-workspace>/synapse` with the copied path in the configurations below (i.e. replacing `/<path-to-your-workspace>/` with the parent directory path of `synapse`).

### 1. Claude Desktop
Add this block to your `claude_desktop_config.json` (typically at `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "synapse-portal": {
      "command": "/<path-to-your-workspace>/synapse/synapse-mcp/.venv/bin/python",
      "args": [
        "/<path-to-your-workspace>/synapse/synapse-mcp/synapse_mcp_server.py"
      ],
      "env": {
        "SYNAPSE_PORTAL_HOST": "http://localhost:3100",
        "CONTEXT7_API_KEY": "<your-context7-api-key>"
      }
    }
  }
}
```

### 2. Antigravity & Codex
Antigravity and Codex support both global and workspace-scoped configurations.

#### Workspace-Scoped Configuration (Recommended)
Create (or edit) a file at the root of your project directory: `.agents/mcp_config.json` and insert the configuration:

```json
{
  "mcpServers": {
    "synapse-portal": {
      "command": "/<path-to-your-workspace>/synapse/synapse-mcp/.venv/bin/python",
      "args": [
        "/<path-to-your-workspace>/synapse/synapse-mcp/synapse_mcp_server.py"
      ],
      "env": {
        "SYNAPSE_PORTAL_HOST": "http://localhost:3100",
        "CONTEXT7_API_KEY": "<your-context7-api-key>"
      }
    }
  }
}
```

#### Global Configuration
Add the same block into the global config file located at `~/.gemini/config/mcp_config.json`.

Alternatively, in the **Antigravity IDE Agent Panel**:
1. Click the **"..." (three dots)** menu.
2. Select **"Manage MCP Servers"**.
3. Choose **"View raw config"** and paste the server configuration block there.

---

## Exposed Tools

- **Memory Database**:
  - `query_memory(tags)`: Query knowledge nodes matching specific tags.
  - `propose_memory(label, content, type, tags)`: Propose a new LESSON, CONTEXT, or FEATURE node.
  - `approve_proposal(node_id)`: Approve a pending proposal.
  - `reject_proposal(node_id)`: Reject a pending proposal.
  - `increment_efficacy(node_id)`: Track success counts of applied lessons.
  - `list_nodes()`: List all active/approved nodes in the database.

- **Developer Capabilities**:
  - `init_better_auth(db_type, auth_methods, project_path)`: Initialize Better Auth configs.
  - `index_repository(repo_path, repo_name)`: Scan and build AST dependencies for a repository.
  - `fetch_online_docs(query)`: Search and fetch library/framework docs from `context7.com`.
  - `analyze_llms_txt(content)`: Categorize llms.txt URLs and get optimal agent distribution.
  - `analyze_context_health(context_file_path, token_limit)`: Analyze prompt context utilization & health.
  - `calculate_context_budget(...)`: Suggest token budget allocations.
  - `list_writing_styles()`: List available copywriting styles.
  - `extract_writing_style(style_name, output_json)`: Extract copywriting style characteristics.
  - `analyze_distillation_sources(inputs)`: Analyze files/directories for token sizes prior to distillation.
  - `generate_design_system_recommendation(...)`: Get colors/typo/layout recommendations for a UI concept.
  - `generate_ai_art(...)`: Generate images via Gemini GenAI using Nano Banana creative prompts.
  - `search_ai_art_prompts(...)`: Search curated art prompt templates database.
