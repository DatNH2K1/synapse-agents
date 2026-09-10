# Product Feature Catalog & Business Flow Specifications

> Comprehensive functional specification and living flow documentation for **Synapse Ecosystem** (`synapse-agents`, `synapse-portal`, `synapse-plugin`).

## 📌 Module Index

### 🖥️ User-Facing & Frontend Modules

| Module                             | Scope & Capabilities                                                                                                                                                           | Status   | Detailed Specification                                                                               |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :--------------------------------------------------------------------------------------------------- |
| **01. Landing & Portal Overview**  | Public Landing Page, Live Realtime Metrics, Overview Dashboard, Growth/Scope/Agent Charts, Knowledge Atlas Force Graph, i18n (EN/VI), Theme Switcher                           | `Stable` | [docs/features/01-landing-and-portal-overview.md](./docs/features/01-landing-and-portal-overview.md) |
| **02. The Gate (Memory Curation)** | Pending Proposals Queue, Compare & Merge Diff Modal, AI Synthesis Workflow, Evolution Timeline & Audit Log, Undo Reversal                                                      | `Stable` | [docs/features/02-the-gate-memory-curation.md](./docs/features/02-the-gate-memory-curation.md)       |
| **03. Dependency Graph Explorer**  | AST Codebase Explorer, Interactive 2D/3D Force Graph, Blast Radius / Impact Analysis, Orphan File Discovery, Folder Hierarchy Tree                                             | `Stable` | [docs/features/03-dependency-graph-explorer.md](./docs/features/03-dependency-graph-explorer.md)     |
| **04. Agent Catalog & Settings**   | 11 Agent Persona Inspector, Cultural User Personas Explorer, AI & DB Connectivity Status, REM Sleep / Forget Mode Controls, Similarity & Confidence Sliders, Tag Color Palette | `Stable` | [docs/features/04-agent-catalog-and-settings.md](./docs/features/04-agent-catalog-and-settings.md)   |

---

### ⚙️ Backend, Workers & Background Services

| Service / Worker                | Trigger & Execution Scope                                                                                                                                                            | Status   | Detailed Specification                                                                       |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------- |
| **05. REM Sleep Cycle Worker**  | 10-minute interval scheduler (`instrumentation.ts`), 24h consolidation cycle, vector similarity proposal clustering, memory decay loop, COLD crystal consolidation, 90-day GC        | `Stable` | [docs/features/05-rem-sleep-cycle-worker.md](./docs/features/05-rem-sleep-cycle-worker.md)   |
| **06. Codebase Indexer Engine** | TypeScript AST parser, MD5 change detection, symbol extraction (`class`, `function`, `variable`), import/export dependency resolution, topological blast radius analyzer             | `Stable` | [docs/features/06-codebase-indexer-engine.md](./docs/features/06-codebase-indexer-engine.md) |
| **07. MCP Cognitive Gateway**   | Model Context Protocol JSON-RPC 2.0 & SSE streaming server (`/api/mcp`), 16+ MCP tools covering memory querying, Better-Auth scaffolding, context budget analysis, AI art generation | `Stable` | [docs/features/07-mcp-cognitive-gateway.md](./docs/features/07-mcp-cognitive-gateway.md)     |
| **08. Realtime Event Pipeline** | Server-Sent Events stream (`/api/updates`), internal event emitter, instantaneous cross-client state sync and Next.js router refresh                                                 | `Stable` | [docs/features/08-realtime-event-pipeline.md](./docs/features/08-realtime-event-pipeline.md) |

---

### 🤖 Multi-Agent Orchestration & Intelligence Layer

| Suite / Subsystem                   | Capability & Architecture                                                                                                                                                                                                                     | Status   | Detailed Specification                                                                           |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------------------- |
| **09. Multi-Agent Roster & Skills** | 11 Specialized agent personas (Analyst, Architect, Creative, CTO, Game Dev, Mobile Dev, PM, QA, Tech Writer, User Advocate, Web Dev) & 6 Master Skills (Coordination, Code Scan, Design Suite, Dev Suite, Knowledge Suite, QA/Security Suite) | `Stable` | [docs/features/09-multi-agent-orchestration.md](./docs/features/09-multi-agent-orchestration.md) |
