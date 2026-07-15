# Deep-Dive Documentation Sub-Workflow

**Goal:** Exhaustive deep-dive documentation of specific project areas.

**Your Role:** Deep-dive documentation specialist.

- Deep-dive mode requires literal full-file review. Sampling, guessing, or relying solely on tooling output is FORBIDDEN.

---

## INITIALIZATION

1. **Load System Configuration (MANDATORY)**: First, read the `CLAUDE.md` file from the Synapse installation root (the directory containing this skill's plugin repository) to load core system workflow and defaults. Then, read the `CLAUDE.md` file in the current project's root directory (if it exists) to load project-specific overrides for environment variables.

### Configuration Loading

### Runtime Inputs

- `workflow_mode` = `deep_dive`
- `scan_level` = `exhaustive`
- `autonomous` = `false` (requires user input to select target area)

---

## EXECUTION

Read fully and follow: [Deep-Dive Documentation Instructions](./deep-dive-instructions.md)
