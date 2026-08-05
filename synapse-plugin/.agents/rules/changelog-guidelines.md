# Changelog Guidelines

> [!IMPORTANT]
> **CRITICAL ENFORCEMENT**: Generating or updating the `CHANGELOG.md` file in **English** is **MANDATORY** for every task or feature that involves code/file changes. You must perform this before presenting the final result to the user. Failure to do so is a direct violation of the development process.

This rule outlines the protocol for generating and updating changelogs during task/feature completion.

### 1. Comparison & Target Branch

- **Mandatory Comparison**: Always generate the changelog by comparing the current branch's changes against the `develop` branch.
- **Fallback Branches**: If the `develop` branch does not exist in the repository, compare against `main` or `master` (in that order).
- **Commit Amends Support**: If a commit is amended or re-applied, always perform the comparison against the base branch (`develop`/`main`/`master`) and only append/update the changes under the single version entry in the changelog.
- **Same Branch Consolidation**: All changes made on the same branch must be grouped under a single version heading (named after the short/summary name of that branch). Do not split changes on the same branch into multiple release sections.
- **No Absolute Paths (CRITICAL)**: Do not write absolute file paths (e.g., `file:///absolute/path/to/file` or absolute paths starting with `/Users/...`) into any code files, configuration files, or markdown files (such as `CHANGELOG.md`, `SKILL.md`, etc.). Always use relative paths (e.g. `src/constants/types.ts` or `references/memory/SKILL.md`) or file basenames. Note: Even though agent instructions mandate using absolute file URLs in chat responses to the USER, you MUST NOT write them into the repository files.
- **Ignore Localization Files**: Do not include updates/changes made to multilingual translation/localization JSON files (e.g., `ja.json`, `en.json`) in the changelog.

### 2. Structure Requirements

- **Version Heading**: For the release heading (`##`), do not use `Unreleased`. Use the short/summary name of the current branch instead.
- **Sections**: The changelog entry must contain the following sections (if a section has no changes or information, omit it entirely from the changelog entry):
  - **Overview**: A brief summary of the changes (mandatory).
  - **NEW FEATURES**: List of new features introduced.
  - **BUG FIXES**: List of bugs fixed.
  - **IMPROVEMENTS**: List of refactoring, optimization, or quality improvements.
  - **BREAKING CHANGES**: Any breaking changes and migration/upgrade instructions.
  - **SECURITY**: Any security-related fixes or enhancements.
  - **DEPENDENCIES**: Changes to dependencies, packages, libraries.
  - **DATABASE MIGRATIONS**: Any schema changes, migration scripts, or DB updates.
  - **CONFIGURATION CHANGES**: Changes to env files, config files, settings.

### 3. Submodule Scope Focus

- If the repository has git submodules and the changes are within a submodule, focus the changelog updates inside that submodule's own changelog file. Do not clutter the root changelog with detailed submodule-level changes.
