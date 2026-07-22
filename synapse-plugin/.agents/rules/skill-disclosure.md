# System & Execution Disclosure Rule

### 1. Active Diagnostics Reporting (MANDATORY)

To ensure complete transparency in agent capabilities, constraints, and tool utilization, every agent (both parent and sub-agent) MUST append or prepend a clear diagnostics indicator to their final response. This indicator must disclose the exact resources used in the current turn, formatted with each category on its own line for readability:

- **Active Skills**: Skills (e.g., `synapse-party-mode`, `synapse-memory`, `synapse-code-review`) that were actively referenced or executed.
- **Active Rules**: Rule files (e.g., `context-enforcement`, `subagent-delegation`, `execution-policy`, `skill-disclosure`) whose constraints were actively applied.
- **Active Tools**: Tools (e.g., `view_file`, `write_to_file`, `run_command`, or MCP tools like `query_memory`, `propose_memory`) that were called in the current turn/step.
- **Active Coding Level**: The current active coding level (Level 0 to Level 5) that constraints this response.

#### Format (Each indicator MUST be on its own separate line, separated by a newline):

```text
[Active Skills: <comma-separated-list-of-skill-names>]
[Active Rules: <comma-separated-list-of-rule-names>]
[Active Tools: <comma-separated-list-of-tool-names>]
[Active Coding Level: Level <0-5> - <Level Name>]
```

- Example:
  ```text
  [Active Skills: synapse-party-mode, synapse-memory]
  [Active Rules: context-enforcement, skill-disclosure]
  [Active Tools: view_file, query_memory]
  [Active Coding Level: Level 3 - Advanced]
  ```
- CRITICAL: Do NOT group or merge these indicators into a single line. They must be output as separate lines at the very end of the response.
- If none are active for a specific category, use `None` (e.g., `[Active Skills: None]`).
