# Module: Agent Catalog, Persona Profiles & System Settings

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: Agent Catalog & Personas (`/agents`)

### A. UI Elements & Action Matrix

| Element Name                   | Component Type                    | Visibility / Conditions            | Interaction & Business Flow                                                                                                                                                                                                                           |
| :----------------------------- | :-------------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Roster Cards**         | Interactive 3D Cards (`TiltCard`) | Always visible                     | Renders all loaded agent personas (Analyst, Architect, Creative, CTO, Game Dev, Mobile Dev, PM, QA, Tech Writer, User Advocate, Web Dev) with avatar, title, and capability chips.                                                                    |
| **Agent Detail Modal**         | Rich Dialog Modal                 | Opened upon clicking an agent card | Contains tabbed inspector: **Overview** (Identity, Communication style, Core principles), **System Protocols** (Compliance checklist, Gatekeeper rules, Context loading sequence), and **Capabilities & Tools** (Mapped capability codes and skills). |
| **User Personas Grid**         | Interactive Cards (`TiltCard`)    | Always visible                     | Renders cultural user personas with avatar, location, tech literacy score, description, cultural traits, and specific pain points.                                                                                                                    |
| **Persona Search & Filter**    | Search Bar & Region Pills         | Always visible                     | Filters user personas by search keyword or geographic region (`All`, `North America`, `Asia Pacific`, `Europe`, `Latin America`, `Middle East & Africa`).                                                                                             |
| **Technical Skills Directory** | Feature List Cards                | Always visible                     | Displays available master skills (`synapse-agent-coordination`, `synapse-code-scan`, `synapse-design-suite`, `synapse-development-suite`, `synapse-knowledge-suite`, `synapse-qa-and-security-suite`).                                                |
| **System Tools Directory**     | Terminal Card List                | Always visible                     | Displays registered system execution tools and MCP tool integrations.                                                                                                                                                                                 |

---

## 2. Screen: System Settings (`/settings`)

### A. UI Elements & Action Matrix

| Element Name                    | Component Type               | Visibility / Conditions | Interaction & Business Flow                                                                                                                                       |
| :------------------------------ | :--------------------------- | :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Settings Tab Navigator**      | Tab Switcher                 | Always visible          | Switches between **Identity Profile**, **Agent Co-Pilot & AI Infrastructure**, and **Tag Appearance**.                                                            |
| **Identity Card**               | Profile Card                 | Visible on Profile Tab  | Displays configured user name (`user_name`) and local instance authorization state.                                                                               |
| **AI Infrastructure Status**    | Status Matrix                | Visible on Profile Tab  | Displays active Gemini AI model name, embedding model (`gemini-text-embedding-004`), and API token status for Stitch, Context7, and Gemini.                       |
| **Brain Connectivity**          | Status Card                  | Visible on Profile Tab  | Shows PostgreSQL + `pgvector` engine status and atomic commit configuration.                                                                                      |
| **REM Sleep Mode Switch**       | Toggle Switch                | Visible on AI Tab       | Updates `rem_mode_enabled` in `SystemConfig` (`true`/`false`). Controls automated background sleep cycle consolidation.                                           |
| **Forget Mode Switch**          | Toggle Switch                | Visible on AI Tab       | Updates `forget_mode_enabled` in `SystemConfig` (`true`/`false`). Enables memory decay loops for inactive knowledge nodes.                                        |
| **Forget Dry Run Switch**       | Toggle Switch                | Visible on AI Tab       | Updates `forget_dry_run_enabled` in `SystemConfig` (`true`/`false`). Simulates decay calculations in logs without destructive DB tier changes.                    |
| **Similarity Threshold Slider** | Range Slider ($0.00 - 1.00$) | Visible on AI Tab       | Sets `rem_similarity_threshold` (default $0.85$). Nodes above this score require comparison/review.                                                               |
| **Confidence Threshold Slider** | Range Slider ($0.00 - 1.00$) | Visible on AI Tab       | Sets `rem_confidence_threshold` (default $0.90$). Proposals above this score are automatically consolidated into merge candidates.                                |
| **Tag Appearance Palette**      | Color Picker List            | Visible on Tags Tab     | Lists all database tags with scope and version. Clicking color indicator opens native color picker and calls `POST /api/visual-config` to persist hex color code. |

### B. Business & User Flows

#### Flow 2.1: Dynamic Configuration Update

1. Admin user modifies a toggle switch or threshold slider on `/settings`.
2. UI performs optimistic state update and dispatches `POST /api/system-config` with `{ key, value }`.
3. Backend updates `SystemConfig` table in PostgreSQL.
4. Next.js router refreshes data smoothly.
