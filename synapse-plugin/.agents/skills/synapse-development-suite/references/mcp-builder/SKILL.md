---
name: synapse-mcp-builder
description: |-
  Build MCP servers for LLM-external service integration. Supports FastMCP (Python) and MCP SDK (Node/TypeScript).

  MANDATORY: Execute when building, modifying, or testing Model Context Protocol (MCP) servers and tools.

  Trigger immediately for:
    - MCP server
    - Model Context Protocol
    - mcp tool definition
    - mcp config json

  DO NOT trigger for:
    - Creating regular API endpoints.
    - Configuring static environment variables.
argument-hint: "[service or API to integrate]"
---

# MCP Server Development (Agent-Centric Design)

Build Model Context Protocol (MCP) servers to allow AI agents to interact with external tools, APIs, and resources.

## Design Principles

- **Build for Workflows:** Consolidate related operations into high-impact tools.
- **Optimize for Context:** Return high-signal information, not raw data dumps.
- **Actionable Errors:** Error messages should guide agents toward correct usage.
- **Natural Subdivisions:** Tool names should reflect how humans think about tasks.

## Implementation Phases

### 1. Research & Planning

- Study the target API documentation.
- Define the core workflows the agent needs to accomplish.
- Plan input/output schemas (Pydantic/Zod).

### 2. Implementation

- **Python (FastMCP):** Use `@mcp.tool()` for rapid development.
- **Node/TypeScript:** Use `server.registerTool()` for type-safe integration.
- Implement pagination, filtering, and truncation (max 25k tokens).

### 3. Review & Refine

- Ensure DRY (Don't Repeat Yourself) logic.
- Verify security (no hardcoded secrets).
- Check that error messages are "agent-educational".

### 4. Evaluations

- Create a `qa_pair` XML file to test if the LLM can solve complex tasks using the new tools.

## Quick Start (Python)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("MyServer")

@mcp.tool()
async def get_resource(id: str) -> str:
    """Fetch a resource with clear agent-centric descriptions."""
    return f"Resource data for {id}"
```
