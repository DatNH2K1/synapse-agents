---
name: synapse-generate-project-context
description: |-
  Create project-context.md with AI rules. Use when the user says "generate project context" or "create project context"

  MANDATORY: Execute when compiling and generating context files (e.g. CONTEXT.md) to initialize agent tasks.

  Trigger immediately for:
    - generate project context
    - "initialize agent context"
    - CONTEXT.md generation
    - project onboarding config

  DO NOT trigger for:
    - Creating user documentation.
    - Drafting feature plans.
---

Follow the instructions in [Generate Project Context Workflow](./workflow.md).
