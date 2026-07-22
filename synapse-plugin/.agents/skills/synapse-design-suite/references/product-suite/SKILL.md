---
name: synapse-product-suite
description: |-
  Master Product Suite: An end-to-end management layer covering Ideation, PRD Definition, Work Decomposition (Epics/Stories), and Sprint Execution.

  MANDATORY: Execute when outlining product requirements documents (PRDs), customer personas, user journeys, or roadmap milestones.

  Trigger immediately for:
    - Product Requirements Document
    - PRD generation
    - user journey mapping
    - customer persona definition
    - product roadmap

  DO NOT trigger for:
    - Writing executable code.
    - Configuring development servers.
---

# Master Product Suite

This skill is the central nervous system for product management in Synapse. It intelligently orchestrates the entire product lifecycle from initial vision to sprint tracking.

## 🚦 INTELLIGENCE DISPATCHER & SUB-SKILL REGISTRY

When executing any phase, you MUST refer to the registry table below and **only load/query the sub-skills whose Activation Criteria match the current task context** (Lazy/Conditional Loading pattern) to prevent token waste and context bloat. Do NOT load sub-skills whose activation criteria are not met.

| Sub-Skill           | Portable Path                                                | Primary Role                                     | Activation Criteria                                       |
| :------------------ | :----------------------------------------------------------- | :----------------------------------------------- | :-------------------------------------------------------- |
| **PRD Creation**    | [Create Prd](./references/create-prd/SKILL.md)               | Standardized PRD formatting and writing          | Triggered when defining a new product or feature          |
| **PRD Validation**  | [Validate Prd](./references/validate-prd/SKILL.md)           | Enforces compliance, completeness, readability   | Enforced automatically whenever a PRD is created/modified |
| **Edit PRD**        | [Edit Prd](./references/edit-prd/SKILL.md)                   | Guides editing and refinement of existing PRDs   | Triggered when modifying or updating a PRD                |
| **PRFAQ**           | [Prfaq](./references/prfaq/SKILL.md)                         | Working Backwards product design method          | Triggered during early concept validation and ideation    |
| **Product Brief**   | [Product Brief](./references/product-brief/SKILL.md)         | Core product high-level definition               | Triggered before writing a full PRD                       |
| **Brainstorming**   | [Brainstorming](./references/brainstorming/SKILL.md)         | Creative feature discovery and ideation          | Triggered during feature brainstorming                    |
| **Distillator**     | [Distillator](./references/distillator/SKILL.md)             | Requirements distillation and simplification     | Triggered to shrink long specification documents          |
| **Shard Doc**       | [Shard Doc](./references/shard-doc/SKILL.md)                 | Breaking complex specs into isolated chunks      | Triggered when document size exceeds context safety       |
| **Epics & Stories** | [Epics and stories](./references/epics-and-stories/SKILL.md) | Breaking requirements into tasks, Gherkin syntax | Triggered during task decomposition                       |
| **Create Story**    | [Create story](./references/create-story/SKILL.md)           | Writing structured, implementable user stories   | Triggered when writing dev stories                        |
| **Sprint Planning** | [Sprint planning](./references/sprint-planning/SKILL.md)     | Setup sprint roadmap and task list               | Triggered when starting a new sprint                      |
| **Sprint Status**   | [Sprint status](./references/sprint-status/SKILL.md)         | Tracks progress and identifies blockers          | Triggered during daily reviews and updates                |
| **Readiness Check** | [Readiness check](./references/readiness-check/SKILL.md)     | Verifies codebase, dependencies, and risk status | Enforced before sprint planning or task execution         |
| **Retrospective**   | [Retrospective](./references/retrospective/SKILL.md)         | Post-sprint review and portal memory updates     | Triggered when wrapping up sprints or tasks               |

---

## 🛠️ ACTIVE INTEGRATION WORKFLOWS

### 1. Vision & Definition (Event-Driven Triggers)

- When writing a PRD (using `create-prd`), you **MUST** immediately run it through the validation checklist in `validate-prd` to ensure it is structurally sound, clear, and ready for development.

### 2. Decomposition & Execution

- During decomposition, verify that every Epic and User Story has direct traceability back to the parent PRD requirements. Use `epics-and-stories` formatting guidelines.
- Before committing to a Sprint, perform a checklist pass against `readiness-check` to surface environment blockages and third-party dependencies early.

---

## 🔒 AUTOMATED QUALITY CHECKPOINTS

Before concluding product work:

- [ ] **Requirements Compliance**: Verify the PRD has passed the `validate-prd` compliance gate.
- [ ] **Value Traceability**: Ensure each created task has a linked requirement ID mapping back to the PRD.
- [ ] **Retro Completion**: If closing a sprint or epic, trigger a project retrospective (`retrospective`) to capture lessons in the knowledge portal.

---

## 📂 FULL REFERENCES (Portable Relative Paths)

The Master Suite maintains the full integrity of all specialized PM methodologies:

### Stage 1: Ideation

- [PRFAQ (Working Backwards)](./references/prfaq/SKILL.md)
- [Product Brief](./references/product-brief/SKILL.md)
- [Brainstorming](./references/brainstorming/SKILL.md)

### Stage 2: Definition

- [PRD Creation](./references/create-prd/SKILL.md)
- [PRD Validation](./references/validate-prd/SKILL.md)
- [Content Distillation](./references/distillator/SKILL.md)

### Stage 3: Decomposition

- [Epics & Stories Breakdown](./references/epics-and-stories/SKILL.md)
- [User Story Creation](./references/create-story/SKILL.md)
- [Document Sharding](./references/shard-doc/SKILL.md)

### Stage 4: Execution

- [Sprint Planning](./references/sprint-planning/SKILL.md)
- [Sprint Status & Risks](./references/sprint-status/SKILL.md)
- [Implementation Readiness](./references/readiness-check/SKILL.md)
- [Project Retrospective](./references/retrospective/SKILL.md)

## USAGE

"Let's refine the vision", "Create a PRD for X", "Plan the next sprint", or "Check our current status". The Master Suite will coordinate the expert layers, enforce the validation checkpoints, and ensure value traceability.
