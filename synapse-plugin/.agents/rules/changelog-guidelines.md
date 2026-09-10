# Changelog Guidelines

> [!IMPORTANT]
> **CRITICAL ENFORCEMENT**: Generating or updating the `CHANGELOG.md` file in **English** is **MANDATORY** for every task or feature that involves code/file changes. You must perform this before presenting the final result to the user. Failure to do so is a direct violation of the development process.

This rule outlines the protocol for generating and updating changelogs during task/feature completion.

### 1. Changelog File Location (CRITICAL)

- **Co-locate with `.git` Root**: The `CHANGELOG.md` file MUST be placed directly in the root folder containing the `.git` directory of the target repository/project where the changes occurred.
- **Multi-project / Monorepo Workspace Traversal**: When the IDE/workspace is opened at a parent or umbrella folder containing multiple sub-projects, services, or submodules (e.g. `frontend/`, `backend/`, `worker/`, `services/service-a/`), do **NOT** create `CHANGELOG.md` in the parent directory if that parent has no `.git` repository. Instead, locate the closest enclosing `.git` directory for the modified files and place/update `CHANGELOG.md` at that `.git` root level.
- **Independent Git Repositories / Submodules**: If the workspace contains multiple independent Git repositories or submodules, update the `CHANGELOG.md` in each respective repository where changes were actually made.

### 2. Comparison & Target Branch

- **Mandatory Comparison**: Always generate the changelog by comparing the current branch's changes against the `develop` branch.
- **Fallback Branches**: If the `develop` branch does not exist in the repository, compare against `main` or `master` (in that order).
- **Commit Amends Support**: If a commit is amended or re-applied, always perform the comparison against the base branch (`develop`/`main`/`master`) and only append/update the changes under the single version entry in the changelog.
- **Same Branch Consolidation**: All changes made on the same feature/fix branch must be grouped under a single version heading (named after the short/summary name of that branch). Do not split changes on the same feature branch into multiple release sections.
- **Direct Commit on Base Branches (CRITICAL)**: If working or committing directly on a base branch (`develop`, `main`, or `master`) instead of a feature branch, create/update a section titled with the branch name and current date (e.g. `## develop - YYYY/MM/DD`, `## main - YYYY/MM/DD`, or `## master - YYYY/MM/DD`) to prevent changes from different days/tasks from blending into one indistinguishable block. Group all tasks performed on that base branch on that same date under this heading.
- **Consolidate Internal Churn (CRITICAL)**: Do not log changes that represent internal development iterations or temporary mistakes within the branch itself if they cancel each other out relative to the target base branch (`develop`/`main`/`master`). For example, if a function, package, or file was added and then subsequently deleted or reverted within the same branch, it should NOT appear in the final changelog as a "removal" or "cleanup", since the base branch never had it in the first place. Only document the final net differences between the current branch's state and the base branch.
- **No Absolute Paths (CRITICAL)**: Do not write absolute file paths (e.g., `file:///absolute/path/to/file` or absolute paths starting with `/Users/...`) into any code files, configuration files, or markdown files (such as `CHANGELOG.md`, `SKILL.md`, etc.). Always use relative paths (e.g. `src/constants/types.ts` or `references/memory/SKILL.md`) or file basenames. Note: Even though agent instructions mandate using absolute file URLs in chat responses to the USER, you MUST NOT write them into the repository files.
- **Ignore Localization Files**: Do not include updates/changes made to multilingual translation/localization JSON files (e.g., `ja.json`, `en.json`) in the changelog.

### 3. Structure Requirements

- **Version Heading**: For the release heading (`##`), do not use `Unreleased`.
  - For feature/fix branches: Use the short/summary name of the current branch (e.g. `## feat/user-auth`).
  - For direct commits on base branches (`develop`/`main`/`master`): Use `<branch-name> - YYYY/MM/DD` (e.g. `## develop - 2026/09/10`).
- **Sections**: The changelog entry must contain the following sections (if a section has no changes or information, omit it entirely from the changelog entry):
  - **Overview**: A brief summary of the changes (mandatory).
  - **BUSINESS LOGIC**: Key changes to business logic.
  - **IMPACT**: Functional or operational impact of the changes.
  - **NEW FEATURES**: List of new features introduced.
  - **BUG FIXES**: List of bugs fixed.
  - **IMPROVEMENTS**: List of refactoring, optimization, or quality improvements.
  - **BREAKING CHANGES**: Any breaking changes and migration/upgrade instructions.
  - **SECURITY**: Any security-related fixes or enhancements.
  - **DEPENDENCIES**: Changes to dependencies, packages, libraries.
  - **DATABASE MIGRATIONS**: Any schema changes, migration scripts, or DB updates.
  - **CONFIGURATION CHANGES**: Changes to env files, config files, settings.
- **Exclude Trivial & Linter Noise (CRITICAL)**: Do not log minor code formatting, trivial refactors (e.g., renaming variables/classes, adding/removing imports, syntax upgrades like `parseInt` to `Number.parseInt`), or automated linter/SonarQube warnings resolutions (e.g., adding `readonly`, resolving floating promises, using modern Array methods, or referencing SonarQube rule IDs like `typescript:S6759`). Either omit them entirely or group them into a single high-level bullet point under IMPROVEMENTS (e.g., `- Resolved SonarQube code quality and linting warnings`). Focus changelogs on meaningful features, actual bug fixes, security patches, and configuration updates.
- **Business Logic & Impact Guidance**: Clearly document changes to business logic and their functional or operational impact. Instead of just stating _what_ code line was edited, explain _why_ it was changed and _how_ it affects the system behavior or the user experience (e.g., instead of "Configured node-postgres to parse TIMESTAMP as UTC", write "Fixed timezone parsing discrepancy for schedules by parsing TIMESTAMP columns as UTC, ensuring runs trigger at the expected local time").

### 4. Submodule & Sub-repo Scope Focus

- If the workspace has git submodules or independent git sub-repositories, focus the changelog updates inside that submodule's own `.git` root changelog file. Do not clutter parent non-git directories with submodule-level changes.
