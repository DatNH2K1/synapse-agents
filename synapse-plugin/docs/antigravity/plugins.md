# Antigravity Plugins

Plugins are namespaced bundles that allow you to extend Antigravity's capabilities by grouping skills, rules, MCP servers, and hooks into a single package.

## Directory Structure

Plugins follow a specific folder hierarchy:

```text
plugins/<plugin-name>/
├── plugin.json       # Required marker file
├── mcp_config.json   # Optional MCP server definitions
├── hooks.json        # Optional hooks definition
├── skills/           # Optional skills
│   └── <skill-name>/
│       └── SKILL.md
└── rules/            # Optional rules
    └── <rule-name>.md
```

## Manifest File (`plugin.json`)

Every plugin must have a `plugin.json` file at its root. This file identifies the directory as a plugin.

```json
{
  "name": "my-custom-plugin"
}
```

The `name` field is optional and defaults to the directory name if omitted.

## Supported Components

- **Skills**: Located in the `skills/` subdirectory. Each skill must have a `SKILL.md` file.
- **Rules**: Located in the `rules/` subdirectory. These are markdown files defining constraints or style guidelines.
- **MCP Servers**: Configured via `mcp_config.json` at the plugin root.
- **Hooks**: Configured via `hooks.json` at the plugin root.

---

## How to Add Plugins

### 1. Using Bundled Plugins (Build with Google)

Antigravity comes with a variety of Google-built plugins. You can browse and add them from the **Customizations** page -> **Build with Google** tab.

### 2. Manually Adding Plugins

Antigravity automatically scans designated plugin locations:

- **Workspace Level**: Place the plugin inside `.agents/plugins/` or `_agents/plugins/` at the root of the workspace.
- **Global Level**: Place the plugin inside `~/.gemini/config/plugins/` in your user home directory.
