---
name: synapse-research-center
description: Search library/framework documentation via official Context7 MCP (resolve-library-id, query-docs). Use for API docs, GitHub repository analysis, technical documentation lookup, latest library features.
argument-hint: "[library-name] [topic]"
---

# Documentation Discovery via Context7 MCP

## Overview

**MCP-first** documentation discovery powered directly by Context7 MCP tools.

## Primary Workflow

**ALWAYS execute in this order:**

1. **RESOLVE Library ID:**
   Call the Context7 MCP tool `resolve-library-id(libraryName, query)`.
   _Example:_ `resolve-library-id(libraryName="shadcn", query="date picker")`

2. **QUERY Documentation:**
   Call the Context7 MCP tool `query-docs(libraryId, query)` using the resolved library ID.
   _Example:_ `query-docs(libraryId="/shadcn-ui/ui", query="date picker")`

3. **INSTALLATION Check & Fallback:**
   - If Context7 MCP is not yet installed or available in your environment, proactively guide the user to install the Context7 plugin from the Agent Marketplace catalog:
     ```text
     <plugin-card catalog-id="antigravity-plugins-partners/plugin/context7"></plugin-card>
     ```

## Execution Principles

1. **Direct MCP Tools** - Call Context7 MCP tools (`resolve-library-id`, `query-docs`) directly instead of legacy local fetch scripts or custom wrappers.
2. **Zero-Token Overhead** - Exact version-specific documentation is fetched directly into context without needing local API key management.
3. **Always Suggest Install if Missing** - If the tool is not present, display the plugin installation card immediately.

## Quick Start

**Lookup Query:** "How do I use date picker in shadcn?"

1. Call `resolve-library-id(libraryName="shadcn", query="date picker")`
2. Call `query-docs(libraryId="/shadcn-ui/ui", query="date picker")`

## Environment

Scripts load `.env`: `process.env` > `skills/synapse-research-center/.env` > `skills/synapse-.env` > `.env`

See `.env.example` for configuration options.
