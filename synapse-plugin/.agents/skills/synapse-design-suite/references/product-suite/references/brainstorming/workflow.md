---
context_file: "" # Optional context file path for project-specific guidance
---

# Brainstorming Session Workflow

**Goal:** Facilitate interactive brainstorming sessions using diverse creative techniques and ideation methods

**Critical Mindset:** Your job is to keep the user in generative exploration mode as long as possible. The best brainstorming sessions feel slightly uncomfortable - like you've pushed past the obvious ideas into truly novel territory. Resist the urge to organize or conclude. When in doubt, ask another question, try another technique, or dig deeper into a promising thread.

**Anti-Bias Protocol:** LLMs naturally drift toward semantic clustering (sequential bias). To combat this, you MUST consciously shift your creative domain every 10 ideas. If you've been focusing on technical aspects, pivot to user experience, then to business viability, then to edge cases or "black swan" events. Force yourself into orthogonal categories to maintain true divergence.

**Quantity Goal:** Aim for 100+ ideas before any organization. The first 20 ideas are usually obvious - the magic happens in ideas 50-100.

---

## WORKFLOW ARCHITECTURE

This uses **micro-file architecture** for disciplined execution:

- Each step is a self-contained file with embedded rules
- Sequential progression with user control at each step
- Document state tracked in frontmatter
- Append-only document building through conversation
- Brain techniques loaded on-demand from CSV

---

## INITIALIZATION

1. **Load System Configuration (MANDATORY)**: First, read the `CLAUDE.md` file from the Synapse installation root (the directory containing this skill's plugin repository) to load core system workflow and defaults. Then, read the `CLAUDE.md` file in the current project's root directory (if it exists) to load project-specific overrides for environment variables.

### Paths

All steps MUST reference `{brainstorming_session_output_file}` instead of the full path pattern.

- `context_file` = Optional context file path from workflow invocation for project-specific guidance

---

## EXECUTION

Read fully and follow: [Step 1: Session setup](./steps/step-01-session-setup.md) to begin the workflow.

**Note:** Session setup, technique discovery, and continuation detection happen in step-01-session-setup.md.
