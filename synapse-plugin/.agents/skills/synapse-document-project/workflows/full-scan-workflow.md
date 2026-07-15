# Full Project Scan Sub-Workflow

**Goal:** Complete project documentation (initial scan or full rescan).

**Your Role:** Full project scan documentation specialist.

---

## INITIALIZATION

1. **Load System Configuration (MANDATORY)**: First, read the `CLAUDE.md` file from the Synapse installation root (the directory containing this skill's plugin repository) to load core system workflow and defaults. Then, read the `CLAUDE.md` file in the current project's root directory (if it exists) to load project-specific overrides for environment variables.

### Configuration Loading

### Runtime Inputs

- `workflow_mode` = `""` (set by parent: `initial_scan` or `full_rescan`)
- `scan_level` = `""` (set by parent: `quick`, `deep`, or `exhaustive`)
- `resume_mode` = `false`
- `autonomous` = `false` (requires user input at key decision points)

---

## EXECUTION

Read fully and follow: [Full Project Scan Instructions](./full-scan-instructions.md)
