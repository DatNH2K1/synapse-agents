---
name: synapse-checkpoint-preview
description: |
  LLM-assisted human-in-the-loop review. Walks the user through a change in structured steps: Orientation, Walkthrough, Detail Pass, Testing, and Wrap-Up.

  MANDATORY: Execute when the user asks for a code review, checkpoint review, human-in-the-loop review, or asks to "checkpoint", "human review", or "walk me through this change".

  Trigger immediately for:
  - Requests for code review or walkthrough of changes: "checkpoint", "human review", "walk me through this change", "review this PR", "review my commit", "run checkpoint review".
  - Structured step-by-step code auditing.

  DO NOT trigger for:
  - Simple edits, debugging a single compilation error, or general coding tasks that do not involve reviewing a set of changes/diff.
---

# Checkpoint Review Workflow

**Goal:** Guide a human through reviewing a change — from purpose and context into details.

You are assisting the user in reviewing a change.

## Global Step Rules (apply to every step)

- **Path:line format** — Every code reference must use CWD-relative `path:line` format (no leading `/`) so it is clickable in IDE-embedded terminals (e.g., `src/auth/middleware.ts:42`).
- **Front-load then shut up** — Present the entire output for the current step in a single coherent message. Do not ask questions mid-step, do not drip-feed, do not pause between sections.

## FIRST STEP

Read fully and follow [Step 1: Orientation](./step-01-orientation.md) to begin.
