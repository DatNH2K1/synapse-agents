---
name: synapse-journal
description: |-
  Write technical journal entries analyzing recent changes, decisions, and session reflections.

  MANDATORY: Execute when logging sprint updates, developer logs, diaries, or maintaining project journals.

  Trigger immediately for:
    - dev journal log
    - developer diary
    - sprint update log
    - recording meeting notes

  DO NOT trigger for:
    - Modifying repository source code.
    - Creating project task lists.
argument-hint: "[topic or reflection]"
---

# Technical Journal

Maintain a structured record of technical decisions, challenges, and significant changes during development.

## Objectives

- **Historical Record:** Track why decisions were made, not just what was changed.
- **Knowledge Transfer:** Help other agents (or the future you) understand the codebase evolution.
- **Session Reflection:** Analyze the impact of recent changes.

## Structure

Journal entries should be stored in `./docs/journals/YYYY-MM-DD-topic.md` and include:

1. **Context:** What was the task or goal?
2. **Key Changes:** Brief list of technical modifications.
3. **Decisions & Rationale:** Why this approach? What were the trade-offs?
4. **Challenges Encountered:** Any blockers or unexpected behaviors.
5. **Impact:** How does this affect the system performance or user experience?

## Workflow

1. **Analyze:** Look at git history or recent session logs.
2. **Reflect:** Identify the "Signal" (important decisions) vs "Noise" (minor tweaks).
3. **Write:** Draft a concise entry using technical language.
4. **Organize:** Ensure the journal is linked or indexed for discovery.
