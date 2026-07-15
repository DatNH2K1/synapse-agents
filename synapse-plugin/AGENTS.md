# synapse-plugin Developer & Agent Guide (AGENTS.md)

Welcome to the `synapse-plugin` repository. This repository follows the official Google Antigravity customizer/plugin specifications.

This guide serves as a manual for both human developers and AI coding agents to ensure compatibility, safety, and structured development within this environment.

---

## 📂 Repository Structure

All customizations and extensions should be structured as follows:

```text
synapse-plugin/
├── AGENTS.md           # This guidelines and instruction manual
├── plugin.json         # Plugin manifest file
├── docs/
│   └── antigravity/    # Detailed Antigravity specifications
│       ├── mcp.md
│       ├── skills.md
│       ├── rules_workflows.md
│       ├── plugins.md
│       └── hooks.md
└── .agents/            # Workspace Customizations Root
    ├── rules/          # Project-specific rules and instructions
    ├── skills/         # Custom skills (each in its own folder with a SKILL.md)
    ├── hooks.json      # Workspace-level event hook definitions
    └── mcp_config.json # Workspace-level Model Context Protocol configurations
```

---

## 🛠️ Standards & Guidelines

### 1. Manifest (`plugin.json`)

Every Antigravity plugin requires a `plugin.json` at the root. Do not modify the schema version or basic identity properties without consulting project maintainers.

### 2. Workspace Customizations (`.agents/`)

- **Rules**: Project-specific behaviors (such as compliance checklists or workflow rules) are defined in `.agents/rules/` or appended to `AGENTS.md`. Avoid embedding system-level compliance checklists directly inside individual skill files.
- **Skills**: Each skill must be placed in `.agents/skills/<skill_name>/` and contain a `SKILL.md` specifying YAML frontmatter (name & description) and the skill's instructions. Keep instructions focused on the skill execution.
  - **No Skill manifest.json**: Do NOT include or copy legacy `manifest.json` files inside individual skill directories. Antigravity plugin spec only uses the root `plugin.json` and parses skill metadata directly from the YAML frontmatter of `SKILL.md`.
  - **Skill Description & Triggers**: The description in the YAML frontmatter must be highly detailed to guide route selectors. Use block scalar format (`description: |`) to explicitly specify "Trigger immediately for:" (with positive keywords), "DO NOT trigger for:" (with negative keywords), and include a **MANDATORY:** clause defining the exact context in which this skill must run.
  - **No System Placeholders**: Do NOT embed system-level configuration parameters or environment placeholders (such as `{user_name}`, `{communication_language}`, `{document_output_language}`, `{output_folder}`, `{docker_port}`) in individual skill instructions. Keep these concerns configured within the system-level rules (e.g., in `.agents/rules/` or appended to `AGENTS.md`).
- **Hooks**: Lifecycle hooks must be configured in `.agents/hooks.json` to handle events like `PreToolUse` and `PostToolUse`.
- **Path Portability**: All file path references and documentation links within this repository MUST use relative paths to ensure consistency and portability across different developer workstations.
- **Link Text Conventions**: When linking to files in Markdown, always display the actual document title in the square brackets `[...]` (e.g., `[Model Context Protocol (MCP)](...)`), instead of the physical filename (e.g., `[mcp.md](...)`). _Note: Standard Markdown links are used for file navigation and do not interfere with Antigravity's `@mention` syntax, which is used for context injection in rules._

---

## 📖 Standard Documents

For in-depth explanations and implementation details of Google Antigravity standards, refer to the following documents under [docs/antigravity/](docs/antigravity/):

1. Refer to [Model Context Protocol (MCP)](docs/antigravity/mcp.md) for configuring local/remote tool bridges.
2. Refer to [Agent Skills](docs/antigravity/skills.md) for structuring and registering skills.
3. Refer to [Rules and Workflows](docs/antigravity/rules_workflows.md) to manage agent constraints.
4. Refer to [Antigravity Plugins](docs/antigravity/plugins.md) for packaging specifications.
5. Refer to [Lifecycle Hooks](docs/antigravity/hooks.md) for intercepting tool calls and agent lifecycle events.
