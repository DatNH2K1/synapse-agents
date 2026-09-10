# Synapse Rules

To optimize context usage, load and read only the relevant rule files when their specific conditions are met:

### 1. Universal Rules (CRITICAL MANDATORY: You MUST call the `view_file` tool to read ALL of these files in the first turn of every session/turn. Do not skip under any circumstance!)

- **Active Diagnostics Disclosure**: MANDATORY to format and append active diagnostics indicators (skills, rules, tools) at the end of every turn.
  - **MANDATORY LOAD FIRST TURN**: Call `view_file` on @rules/skill-disclosure.md
- **Changelog Guidelines**: Rules for creating and updating changelogs comparing with develop/main/master.
  - **MANDATORY LOAD FIRST TURN**: Call `view_file` on @rules/changelog-guidelines.md
  - **MANDATORY EXECUTION**: You MUST create/update the `CHANGELOG.md` file in English located directly at the `.git` root folder of the modified repository (co-located with `.git`, never in a parent folder without `.git`) before presenting the final result.
- **Feature Specification & Flow Guidelines**: Rules for creating and maintaining granular feature catalogs (`FEATURES.md`) and UI flow specifications (`docs/features/*.md`) with strict relative paths.
  - **MANDATORY LOAD FIRST TURN**: Call `view_file` on @rules/feature-spec-guidelines.md
- **Context Enforcement & Memory Lifecycle (Universal Rule)**: Protocol for lazy context loading, .git Root Rule for project tagging, and mandatory Memory Lifecycle (`query_memory` at start, `increment_efficacy` during task, `propose_memory` upon completion).
  - **MANDATORY LOAD FIRST TURN**: Call `view_file` on @rules/context-enforcement.md
- **Configuration & Active Coding Level**: Reading user preferences (`user_name`, `communication_language`, `coding_level`) from `config.toml` and applying communication and formatting constraints.
  - **MANDATORY LOAD FIRST TURN**: Call `view_file` on `config.toml` to read `{coding_level}`, and immediately call `view_file` on @skills/synapse-agent-coordination/references/coding-level/SKILL.md to navigate and load the active coding level guidelines.

### 2. Command Execution & Local Config (Read when executing terminal commands or reading config.toml)

- **Execution & Configuration Policies**: Instructions on mapping `config.toml` variables and preferring Docker execution in target repositories.
  - Load: @rules/execution-policy.md

### 3. Multi-Agent Workflows (Read ONLY when spawning or communicating with subagents)

- **Sub-Agent Delegation & Management**: Instructions on subagent status reporting (`DONE`, `BLOCKED`, etc.), context isolation, and delegation protocols.
  - Load: @rules/subagent-delegation.md
