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

- **Apply Coding Level (MANDATORY):** Read `{coding_level}` from the system configuration (`config.toml`). Invoke the `synapse-coding-level` skill with `{coding_level}` to apply the corresponding communication, code, and response format constraints. Prepend every response with the status block declaring the assumed coding level (e.g. `[Assumed Coding Level: Level 3 - Advanced]`).
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

### 5. Prioritize Dedicated MCP Tools & Hierarchy (CRITICAL)

When interacting with external services, web applications, or performing codebase discovery, agents MUST strictly follow this resolution hierarchy:

1. **Dedicated Domain MCP (First Priority)**:
   - Always search for and prioritize a specialized MCP server built for that specific service/platform (e.g., for Asana tasks/projects at `https://app.asana.com/`, use `asana_*` MCP tools like `asana_get_task_details`, `asana_get_project_tasks`; for SonarQube, use `sonar_*` MCP tools; for Knowledge Portal/AST, use `synapse-portal` MCP tools).
2. **General Browser/DevTools MCP (Second Priority)**:
   - If no dedicated MCP exists for the domain, or if the dedicated MCP does not support the required interactive operation (such as visual inspection, frontend DOM interaction, network interception, or live page debugging), fall back to general browser automation MCPs (e.g., `chrome-devtools-mcp` tools like `navigate_page`, `evaluate_script`, `click`, `take_screenshot`).
3. **HTTP API / Raw Script Fallback (Last Resort)**:
   - Only when neither a dedicated MCP nor a DevTools/Browser MCP is available or able to fulfill the requirement, fall back to executing raw HTTP requests (via `curl`, `fetch`, or scripts) or manual CLI work.

#### Code Discovery Priority:

- Use `query_repository_index` to find files, dependencies, dependents, or AST symbols scanned by `index_repository`.
- Fall back to local CLI search tools (`grep`, `find`, or manual workspace directory listing) only when the target information is not indexed or is insufficient in the MCP database.
