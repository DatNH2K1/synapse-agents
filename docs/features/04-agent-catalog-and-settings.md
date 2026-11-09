# Module: Agent Catalog & Settings

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: Agent Catalog (`/agents`)

### A. Actors & Business Objectives

- **Primary Actors**: Tech Leads, Project Managers, Software Engineers.
- **Business Goal**: Inspect the specialized competencies of the 11 AI agents in the project roster, review permitted tool suites, and explore cross-cultural user personas to validate empathetic multi-regional behavior.

### B. UI Elements & Business Action Matrix

| UI Element                 | Interaction Type      | Visibility / Conditions   | Business Behavior & Rules                                                                                                                                                            |
| :------------------------- | :-------------------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Roster Grid**      | Grid of Agent Cards   | Always visible            | Displays all 11 specialized agent personas (Business Analyst, Architect, Creative Innovator, CTO Advisor, Game Dev, Mobile Dev, PM, QA Hacker, Tech Writer, User Advocate, Web Dev). |
| **Persona Detail Drawer**  | Slide-out Sheet       | On clicking an Agent card | Inspects communication style guidelines, operational bounds, active coding levels, and authorized capability suites.                                                                 |
| **Cultural User Personas** | Persona Cards Sub-tab | Always visible            | Provides realistic simulated user archetypes (Japanese Enterprise, US Silicon Valley Startup, Vietnamese SME) to test prompt localization responses.                                 |

---

## 2. Screen: System Settings & Governance (`/settings`)

### A. UI Elements & Business Action Matrix

| Configuration Item             | Control Type          | Valid Range / Scope             | Business Intent & Rules                                                                                                  |
| :----------------------------- | :-------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| **AI & Database Connectivity** | Status Indicators     | Healthy / Disrupted             | Measures end-to-end response latency of model providers and transactional availability of persistence stores.            |
| **REM Sleep Interval**         | Range Slider          | 10 mins to 24 hours             | Regulates how frequently background workers consolidate, cluster, and crystallize accumulated lessons.                   |
| **Forget Mode Toggle**         | Binary Switch         | Enabled / Disabled              | When enabled, automatically purges unreferenced session-scoped notes that delivered zero efficacy after 30 days.         |
| **Similarity Threshold**       | Ratio Slider          | $50\% - 99\%$ (Default: $82\%$) | Sets semantic threshold required before two candidate lessons are consolidated as duplicate knowledge.                   |
| **Confidence Cutoff**          | Ratio Slider          | $10\% - 100\%$                  | Minimum confidence required to automatically approve high-efficacy lessons without human review.                         |
| **Tag Visual Palette**         | Color Swatch Picker   | Hex Color Palette               | Assigns distinct visual color codes to knowledge domains for rapid cognitive recognition on the dashboard.               |
| **"Save Configuration"**       | Primary Action Button | Enabled on dirty state          | Validates parameter boundaries, applies updates immediately to running background tasks, and emits a notification event. |

---

## 3. Governance & Safety Constraints

- All configuration changes must be recorded in the audit log with the identity of the modifying actor.
- Sleep cycle intervals under 10 minutes are prohibited to prevent computational contention and excessive model API usage.
