---
name: synapse-research-center
description: Search library/framework documentation via llms.txt (context7.com). Use for API docs, GitHub repository analysis, technical documentation lookup, latest library features.
argument-hint: "[library-name] [topic]"
---

# Documentation Discovery via MCP Tools

## Overview

**MCP-first** documentation discovery using llms.txt standard.

Use MCP tools instead of manual URL construction or local Node script invocation.

## Primary Workflow

**ALWAYS execute in this order:**

1. **FETCH documentation:**
   Call the MCP tool `fetch_online_docs(query)`.
   _Example:_ `fetch_online_docs(query="How do I use date picker in shadcn?")`

2. **ANALYZE results (if multiple URLs returned):**
   Call the MCP tool `analyze_llms_txt(content)` passing the fetched text.

These tools handle URL construction, fallback chains, and categorizing/budgeting automatically.

## MCP Tools

**`fetch_online_docs`** - Retrieve documentation

- Constructs context7.com URLs automatically
- Handles fallback: topic → general → error
- Outputs llms.txt content or error message

**`analyze_llms_txt`** - Process llms.txt

- Categorizes URLs (critical/important/supplementary)
- Recommends agent distribution (1 agent, 3 agents, 7 agents, phased)
- Returns JSON with strategy

## Execution Principles

1. **MCP Tools first** - Call MCP tools instead of running local scripts or manual web fetching
2. **Zero-token overhead** - Execution runs via MCP server without local context bloat
3. **Automatic fallback** - MCP tool handles topic → general → error chains automatically
4. **Agent distribution** - Use `analyze_llms_txt` recommendation for multi-agent workloads

## Quick Start

**Topic query:** "How do I use date picker in shadcn?"

- Call `fetch_online_docs(query="How do I use date picker in shadcn?")`

**General query:** "Documentation for Next.js"

- Call `fetch_online_docs(query="Documentation for Next.js")`
- Call `analyze_llms_txt(content="...")` using the result.

## Environment

Scripts load `.env`: `process.env` > `skills/synapse-research-center/.env` > `skills/synapse-.env` > `.env`

See `.env.example` for configuration options.
