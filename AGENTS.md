# AGENTS.md - synapse-agents Workspace Guide

Welcome to the `synapse-agents` repository. This repository is the **Single Source of Truth** for the Synapse ecosystem (including `synapse-plugin`, `synapse-portal`, and all related agent workflows).

---

## 🚨 Critical Rules for AI Agents & Developers

### 1. Repository is Single Source of Truth (NEVER Edit `.gemini` Directly)

- **Strict Ban on Direct `.gemini` Modifications**:
  - NEVER create, edit, or delete files directly in `~/.gemini/` or `/Users/*/.gemini/config/plugins/synapse-plugin/`.
  - All rules, skills, configs, hooks, and documentation MUST be authored and modified inside this repository (under `synapse-plugin/.agents/` or `synapse-portal/`).
- **Synchronization Workflow**:
  - To apply and test changes in your local Antigravity environment, always execute via Makefile:
    ```bash
    make link:antigravity
    ```
  - This builds the plugin, renders configurations from `.env`, and links them cleanly to Antigravity's global customization directory.

---

### 2. Path Portability & Relative Links (CRITICAL)

- **Relative Paths ONLY**:
  - All internal links across Markdown files (`AGENTS.md`, `README.md`, `FEATURES.md`, `CHANGELOG.md`, `docs/**/*.md`) MUST use relative paths (e.g. `./synapse-plugin/.agents/rules/...`, `../docs/...`).
- **No Absolute Paths**:
  - Never include machine-specific absolute paths (e.g. `/Users/...`, `file:///...`, `C:\...`) in code, comments, or repository documentation.

---

### 3. Feature & Specification Guidelines (`FEATURES.md`)

- **Living Functional Specification**:
  - When introducing or altering business logic, UI components, or user interaction flows, maintain the project's living specification according to [Feature Spec Guidelines](./synapse-plugin/.agents/rules/feature-spec-guidelines.md).
  - Use `FEATURES.md` at root as the Master Index and place granular screen/action specs in `docs/features/<module>.md`.

---

### 4. Changelog & Code Standards

- **`CHANGELOG.md` at `.git` Root**:
  - Every meaningful feature or fix branch must update `CHANGELOG.md` comparing against `develop`/`main` before completing tasks (refer to [Changelog Guidelines](./synapse-plugin/.agents/rules/changelog-guidelines.md)).
- **Code Quality & Checks**:
  - Run `make check` (or `make check-ts` and `make check-md`) to ensure linting, types, and markdown formatting pass before submitting changes.
  - Auto-format code using `make format` (`make format-ts`, `make format-md`).
