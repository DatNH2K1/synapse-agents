# Rules and Workflows

Rules are manually defined constraints for the Agent to follow, at both the local and global levels. Rules allow users to guide the agent to follow behaviors particular to their own use cases and style.

## Rules

To get started with Rules:

1. Open the Customizations panel via the `...` dropdown at the top of the editor's agent panel.
2. Navigate to the **Rules** panel.
3. Click `+ Global` to create new Global Rules, or `+ Workspace` to create new Workspace-specific rules.

A Rule is simply a Markdown file containing constraints to guide the Agent. Rules files are limited to **12,000 characters** each.

### Storage Locations

- **Global Rules**: Live in `~/.gemini/GEMINI.md` and apply across all workspaces.
- **Workspace Rules**: Live in `.agents/rules/` (with backward compatibility for `.agent/rules`).

### Activation Types

- **Manual**: Explicitly activated via `@mention` in the input box.
- **Always On**: Constantly applied.
- **Model Decision**: The model decides based on the natural language description.
- **Glob**: Applied to files matching a pattern (e.g., `*.js`, `src/**/*.ts`).

### @ Mentions

You can reference other files using `@filename` in a Rules file. If the filename is relative, it resolves relative to the Rules file. If absolute, it resolves relative to the workspace.

---

## Workflows

Workflows enable you to define a series of steps to guide the Agent through a repetitive set of tasks, such as deploying a service or responding to PR comments. These Workflows are saved as markdown files. Once saved, they can be invoked via a slash command (e.g. `/workflow-name`).

Workflows provide structured sequence of steps or prompts at the trajectory level, guiding the model through a series of interconnected tasks.

### To create a workflow:

1. Open the Customizations panel via the `...` dropdown.
2. Navigate to the **Workflows** panel.
3. Click `+ Global` or `+ Workspace`.

Workflows are saved as markdown files and contain a title, description, and steps. Workflow files are limited to **12,000 characters** each. You can call other workflows from within a workflow!

### Agent-Generated Workflows

You can ask the Agent to generate Workflows for you using your current conversation history.
