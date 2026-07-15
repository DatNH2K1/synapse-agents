# Synapse Plugin - TODO & Future Improvements

This document tracks planned features, enhancements, and architectural cleanups for the Synapse skills.

## 🎨 synapse-stitch

- [ ] **Repository-to-Stitch Project Mapping:**
  - Implement a mechanism where the skill automatically reads and writes a `.stitch.json` configuration file at the repository root to persist the associated Stitch `projectId`.
  - Update `SKILL.md` workflows to instruct agents to first check for `.stitch.json` before prompting for or creating a project.

- [ ] **Stitch Project Checkpointing & Reusability:**
  - Implement a checkpoint/snapshot mechanism for Stitch designs (screens, variants, and design system tokens) within the local workspace (e.g., in `.stitch.json` or a dedicated `.stitch/checkpoints/` directory).
  - Enable agents to easily roll back, restore, or branch design states, ensuring seamless reusability of Stitch projects across development sessions without having to regenerate mockups from scratch.


## 🌐 synapse-portal

- [ ] **Refactor Project Tags to Dedicated Project Table:**
  - **Database Migration:**
    - Create a new `Project` table/model in `prisma/schema.prisma` containing `id`, `name`, `description`, `createdAt`, and `updatedAt`.
    - Create a join table/relation (e.g., `NodeProject` or direct relation) to link `Node` and `Project`.
    - Write a migration to extract existing project tags (`scope = "project"`) into the new `Project` table and map existing relations.
  - **Backend & Services Update:**
    - Update `knowledge-service.ts` and related backend logic to query/mutate the `Project` model instead of `Tag` with `scope = "project"`.
    - Update the `synapse-portal` MCP server tools (`query_memory`, `propose_memory`) to support the new `Project` schema.
  - **Frontend UI & Components:**
    - Update dashboards, filters, and explorer components to utilize the new `Project` structure.
    - Add a dedicated table or manager UI for Projects in the portal.

- [ ] **Refactor User Personas (Hana) to Dedicated Table:**
  - **Database Schema & Migration:**
    - Define a new `UserPersonal` (or `Persona`) model in `prisma/schema.prisma` with fields matching `personals.csv` (e.g., `key`, `displayName`, `region`, `description`, `culturalTraits`, `techLiteracy`, `painPoints`).
    - Establish a relation between the new persona model and the `Project` table.
  - **Migration & Seeding:**
    - Seed the database using the structured persona records from `personals.csv` associated with their respective projects.
    - Extract any legacy nodes currently tagged under the `user-personals` section.
  - **Backend & Service Updates:**
    - Remove the generic `user-personals` section/tag logic from `knowledge-service.ts`.
    - Create dedicated service methods, API endpoints, and MCP tools for managing project-scoped user personas.
  - **Frontend UI:**
    - Replace the unstructured card nodes in the portal timeline with a structured, premium persona directory/table linked to the active project.


## 📦 synapse-plugin

- [ ] **Generate Missing Manifest Files:**
  - Update the build script (`build_antigravity_plugin.ts`) to automatically scan the skills and agents directories.
  - Parse the frontmatter metadata from `SKILL.md` or other source files to dynamically generate the missing manifest files (`agent-manifest.csv`, `skill-manifest.csv`, `addition-skill-manifest.csv`) during build time, ensuring the portal has up-to-date registry data.

