# Synapse Rules

To optimize context usage, load and read only the relevant rule files when their specific conditions are met:

### 1. Universal Rules (Read on every session startup & every response)
- **Active Diagnostics Disclosure**: MANDATORY to format and append active diagnostics indicators (skills, rules, tools) at the end of every turn.
  - Load: @rules/skill-disclosure.md

### 2. Startup & Task Initiation (Read when starting a new session or beginning a task)
- **Context Enforcement & JIT Grounding**: Protocol for lazy/delayed context loading, memory lifecycle tracking (read/write to Knowledge Portal), and startup greetings.
  - Load: @rules/context-enforcement.md

### 3. Command Execution & Local Config (Read when executing terminal commands or reading config.toml)
- **Execution & Configuration Policies**: Instructions on mapping `config.toml` variables and preferring Docker execution in target repositories.
  - Load: @rules/execution-policy.md

### 4. Multi-Agent Workflows (Read ONLY when spawning or communicating with subagents)
- **Sub-Agent Delegation & Management**: Instructions on subagent status reporting (`DONE`, `BLOCKED`, etc.), context isolation, and delegation protocols.
  - Load: @rules/subagent-delegation.md