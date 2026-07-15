---
name: synapse-research-center
description: |-
  Master Research Center: A unified engine for Domain Analysis, Market Intelligence, Technical Research, and Documentation Lookup.

  MANDATORY: Execute when carrying out deep research, competitor analysis, technical feasibility studies, or literature reviews.

  Trigger immediately for:
    - technical feasibility research
    - competitor analysis
    - literature review
    - deep research report

  DO NOT trigger for:
    - Routine coding tasks.
    - Writing unit tests.
---

# Master Research Center

This skill is the primary knowledge acquisition engine of Synapse. It intelligently dispatches research tasks based on the complexity and domain of the inquiry.

## 🚦 INTELLIGENCE DISPATCHER & SUB-SKILL REGISTRY

When executing any layer, you MUST refer to the registry table below and **only load/query the sub-skills whose Activation Criteria match the current task context** (Lazy/Conditional Loading pattern) to prevent token waste and context bloat. Do NOT load sub-skills whose activation criteria are not met.

| Sub-Skill               | Portable Path                                                            | Primary Role                                    | Activation Criteria                                        |
| :---------------------- | :----------------------------------------------------------------------- | :---------------------------------------------- | :--------------------------------------------------------- |
| **Docs Seeker**         | [`./references/docs-seeker/SKILL.md`](./references/docs-seeker/SKILL.md) | Fetches and processes library docs (llm.txt)    | Triggered when researching APIs, libraries, or syntaxes    |
| **Repomix**             | [`./references/repomix/SKILL.md`](./references/repomix/SKILL.md)         | Gathers and packs codebase files for context    | Triggered when analyzing local codebase structures         |
| **Technical Deep-dive** | [`./references/technical/SKILL.md`](./references/technical/SKILL.md)     | Deep analysis of libraries, stacks, performance | Triggered on structural/technical analysis requests        |
| **Domain Research**     | [`./references/domain/SKILL.md`](./references/domain/SKILL.md)           | Business domain analysis, terms dictionary      | Triggered when analyzing a new business vertical or domain |
| **Market Intelligence** | [`./references/market/SKILL.md`](./references/market/SKILL.md)           | Competitor scanning and product benchmarking    | Triggered during feature and market analysis               |

---

## 🛠️ ACTIVE INTEGRATION WORKFLOWS

### 1. External & Technical Research

- When researching external APIs or frameworks, you **MUST** run `docs-seeker` to search for available `llm.txt` or `llm-common.txt` documentation before using general web search.

### 2. Local Codebase Analysis

- When beginning complex architectural research or refactoring analysis, run `repomix` to bundle target directory files. This ensures your workspace analysis is grounded in the latest source files.

---

## 🔒 AUTOMATED QUALITY CHECKPOINTS

Before submitting research summaries:

- [ ] **Library Version Check**: Verify the documentation retrieved matches the version specified in the project configurations.
- [ ] **Codebase Grounding Check**: Confirm that local code references have been verified against packed codebase files (using `repomix`).
- [ ] **Accurate Citations**: Check that all cited APIs and methods include exact file paths or URL sources.

---

## 📂 FULL REFERENCES (Portable Relative Paths)

### Specialized Research Engines

- [Domain Research](./references/domain/SKILL.md)
- [Market Intelligence](./references/market/SKILL.md)
- [Technical Deep-dive](./references/technical/SKILL.md)

### Context & Docs

- [Docs Seeker (LLM.txt Support)](./references/docs-seeker/SKILL.md)
- [Repomix (Codebase Packing)](./references/repomix/SKILL.md)

## USAGE

"Research the e-commerce industry in Vietnam", "Analyze the technical pros/cons of Next.js 15", or "Look up the API for TanStack Query". The Master Suite will coordinate the expert layers and enforce the verification checkpoints.
