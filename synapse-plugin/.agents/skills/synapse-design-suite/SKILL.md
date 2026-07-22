---
name: synapse-design-suite
description: |-
  Master Design Suite: A comprehensive design intelligence layer covering UX Strategy, Visual Design, AI Art Generation, Frontend Implementation, copywriting, and creative ideation.

  MANDATORY: Execute when working on UX strategy, visual design, AI art generation, high-fidelity frontend implementation, copywriting, or creative trend forecasting.

  Trigger immediately for:
    - UX Strategy
    - Visual Design
    - AI Art Generation
    - Frontend Implementation
    - design mockup
    - UI design
    - Copywriting
    - Stitch UI design
    - Creative Ideation

  DO NOT trigger for:
    - Backend API routes.
    - Database migrations.
    - DevOps and deployment pipeline configurations.
---

# Master Design Suite

This skill is the creative engine of Synapse. It intelligently orchestrates the design process, from wireframing and UX research to high-fidelity UI generation, copywriting, and frontend coding.

## 🚦 INTELLIGENCE DISPATCHER & SUB-SKILL REGISTRY

When executing any layer, you MUST refer to the registry table below and **only load/query the sub-skills whose Activation Criteria match the current task context** (Lazy/Conditional Loading pattern) to prevent token waste and context bloat. Do NOT load sub-skills whose activation criteria are not met.

| Sub-Skill                | Portable Path                                                                              | Primary Role                                           | Activation Criteria                                       |
| :----------------------- | :----------------------------------------------------------------------------------------- | :----------------------------------------------------- | :-------------------------------------------------------- |
| **UX Pro Max**           | [`./references/ui-ux-pro-max/SKILL.md`](./references/ui-ux-pro-max/SKILL.md)               | Design rules, colors, accessibility checklists         | Triggered on ANY UX, layout, or component creation/edit   |
| **AI Artist**            | [`./references/ai-artist/SKILL.md`](./references/ai-artist/SKILL.md)                       | Prompts, image & asset generation                      | Triggered when generating placeholders, mockups, or icons |
| **UX Design**            | [`./references/ux-design/SKILL.md`](./references/ux-design/SKILL.md)                       | UX strategy, user research, wireframing guidelines     | Triggered on UX planning and sitemaps                     |
| **Frontend Design**      | [`./references/frontend-design/SKILL.md`](./references/frontend-design/SKILL.md)           | Native styling, layout architecture, and styling rules | Triggered when structuring HTML/CSS/Tailwind layout       |
| **React Best Practices** | [`./references/react-best-practices/SKILL.md`](./references/react-best-practices/SKILL.md) | Code quality, React component conventions, hooks       | Triggered when writing or refactoring React code          |
| **Stitch**               | [`./references/stitch/SKILL.md`](./references/stitch/SKILL.md)                             | Google Stitch UI generation and design systems         | Triggered when asked to create/edit Stitch UI screens     |
| **Copywriting**          | [`./references/copywriting/SKILL.md`](./references/copywriting/SKILL.md)                   | High-converting copywriting formulas and styles        | Triggered when writing landing page copy or CTAs          |
| **Radical Experience**   | [`./references/radical-experience/SKILL.md`](./references/radical-experience/SKILL.md)     | Zero-Click UI, gamification, and peak-end rule         | Triggered on advanced interactive UI & animations         |
| **Disruptive Ideation**  | [`./references/disruptive-ideation/SKILL.md`](./references/disruptive-ideation/SKILL.md)   | Blue Ocean ERRC, Worst Possible Idea, SCAMPER          | Triggered during brainstorms and product concept phases   |
| **Trend Forecasting**    | [`./references/trend-forecasting/SKILL.md`](./references/trend-forecasting/SKILL.md)       | Weak Signals and STEEP strategic forecasting           | Triggered during roadmap and futurism analysis            |
| **Product Suite**        | [`./references/product-suite/SKILL.md`](./references/product-suite/SKILL.md)               | Ideation, PRD, stories breakdown, sprint planning      | Triggered when creating PRDs, stories, sprint plans       |

---

## 🛠️ ACTIVE INTEGRATION WORKFLOWS

### 1. Concept to Visuals (Dynamic Linking)

- Before creating visual concepts, you **MUST** call the MCP tool `search_ai_art_prompts(query)` to match the concept with the best curated prompts.
- Perform a validation interview (unless `--skip` is used) matching design guidelines from `ui-ux-pro-max`.

### 2. Design to Code

- When converting designs to code, check `ui-ux-pro-max` for the target stack guidelines (e.g., React/Tailwind).
- Auto-generate the Light/Dark mode color tokens using semantic definitions in `ui-ux-pro-max` color palettes.

---

## 🔒 AUTOMATED QUALITY CHECKPOINTS

Before delivering any UI component or mockup:

- [ ] **Touch Target Check**: Verify all interactive elements have a minimum size of 44×44pt (per `ui-ux-pro-max/SKILL.md` §2).
- [ ] **Contrast Verification**: Ensure text and icons meet WCAG 4.5:1 contrast standards (per `ui-ux-pro-max/SKILL.md` §1).
- [ ] **No Emoji Rule**: Verify that vector SVGs are used instead of raw emojis for icons (per `ui-ux-pro-max/SKILL.md` §4).

---

## 📂 FULL REFERENCES (Portable Relative Paths)

The Master Suite maintains the full integrity of all specialized Design methodologies:

### UX & Strategy

- [UX Design Specifications](./references/ux-design/SKILL.md)
- [UI/UX Intelligence (Pro Max)](./references/ui-ux-pro-max/SKILL.md)
- [Copywriting Formulas](./references/copywriting/SKILL.md)
- [Disruptive Ideation](./references/disruptive-ideation/SKILL.md)
- [Product Suite PRD & Sprint Planning](./references/product-suite/SKILL.md)

### Visual & AI Generation

- [AI Artist (Image Generation)](./references/ai-artist/SKILL.md)
- [Stitch UI Generation](./references/stitch/SKILL.md)

### Implementation & UX Innovation

- [Frontend Design Engine](./references/frontend-design/SKILL.md)
- [React/Next.js Best Practices](./references/react-best-practices/SKILL.md)
- [Radical Experience](./references/radical-experience/SKILL.md)
- [Trend Forecasting](./references/trend-forecasting/SKILL.md)

## USAGE

"Design a landing page for X", "Generate a logo for my app", "Review the UX of this form", or "Convert this design into React code". The Master Suite will coordinate the expert layers and enforce the quality checkpoints.
