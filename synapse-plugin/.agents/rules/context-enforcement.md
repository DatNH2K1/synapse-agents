# Context Loading & Enforcement Rules (Delayed/Lazy Loading)

All agents MUST strictly follow this context loading and activation protocol:

### 1. Mandatory Context Load (Delayed/Lazy Loading)

Execute steps A→D in order ONLY when a specific task (code) is initiated AND a specific requirement/story is provided. Do NOT load project-specific context during the initial greeting or when only a command code is selected without a requirement.

- **A — Determine working repo:** Identify the active project slug (e.g., `example-frontend` or `example-backend`) from the user's request. If ambiguous or missing context, ask: _"Which project and what is the specific task?"_
- **B — Read project docs (PRIORITY SOURCE):** Read ONLY `docs/development.md` and `docs/project-structure.md` in the working repo root. Do NOT read all `docs/*.md`. Information already covered in these docs must NOT be duplicated into the Knowledge Portal unless explicitly requested.
- **C — Load Context via Knowledge Portal:** Execute JIT Grounding by invoking the `synapse-memory` skill. Read `skills/synapse-memory/SKILL.md` for exact instructions and commands.
- **D — Repository Indexing & AST Scan:** Invoke the `index_repository` MCP tool on the working repository directory. This builds/updates the AST dependency tree in the Synapse Portal database, enabling precise code navigation, dependency analysis, and semantic queries instead of searching files manually.

### 2. Enforcement Gatekeeper

Before loading ANY project file or initiating a sub-skill workflow, you MUST verify:

1. A command code (e.g., QD, DS) has been selected.
2. **AND** a specific requirement, story ID, or intent description has been provided in the same or subsequent message.
3. **AND** all context-specific lessons (Step C) and repository indexes (Step D) have been loaded and acknowledged.

If only a command code is provided, you **MUST NOT** load context. Instead, you must ask: _"I have received the [CODE] command. Please provide the specific requirement or story ID to proceed."_ Loading project context, indexing the repository, or sub-skill configs prematurely is a **VIOLATION** of this workflow.

### 3. Agent Activation Protocol

- **Load System Configuration (MANDATORY):** First, read the `CLAUDE.md` file from the Synapse installation root (the directory containing the skill's plugin repository) to load core system workflow and defaults. Then, read the `CLAUDE.md` file in the current project's root directory (if it exists) to load project-specific overrides.
- **Greet and Present Capabilities:** Greet `{user_name}` warmly by name, always speaking in `{communication_language}` and applying your persona throughout the session. Present the capabilities table from the agent's definition. **STOP and WAIT for user input** — Do NOT execute menu items automatically.
- **Capability Invocation:** When the user responds with a code, line number, or skill, check for the requirement. If missing, ask for it. Only then, invoke the exact registered skill by its exact name. DO NOT invent capabilities on the fly.

### 4. Mandatory Memory Lifecycle & Execution Flow

Agents MUST strictly execute the memory lifecycle workflows across all task phases:

1. **Initiation Phase (READ / JIT Grounding)**:
   - Immediately query the Knowledge Portal using `query_memory` with appropriate tags (`project:<name>`, `agent:<name>`, `technology:<name>`) to retrieve lessons, conventions, and design context before starting any file modifications.
2. **Implementation Phase (EFFICACY Tracking)**:
   - If a retrieved memory node directly helps solve or guide the implementation, the agent MUST immediately invoke `increment_efficacy` with the node's UUID to record its practical success.
3. **Completion Phase (WRITE / Propose Memory)**:
   - At the end of a sprint, story, or task, the agent MUST evaluate if there is any new reusable lesson, design pattern, or feature architecture.
   - If yes, propose it using `propose_memory` in English with correct tags and section scopes (`section:<name>`, `project:<name>`). Do not record minor/trivial changes.

### 5. Prioritize MCP Over CLI for Code Discovery

When searching for files, classes, routes, or code modules, agents MUST prioritize querying and reading through MCP tools (such as `query_repository_index`, `query_memory`, or `list_nodes`) first:

1. **Search scanned files**: Use `query_repository_index` to find files, dependencies, dependents, or AST symbols that were scanned by `index_repository`.
2. **Fallback to CLI**: Only when the target information is not indexed, is not found, or is insufficient in the MCP database, should the agent fall back to using local CLI search tools (such as `grep`, `find`, or manual workspace directory listing).
