# Changelog

All notable changes to this project will be documented in this file.

## feat/combine_portal_mcp

### Overview

- Merged `synapse-mcp` directly into `synapse-portal`, eliminating Python virtual environments and establishing a unified TypeScript Model Context Protocol (MCP) server architecture with direct Prisma ORM access, dual SSE/HTTP API endpoints, and a standalone Stdio CLI runner.

### BUSINESS LOGIC

- Migrated knowledge management tools (`query_memory`, `propose_memory`, `approve_proposal`, `reject_proposal`, `increment_efficacy`, `list_nodes`) from Python `urllib` HTTP calls to direct internal database queries via Prisma and `knowledgeService`, reducing request latency and eliminating cross-process network hops.
- Re-implemented all supporting developer and designer skills logic in native TypeScript:
  - `better_auth`: Generates full Better Auth TypeScript configuration and updates `.env` files.
  - `context_analyzer`: Evaluates token budgets, context degradation, attention distribution, and risk scoring.
  - `docs_seeker`: Queries context7.com and analyzes `llms.txt` structures.
  - `copywriting`: Analyzes writing style templates, metrics, and structural formats.
  - `distillator`: Assesses source document token loads, document types, and fan-out routing recommendations.
  - `design_system`: Performs BM25-style search over curated UI/UX CSV datasets.
  - `ai_artist`: Searches and synthesizes prompt engineering templates for image models.
  - `repo_indexer`: Queries and synchronizes code symbols and dependency graphs.

### IMPACT

- Developers and AI agents now only need a single service (`synapse-portal`) without requiring Python, `.venv`, or `fastmcp` dependencies installed on the system.
- Build and packaging times for Antigravity plugins are substantially faster and free from OS-specific Python environment setup failures.

### NEW FEATURES

- Added native MCP server registry in `synapse-portal/mcp/server.ts` utilizing `@modelcontextprotocol/sdk` and `zod`.
- Added App Router MCP endpoints in `synapse-portal/app/api/mcp/route.ts`, `app/api/mcp/sse/route.ts`, and `app/api/mcp/messages/route.ts` supporting standard JSON-RPC tool discovery and Server-Sent Events (SSE) streaming (`serverUrl` remote transport).
- Added standalone Stdio runner in `synapse-portal/scripts/mcp_server.ts` for local IDEs and CLI agents.

### BUG FIXES

- Fixed MCP SSE endpoint URL generation in `synapse-portal/app/api/mcp/sse/route.ts` by using relative URLs instead of internal container host addresses, preventing `Endpoint origin does not match connection origin` and connection failures across container port mappings.
- Added HTTP POST dispatch support directly to `synapse-portal/app/api/mcp/sse/route.ts` to support both Streamable HTTP/POST transports and Server-Sent Events (SSE).
- Fixed missing `tools/list`, `prompts/list`, and notification routing in `synapse-portal/app/api/mcp/messages/route.ts` when communicating over SSE stream.
- Fixed MCP server startup failure (`MODULE_NOT_FOUND: Cannot find module '@/mcp/server'`) when launched via CLI/Antigravity from arbitrary working directories by switching to relative imports (`../mcp/server`, `../../lib/db`) in `scripts/mcp_server.ts` and `mcp/**` services, and passing `--tsconfig` in `build_antigravity_plugin.ts`.

### IMPROVEMENTS

- Restructured MCP layer from `synapse-portal/lib/mcp` into top-level modular domain folders under `synapse-portal/mcp/` (`ai_artist`, `better_auth`, `context_analyzer`, `copywriting`, `design_system`, `distillator`, `docs_seeker`, `memory`, `repo_indexer`).
- Replaced the legacy `index_repo.py` Python AST parser and templates with a native high-performance TypeScript parser (`mcp/repo_indexer/parser.ts`), achieving 100% pure TypeScript codebase without any Python runtime dependencies.
- Created `McpToolName` enum (`mcp/enums.ts`), central tool dispatcher (`mcp/handler.ts`), and manifest definitions (`mcp/manifest.ts`), completely decoupling API endpoints (`app/api/mcp/route.ts`, `app/api/mcp/messages/route.ts`) into lightweight routers.
- Standardized file structure across all tool directories using concise, unified conventions: `schema.ts` (Zod schemas), `service.ts` (business logic), `service.test.ts` (unit tests), `service.spec.ts` (real DB integration specs), and `index.ts` (MCP tool registration using `McpToolName`).
- Added real PostgreSQL integration spec tests (`mcp/memory/service.spec.ts`, `mcp/repo_indexer/service.spec.ts`) and added `"test:spec"` command to `package.json`.
- Co-located schemas (`schema.ts`), services (`service.ts`), MCP registrations (`index.ts`), asset dependencies (`data/`), unit tests (`service.test.ts`), and DB specs (`service.spec.ts`) within each tool directory.
- Completely removed legacy `synapse-mcp` Python directory, `.ruff_cache`, and `.pytest_cache`, making the repository a pure TypeScript ecosystem.
- Cleaned up redundant legacy HTTP REST APIs (`/api/context/export`, `/api/propose`, `/api/nodes/efficacy`, `/api/nodes`, `/api/edges`, `/api/stats`, `/api/indexer/ai/*`) that were previously only used as HTTP bridges for Python.
- Updated `.github/workflows/ci.yml` and `Makefile` to remove Python test/lint jobs and outdated file references.
- Updated plugin packaging script `synapse-portal/scripts/build_antigravity_plugin.ts` to automatically wire the TypeScript MCP server runner and eliminate Python virtualenv bootstrapping.
- Replaced subshell `execSync` manifest generator invocation with direct in-process function execution in `build_antigravity_plugin.ts` for instant, non-blocking manifest generation.
- Added comprehensive unit test suite in `synapse-portal/tests/mcp/` and `synapse-portal/mcp/**/` with 100% test pass rate and full coverage tracking.

### DEPENDENCIES

- Added `@modelcontextprotocol/sdk` and `zod` to `synapse-portal/package.json`.

## main

### Overview

- Restructured code analysis and security auditing skills into a unified `synapse-code-scan` Master Skill suite with specialized sub-skills for SonarQube inspection, Trivy image scanning, vulnerability remediation, and container hardening.

### NEW FEATURES

- Introduced the `synapse-code-scan` Master Skill in `synapse-plugin/.agents/skills/synapse-code-scan/SKILL.md` to coordinate static analysis, security scans, and remediation workflows.
- Added `synapse-sonarqube-scan` sub-skill in `references/sonarqube-scan/SKILL.md` providing automated workflows for local SonarQube Docker setup, scan execution, and SonarQube MCP tool integrations (`search_sonar_issues_in_projects`, `get_project_quality_gate_status`, `search_security_hotspots`, `change_sonar_issue_status`).
- Added `synapse-trivy-scan` sub-skill in `references/trivy-scan/SKILL.md` tailored for production Dockerfile discovery, clean `--no-cache` builds with `:scan` tags, and unfiltered vulnerability audits.
- Added `synapse-vulnerability-remediation` sub-skill in `references/vulnerability-remediation/SKILL.md` covering language dependency patches (npm, pip, poetry, go) and OS-level package upgrades inside Dockerfiles.
- Added `synapse-container-hardening` sub-skill in `references/container-hardening/SKILL.md` defining multi-stage build standards, non-root user execution, and verification loops.

### CONFIGURATION CHANGES

- Added `SYNAPSE_SONARQUBE_PORT` support in `render_config.ts`, generating a dedicated `[sonarqube]` table in `config.toml` for configurable local SonarQube port mapping and host routing.

### IMPROVEMENTS

- Replaced standalone `synapse-security-check` with the comprehensive `synapse-code-scan` suite.
- Promoted `synapse-party-mode` skill from a nested sub-skill of `synapse-agent-coordination` to a top-level skill in `synapse-plugin/.agents/skills/synapse-party-mode/SKILL.md`.
- Updated `synapse-plugin/.agents/skills/synapse-agent-coordination/SKILL.md` to remove the nested sub-skill entry for Party Mode.
- Removed all hardcoded absolute `file:///Users/...` paths in `SKILL.md` files across all skills and replaced them with relative paths.
- **Updated Changelog Rule (`changelog-guidelines.md` & `AGENTS.md`)**:
  - Enforced strict changelog location: `CHANGELOG.md` must always be placed directly at the root folder co-located with `.git` of the modified target repository. In multi-repo/monorepo/submodule setups, changelogs are never placed in non-git parent/wrapper directories.
  - Added support for direct commits on base branches (`develop`, `main`, `master`) requiring date-stamped headings (e.g. `## develop - YYYY/MM/DD`) to prevent distinct daily tasks from blending into a single block.
- **Updated Context & Tool Resolution Rule (`context-enforcement.md`)**: Enforced explicit 3-tier MCP resolution hierarchy prioritizing dedicated domain MCPs (e.g. Asana MCP, SonarQube MCP) -> Browser/DevTools MCP -> fallback to raw HTTP/CLI.
- Added BMAD Method attribution to `README.md` under the Acknowledgements section to credit their open-source AI development workflows and role-based structures.
- Created a global project `LICENSE` file under the MIT License, incorporating the required third-party MIT License copyright notice for BMAD Method components.

## feat/skill_pixel_art

### NEW FEATURES

- Added background removal capability to the `slice_spritesheet_to_gifs` tool, which automatically detects the background color from the top-left pixel `(0, 0)` and keys it out.
- Automated state frame mapping inside `slice_spritesheet_to_gifs` by removing the manual `states` parameter and automatically compiling all grid frames into a clean animated GIF named after the source file's base name.

### IMPROVEMENTS

- Integrated the smart dynamic bounding-box slicing and customized frame selection directly into the `slice_spritesheet_to_gifs` MCP tool on the `synapse-portal` server, introducing `smart_slice` and `select_frames` parameters.
- Added a **Frame Boundaries and Padding (Prevent Clipping)** guideline to `SKILL.md` to ensure the generated characters remain perfectly centered with generous safety margins, preventing limbs, weapons, or special effects from spilling over cell boundaries or being cut off during slicing.
- Updated `pixel-art-sprites` skill guidelines in `SKILL.md` to strongly enforce single-row layouts, preventing AI models from generating multi-row grids, and updated the prompt template to explicitly forbid vertical stacking or grid configurations (such as 2x2 or 3x3 grids).
- Updated `pixel-art-sprites` skill guidelines in `SKILL.md` to enforce a single uniform background color (preferably pure green `#00ff00` or magenta `#ff00ff`) and visual consistency via base-state reference images when generating subsequent animation states.
- Enhanced the visual consistency rules in `SKILL.md` by defining a **strict prompt template** format to keep character core descriptions (armor, clothing, weapons, colors) 100% identical and verbatim across all generation prompts.
- Added a guideline to `SKILL.md` for handling 429 errors, enforcing that the agent must report the error and ask for user permission before switching to MCP tools.

### CONFIGURATION CHANGES

- Added `Pillow` dependency to `synapse-mcp/requirements.txt` to resolve `ModuleNotFoundError: No module named 'PIL'` during startup of the `synapse-portal` MCP server.
