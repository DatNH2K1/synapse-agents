---
name: synapse-stitch
description: |-
  AI design generation with Google Stitch MCP. Invoke StitchMCP tools to manage projects, generate UI screens, design variants, edit designs, and handle design systems.

  MANDATORY: Execute when tasked with creating or modifying mockups, generating UI screens via Stitch, or editing existing designs using Google Stitch MCP tools.

  Trigger immediately for:
    - Stitch MCP tool invocation
    - generate UI screen using Stitch
    - edit screen using Stitch
    - create design system from design md
    - list or get Stitch projects/screens

  DO NOT trigger for:
    - Code execution / unit tests.
    - Database setup.
    - Managing git commits.
---

# Google Stitch — MCP Design Tool

This skill coordinates high-fidelity UI design generation, editing, and design-system orchestration using the **StitchMCP** server tools.

Since **StitchMCP** is pre-configured and available natively in the Antigravity context, there is **no need** for local environment setups, `STITCH_API_KEY` configuration, or SDK installation. You can call the tools directly using `call_mcp_tool`.

## 🛠️ Available MCP Tools

Call tools on the `StitchMCP` server (using `call_mcp_tool`).

### 1. Project Management

- **`list_projects`**: Lists all projects under the current workspace.
- **`create_project`**: Creates a new project.
  - Parameters: `title` (string)
- **`get_project`**: Fetches details for a specific project.
  - Parameters: `projectId` (string)
- **`delete_project`**: Deletes a project.
  - Parameters: `projectId` (string)

### 2. Screen Generation & Editing

- **`generate_screen_from_text`**: Generates a new UI screen within a project from a text prompt.
  - Parameters:
    - `projectId` (string, required) - Without the `projects/` prefix.
    - `prompt` (string, required) - UI design prompt (e.g. "A dashboard header with profile dropdown and search bar").
    - `deviceType` (string) - `MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`.
    - `designSystem` (string) - ID of the design system to apply.
    - `modelId` (string) - `GEMINI_3_FLASH` or `GEMINI_3_1_PRO`.
- **`edit_screens`**: Refines/modifies existing screen(s) based on a prompt.
  - Parameters:
    - `projectId` (string, required)
    - `selectedScreenIds` (array of strings, required)
    - `prompt` (string, required) - Instructions for editing (e.g. "Make the colors darker and add a checkout button").
    - `deviceType` / `modelId`
- **`generate_variants`**: Explores design alternatives for a screen.
  - Parameters:
    - `projectId` (string, required)
    - `screenId` (string, required)
    - `variantCount` (integer)

### 3. Design System Integration

- **`create_design_system_from_design_md`**: Compiles a design system directly from a markdown design spec.
  - Parameters:
    - `projectId` (string, required)
    - `designMd` (string, required) - Markdown content representing the design system tokens, typography, and palette.
- **`apply_design_system`**: Applies a design system to a project or screen.
  - Parameters:
    - `designSystemId` (string, required)
    - `targetId` (string, required) - ID of project or screen.
- **`list_design_systems`**: Lists available design systems.

---

## 🚦 Recommended Workflows

### UI Generation Pipeline

1. **List / Setup Project**: Use `list_projects` to check if a project exists, or use `create_project` to make a new design canvas.
2. **Generate Screen**: Call `generate_screen_from_text` with your prompt.
   > [!TIP]
   > Generation can take 1-2 minutes. If the tool call times out or encounters a connection error, do **not** retry immediately. Instead, poll using `get_screen` every 30 seconds for up to 10 times.
3. **Refinement (Iterate)**: Present the output to the user. If edits are requested, call `edit_screens` with their instructions.
4. **Create Design System**: If a `DESIGN.md` exists or is created, use `create_design_system_from_design_md` to synchronize Stitch's styling engine with your project's brand guidelines.
