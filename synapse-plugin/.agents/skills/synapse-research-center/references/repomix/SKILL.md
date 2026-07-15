---
name: synapse-research-center
description: Pack repositories into AI-friendly files (XML, Markdown, JSON). Use for codebase snapshots, LLM context preparation, and security audits.
argument-hint: "[path] [--style xml|markdown|plain|json]"
---

# Repomix (Codebase Packaging)

Repomix packs entire repositories into single, AI-friendly files. Perfect for feeding codebases to LLMs for analysis or audit.

## When to Use

- Packaging codebases for AI analysis or "distillation".
- Creating repository snapshots for LLM context.
- Analyzing third-party libraries or large projects.
- Preparing for security audits.

## Usage

### Basic Usage

```bash
# Package current directory (generates repomix-output.xml)
npx repomix

# Specify output format
npx repomix --style markdown
npx repomix --style json

# Custom output with filters
npx repomix --include "src/**/*.ts" --remove-comments -o output.md
```

## Core Capabilities

- **AI-Optimized:** Clear separators and structure for LLM readability.
- **Token Counting:** Automatically counts tokens for context management.
- **Security:** Integrated Secretlint to detect API keys and secrets.
- **Remote Support:** Process remote GitHub repos directly (`npx repomix --remote owner/repo`).

## Implementation Workflow

1. **Assess Scale:** Check the project size to decide on filters.
2. **Configure:** Use `--include` or `--ignore` to focus on relevant code.
3. **Generate:** Run with `--remove-comments` to save tokens.
4. **Validate:** Review the output for sensitive data and token limits.
