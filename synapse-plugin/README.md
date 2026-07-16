# Synapse Agent Plugin (`synapse-plugin`)

This directory contains the custom declarative plugin for Google Antigravity, specifying rules, skills, and specialized agent personas for the Synapse project.

---

## 📂 Structure Overview

- **`.agents/`**: The workspace customizations root containing all customization files:
  - **`skills/`**: 39 declarative skills. Each skill is a folder containing a `SKILL.md` (instructions with YAML frontmatter) and optional supporting assets.
  - **`agents/`**: 12 custom agent personas (e.g., Winston, Sally, Amelia, Arthur), structured as specialized skills.
  - **`rules/`**: Global/project system rules defining constraints, subagent delegation policies, and context limits.
  - **`config.toml` / `hooks.json`**: System-level plugin configs and event hook bindings.
- **`docs/`**: Official documentation regarding Antigravity specifications (MCP, hooks, plugins, rules, skills).
- **`AGENTS.md`**: Guide for human developers and AI coding agents to maintain compatibility and structure.

---

## 🛠️ How it is Compiled

Since this is the source directory, the files are not read directly from here by the global Antigravity engine. Instead, they are compiled and output to the build directory.

The build script inside the portal workspace (`synapse-portal/scripts/build_antigravity_plugin.ts`) handles:

1. Cleaning the build target at `build/antigravity`.
2. Copying the Python `synapse-mcp` directory (excluding runtime caches and ideas).
3. Extracting credentials from `.env` to build `mcp_config.json` with appropriate API keys (`CONTEXT7_API_KEY`, `STITCH_API_KEY`).
4. Copying rules from `.agents/rules/` to `build/antigravity/rules/`.
5. Merging `.agents/skills/` and `.agents/agents/` into a single unified `skills/` directory under `build/antigravity/skills/`.
6. Generating the master `plugin.json` manifest.
7. Symlinking/linking the build directory directly to the global Antigravity plugins directory (`~/.gemini/config/plugins/synapse-plugin`).

To run the build and link process:

```bash
# Run from the repository root
make link:antigravity
```

---

## 🧩 Adding a New Skill

To add a new skill to the plugin:

1. Create a directory under `.agents/skills/<your-skill-name>/`.
2. Create a `SKILL.md` file inside that directory.
3. Define the frontmatter at the top of the file:

   ```yaml
   ---
   name: your-skill-name
   description: |
     Brief description of what this skill does.

     MANDATORY: Execute when...

     Trigger immediately for:
     - keyword1
     - keyword2

     DO NOT trigger for:
     - keyword3
   ---
   ```

4. Write your markdown instructions below the frontmatter.
5. Recompile and link using `make link:antigravity`.

---

## 🤖 Available Agent Personas

The plugin defines 12 standard agent roles located under `.agents/agents/`:

- **`synapse-agent-pm` (John)**: Product manager for PRD discovery.
- **`synapse-agent-analyst` (Mary)**: Business analyst and requirements analyst.
- **`synapse-agent-architect` (Winston)**: System architect and technical designer.
- **`synapse-agent-web-dev` (Amelia)**: Senior fullstack developer.
- **`synapse-agent-mobile-dev`**: Senior mobile developer.
- **`synapse-agent-game-dev`**: Senior interactive/canvas game developer.
- **`synapse-agent-ux-designer` (Sally)**: UI/UX specialist.
- **`synapse-agent-qa`**: QA Automation specialist & White-hat hacker.
- **`synapse-agent-tech-writer` (Paige)**: Documentation curator.
- **`synapse-agent-user` (Hana)**: User advocate & cultural strategist.
- **`synapse-agent-cto` (Arthur)**: Technical advisor and risk auditor.
- **`synapse-agent-creative`**: Creative director and innovator.

---

## 📚 Technical Standards

For deeper specifications on customizing agents and rules:

- [Model Context Protocol Specification](docs/antigravity/mcp.md)
- [Agent Skills Specification](docs/antigravity/skills.md)
- [Rules & Workflows Specification](docs/antigravity/rules_workflows.md)
- [Plugin Packing Specification](docs/antigravity/plugins.md)
- [Lifecycle Hooks Specification](docs/antigravity/hooks.md)
