---
name: synapse-memory
description: |-
  Submit and retrieve AI lessons via the Synapse Knowledge Portal. Uses a centralized API with mandatory section-based tagging. Core capability for all agents.

  MANDATORY: Execute when designing or managing memory layers, long-term memory sync, or state persistence for agents.

  Trigger immediately for:
    - agent memory
    - long-term memory sync
    - vector store state
    - persisted agent status

  DO NOT trigger for:
    - General database operations.
    - React component state management.
---

# synapse-memory

Manages AI lessons and project context via the **Synapse Knowledge Portal**. This skill is a standard capability for all Synapse agents, allowing them to record insights and retrieve Just-In-Time (JIT) context.

---

## When to Use

- Use when the user says **"record a lesson"**, **"update memory"**, **"add to lessons learned"**, or **"synapse-memory"**.
- Automatically invoked at the end of a sprint, complex story implementation, or task.
- Use to **retrieve** context when starting new features or debugging known issues.

### 🚫 When NOT to Record Anything

Do **NOT** record a knowledge node for:

- Minor refactorings or code tweaks (e.g., renaming classes, variables, or functions).
- Small bug fixes or formatting updates.
- Simple, localized changes that have no architectural impact, safety implications, or reuse potential.
- Cluttering the database with localized implementation details.

### 📌 Node Type Selection Criteria

Only record when there is a significant, reusable insight or documentation requirement. Choose the type strictly according to these boundaries:

1. **`LESSON`**:
   - **Definition**: A rule, pattern, best practice, or anti-pattern to prevent future mistakes or maintain strict coding standards.
   - **Example**: Mandatory security headers, API route conventions, or a lesson learned from a major bug.
2. **`FEATURE`**:
   - **Definition**: Complete technical documentation of a newly shipped major feature, database schema, API design, or workspace integration.
   - **Example**: A newly implemented OAuth login flow, indexing job, or dashboard page structure.

3. **`CONTEXT`**:
   - **Definition**: High-level domain context, core architectural designs (ADRs), external API integration flows, or permanent system design guidelines.
   - **Example**: Overall system architecture, design rules for multi-agent execution, or business domain boundaries.

---

## 🛡️ GUARDRAILS & USAGE POLICY (MANDATORY FOR ALL AGENTS)

To prevent cross-project context contamination, all agents MUST follow these rules when using `synapse-memory`:

1. **Zero Assumption Rule**: Never assume the project name (e.g., `project:synapse-portal`) from history or previous sessions.
2. **Workspace Verification**: Before executing `query.py`, inspect the active workspace paths. If multiple projects are open (e.g., `synapse`), you MUST confirm the target project with the user.
3. **Explicit Scoping**: All queries and records MUST include the `project:<name>` tag AND the calling agent's tag (e.g., `agent:synapse-agent-web-dev`):
   - The agent tag value **MUST** be the canonical agent folder name (e.g., the directory name under `agents/`, or the `name` column in [agent-manifest.csv](../../manifests/agent-manifest.csv)), NOT the persona display name.
   - Refer to [agent-manifest.csv](../../manifests/agent-manifest.csv) to retrieve the list of valid agents.
   - **CRITICAL**: Orchestrators/modes (such as `synapse-party-mode` or `party-mode`) are NOT agents and MUST NEVER be used as the agent tag value.
   - When recording lessons during Party Mode, the node MUST be tagged with the specific agent who contributed the insight (e.g., `agent:synapse-agent-architect`), not the orchestrator/mode.
4. **Context Grounding**: Only apply retrieved knowledge that explicitly matches the current active workspace.

---

## Tag Definitions & Conventions

To ensure consistent retrieval, all tags **MUST** follow the `scope:value` format. There are **NO OTHER** allowed tag formats.

### Allowed Scopes

| Scope        | Definition                                                                                                                                                                             | Example                       | Requirement Level                                                 |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------- | :---------------------------------------------------------------- |
| `section`    | Mandatory category for lessons (defines where it appears in the Portal).                                                                                                               | `section:mistakes-to-avoid`   | **Required** for `LESSON` type, N/A/Optional for other types.     |
| `project`    | Links knowledge to a specific repository or project name.                                                                                                                              | `project:synapse-portal`      | **Required** for project-specific nodes (unless `global` is set). |
| `global`     | Sets global-wide visibility, making the knowledge node accessible across all projects.                                                                                                 | `global:global`               | **Required** if `project` scope is NOT provided.                  |
| `technology` | Defines the tech stack or library related to the insight.                                                                                                                              | `technology:react@18`         | **Optional**.                                                     |
| `agent`      | Identifies the agent who generated or is most relevant to the insight. Value **MUST** be the **agent folder name** (e.g. the directory under `agents/`), NOT the persona display name. | `agent:synapse-agent-web-dev` | **Optional/Recommended**.                                         |

### Naming Rules

- **Kebab-case only**: Use `lowercase-words-separated-by-hyphens`.
- **No spaces**: Never use spaces within a tag.
- **No uppercase**: Always use lowercase to avoid case-sensitivity issues.
- **Format**: `scope:value` ONLY (with optional `@version` suffix for the `technology` scope, e.g. `technology:react@18`).
- **`agent` tag value = folder name**: Always use the skill folder name (e.g. `synapse-agent-web-dev`), never the persona's first name (e.g. ~~`amelia`~~). The folder name is the canonical identifier stored in the Portal.

---

## 🛡️ MCP ENVIRONMENT & SETUP POLICY

All operations (read, write, efficacy) are conducted exclusively via the `SynapsePortal` MCP tools.

> [!WARNING]
> **MCP Availability Rule**: If the `SynapsePortal` MCP server or its tools (`query_memory`, `propose_memory`, `increment_efficacy`, `list_nodes`, `approve_proposal`, `reject_proposal`) are not configured or are unavailable in the current environment:
>
> 1. Do **NOT** attempt to run any local Python CLI scripts or direct database operations.
> 2. Output a warning to the user: `⚠️ Warning: SynapsePortal MCP server is not configured or available. Skipping knowledge node action.`
> 3. Gracefully **skip** the memory read/write step and continue with the rest of the task execution.

---

## PORTAL WRITE Workflow

All lessons are proposed to the Portal using the `SynapsePortal` MCP server (`propose_memory` tool).

> [!IMPORTANT]
> **English Language Rule**: All proposed nodes, including their title (`label`) and markdown content (`content`), **MUST** be written in **English** only. This ensures a standardized, globally searchable knowledge base, even if the developer's conversation is in another language (e.g. Vietnamese).

### Step 1 — Formulate Payload / Arguments

Construct the knowledge node arguments following this schema:

- **label**: Short descriptive title (string).
- **type**: One of `LESSON`, `CONTEXT`, or `FEATURE`.
- **content**: Detailed explanation/markdown content of the node.
- **tags**: List of strings (e.g. `["section:optimized-techniques", "project:synapse-portal"]`).

### Step 2 — Mandatory Section Tags

Every proposal **MUST** include exactly one of the following section tags in the `tags` list. All tags **MUST** follow kebab-case (lowercase, hyphen-separated):

- `section:specialized-conventions`
- `section:optimized-techniques`
- `section:mistakes-to-avoid`
- `section:user-personals`

### Step 3 — Submit to Portal

Use the **`propose_memory`** MCP tool to submit the knowledge node:

```json
{
  "label": "Colocate Server Actions",
  "type": "LESSON",
  "content": "Always co-locate server actions with their form components to improve maintainability.",
  "tags": ["section:optimized-techniques", "technology:nextjs"]
}
```

---

## PORTAL EFFICACY Workflow

To track which lessons are most effective, the Portal tracks a `success_count` for each node. When an agent or user successfully applies a lesson in their work, they should increment its efficacy count.

### Execute Efficacy Tracking

Use the **`increment_efficacy`** MCP tool by providing the node's UUID:

```json
{
  "node_id": "1992455f-5d0b-4b2c-9d30-927bc5161894"
}
```

---

## PORTAL READ Workflow (JIT Grounding)

To retrieve context, use the automated query methods. This is a **MANDATORY** step when starting new features or exploring unknown codebases.

### Step 1 — Filtering Strategy

Construct your query using specific tags to narrow down the context:

- **Agent Context**: Use `agent:<folder-name>` — the skill folder name, e.g. `agent:synapse-agent-web-dev` (NOT `agent:amelia`).
- **Project Context**: Use `project:<name>` (e.g., `project:synapse-portal`).
- **Tech Context**: Use `technology:<name>` or `technology:<name>@<version>` depending on query breadth:
  - **Omit version** for broad retrieval across all versions: `technology:nextjs`
  - **Include version** to pin to a specific major release: `technology:nextjs@15`, `technology:react@18`
  - Version follows the `@` suffix as defined in the `technology` scope (e.g. `technology:tailwindcss@4`). Always use the same format as the tag was recorded with.

### Step 2 — Execute Query

Use the **`query_memory`** MCP tool to retrieve context:

```json
{
  "tags": ["project:synapse-portal", "technology:nextjs"]
}
```

> [!NOTE]
>
> - Multiple tags act as an **OR** filter (returns nodes matching _any_ of the tags).

- All tags must follow the **kebab-case** convention and `scope:value` format.

### Step 3 — Apply Context

Retrieved content **MUST** be reviewed and integrated into your reasoning. This prevents regressions and ensures adherence to established patterns.

---

## Additional Portal Admin Tools

When using MCP, the following administrative tools are also available:

- **`list_nodes`**: List all active/approved knowledge nodes currently present in the Synapse Knowledge Portal.
- **`approve_proposal(node_id: str)`**: Approve a pending knowledge proposal in the Portal.
- **`reject_proposal(node_id: str)`**: Reject a pending knowledge proposal in the Portal.

---

## Example Interactions

**User:** "Record a lesson: never hardcode tenant IDs in project-alpha."
→ **Action:** Propose via the MCP tool.

- **MCP Tool `propose_memory`**:
  ```json
  {
    "label": "Tenant IDs",
    "type": "LESSON",
    "content": "Never hardcode tenant IDs in project-alpha.",
    "tags": ["section:mistakes-to-avoid", "project:project-alpha"]
  }
  ```

**User:** "Document the finished Auth feature for this project."
→ **Action:** Propose via the MCP tool.

- **MCP Tool `propose_memory`**:
  ```json
  {
    "label": "Auth System",
    "type": "FEATURE",
    "content": "Implemented Better Auth with Google and GitHub providers...",
    "tags": ["project:synapse-portal", "technology:next-js"]
  }
  ```

**User:** "Save the current project architecture context."
→ **Action:** Propose via the MCP tool.

- **MCP Tool `propose_memory`**:
  ```json
  {
    "label": "Micro-file Architecture",
    "type": "CONTEXT",
    "content": "Project uses micro-file architecture for workflows to ensure atomic execution...",
    "tags": ["project:synapse-portal", "type:architecture"]
  }
  ```

**User:** "What have we learned about Ant Design?"
→ **Action:** Query via the MCP tool.

- **MCP Tool `query_memory`**:
  ```json
  {
    "tags": ["technology:antd"]
  }
  ```
  → **Present:** Summarize the returned knowledge nodes for the user.

**User:** "Check my (Amelia) specialized conventions for this project."
→ **Action:** Query via the MCP tool.

- **MCP Tool `query_memory`**:
  ```json
  {
    "tags": [
      "agent:synapse-agent-web-dev",
      "project:synapse-portal",
      "section:specialized-conventions"
    ]
  }
  ```
  → **Present:** List and apply the conventions to the current task.

> [!IMPORTANT]
> The `agent:` tag value is always the **agent folder name** (e.g. `synapse-agent-web-dev`), not the agent's persona name (e.g. ~~`amelia`~~). Check `agents/` for the exact folder name of each agent.
