---
name: synapse-code-review
description: |
  Master Review Suite. Automatically dispatches multiple review layers (Adversarial, Edge-Case, Prose-UI, Security) based on code context for high-fidelity technical and security analysis.

  MANDATORY: Execute when the user asks for a comprehensive code review, security review, edge-case audit, or technical verification of code changes.

  Trigger immediately for:
  - Technical code review requests: "code review", "adversarial review", "edge-case review", "security audit", "run code review".
  - Automated deep verification of diffs or pull requests.

  DO NOT trigger for:
  - General feature development or code writing tasks, unless a review is explicitly requested.
  - Interactive walkthroughs or human-oriented orientation (use `synapse-checkpoint-preview` for that).
---

# Master Code Review Suite

This is the ultimate orchestration layer for all code-related reviews in Synapse. It automatically analyzes code context to trigger the most relevant expert layers while preserving the full technical rigor and all supporting documentation of underlying methodologies.

## 🚦 INTELLIGENCE DISPATCHER & SUB-SKILL REGISTRY

When reviewing, you MUST refer to the registry table below and **only load/query the sub-skills whose Activation Criteria match the current task context** (Lazy/Conditional Loading pattern) to prevent token waste and context bloat. Do NOT load sub-skills whose activation criteria are not met.

| Sub-Skill              | Portable Path                                                  | Primary Role                                              | Activation Criteria                              |
| :--------------------- | :------------------------------------------------------------- | :-------------------------------------------------------- | :----------------------------------------------- |
| **Adversarial Review** | [Adversarial Review](./references/adversarial-review/SKILL.md) | Skeptical critique, security audit, assumptions challenge | Always active for Stage 3 reviews                |
| **Edge-Case Hunter**   | [Edge-Case Hunter](./references/edge-case-hunter/SKILL.md)     | Path tracing, boundary analysis, race conditions          | Active on logic detection (`if`, `loop`, `math`) |

---

## 🛠️ ACTIVE INTEGRATION WORKFLOWS

### 1. Three-Stage Review Protocol (Dynamic Integration)

- **Stage 1 & 2 (Compliance & Quality)**: Assess code structure. If any branching paths exist, you **MUST** load and apply the exhaustive path tracing rules from `edge-case-hunter`.
- **Stage 3 (Adversarial Red-Team)**: Actively apply the threat models, security vulnerability vectors, and destructive testing mindsets defined in `adversarial-review`.

### 2. Edge-Case Path Tracing

- When trace logic is triggered, systematically enumerate all input parameters. Use the boundary-value analysis guidelines from `edge-case-hunter` to trace empty inputs, invalid formats, and overflow/null states.

---

## 🔒 AUTOMATED QUALITY CHECKPOINTS

Before submitting a code review report:

- [ ] **Path Traversal Gate**: Confirm all branching logic (`if`, `switch`, loops) has been traced with a corresponding edge-case checklist.
- [ ] **Adversarial Security Sign-off**: Verify that input validation, API error handling, and authorization states have been fuzzed using `adversarial-review` checklists.
- [ ] **Prose Naming Audit**: Ensure variable and function names are self-documenting and match Synapse naming conventions.

---

## 📂 FULL REFERENCES (Portable Relative Paths)

For deep-dive analysis, the Master Skill maintains the full original structures of absorbed skills:

- **Adversarial Review (Full Protocol & Stage 3)**: [Adversarial Review](./references/adversarial-review/SKILL.md)
  - Includes: Spec compliance, Red-team methods, Checklist workflows, etc.
- **Edge-Case Hunter**: [Edge-Case Hunter](./references/edge-case-hunter/SKILL.md)
  - Includes: Exhaustive path tracing rules.

## USAGE

Simply request a "code review" or "review these changes." The system will automatically coordinate the layers, apply the sub-skill checks, and provide a unified report with quality checkpoints.
