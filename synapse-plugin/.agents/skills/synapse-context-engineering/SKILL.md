---
name: synapse-context-engineering
description: |
  Check context usage limits, monitor time remaining, optimize token consumption, and debug context failures.

  MANDATORY: Execute when the user asks about context percentage, rate limits, usage warnings, context optimization, agent architectures, or memory systems; OR proactively when the context utilization in the `<usage-awareness>` block reaches or exceeds 70% (warning threshold).

  Trigger immediately for:
  - Context & token usage queries: "context limit", "token consumption", "rate limits", "usage warning", "context percentage", "how many tokens".
  - Optimization & debugging: "context optimization", "reduce tokens", "debug context failures", "lost-in-middle", "context health".
  - Agent architectures & memory: "agent architecture", "memory systems", "multi-agent coordination", "context isolation".
  - Proactive triggers: System `<usage-awareness>` context utilization reports >= 70%.

  DO NOT trigger for:
  - Standard coding tasks or file edits that do not involve context window or token optimization concerns.
argument-hint: "[topic or question]"
---

# Context Engineering

Context engineering curates the smallest high-signal token set for LLM tasks. The goal: maximize reasoning quality while minimizing token usage.

## When to Activate

- Designing/debugging agent systems
- Context limits constrain performance
- Optimizing cost/latency
- Building multi-agent coordination
- Implementing memory systems
- Evaluating agent performance
- Developing LLM-powered pipelines

## Core Principles

1. **Context quality > quantity** - High-signal tokens beat exhaustive content
2. **Attention is finite** - U-shaped curve favors beginning/end positions
3. **Progressive disclosure** - Load information just-in-time
4. **Isolation prevents degradation** - Partition work across sub-agents
5. **Measure before optimizing** - Know your baseline

**IMPORTANT:**

- Sacrifice grammar for the sake of concision.
- Ensure token efficiency while maintaining high quality.
- Pass these rules to subagents.

## Quick Reference

| Topic                 | When to Use                                        | Reference                                                       |
| --------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| **Fundamentals**      | Understanding context anatomy, attention mechanics | [context-fundamentals.md](./references/context-fundamentals.md) |
| **Degradation**       | Debugging failures, lost-in-middle, poisoning      | [context-degradation.md](./references/context-degradation.md)   |
| **Optimization**      | Compaction, masking, caching, partitioning         | [context-optimization.md](./references/context-optimization.md) |
| **Compression**       | Long sessions, summarization strategies            | [context-compression.md](./references/context-compression.md)   |
| **Memory**            | Cross-session persistence, knowledge graphs        | [memory-systems.md](./references/memory-systems.md)             |
| **Multi-Agent**       | Coordination patterns, context isolation           | [multi-agent-patterns.md](./references/multi-agent-patterns.md) |
| **Evaluation**        | Testing agents, LLM-as-Judge, metrics              | [evaluation.md](./references/evaluation.md)                     |
| **Tool Design**       | Tool consolidation, description engineering        | [tool-design.md](./references/tool-design.md)                   |
| **Pipelines**         | Project development, batch processing              | [project-development.md](./references/project-development.md)   |
| **Runtime Awareness** | Usage limits, context window monitoring            | [runtime-awareness.md](./references/runtime-awareness.md)       |

## Key Metrics

- **Token utilization**: Warning at 70%, trigger optimization at 80%
- **Token variance**: Explains 80% of agent performance variance
- **Multi-agent cost**: ~15x single agent baseline
- **Compaction target**: 50-70% reduction, <5% quality loss
- **Cache hit target**: 70%+ for stable workloads

## Four-Bucket Strategy

1. **Write**: Save context externally (scratchpads, files)
2. **Select**: Pull only relevant context (retrieval, filtering)
3. **Compress**: Reduce tokens while preserving info (summarization)
4. **Isolate**: Split across sub-agents (partitioning)

## Anti-Patterns

- Exhaustive context over curated context
- Critical info in middle positions
- No compaction triggers before limits
- Single agent for parallelizable tasks
- Tools without clear descriptions

## Guidelines

1. Place critical info at beginning/end of context
2. Implement compaction at 70-80% utilization
3. Use sub-agents for context isolation, not role-play
4. Design tools with 4-question framework (what, when, inputs, returns)
5. Optimize for tokens-per-task, not tokens-per-request
6. Validate with probe-based evaluation
7. Monitor KV-cache hit rates in production
8. Start minimal, add complexity only when proven necessary

## Runtime Awareness

The system automatically injects usage awareness via PostToolUse hook:

```xml
<usage-awareness>
Claude Usage Limits: 5h=45%, 7d=32%
Context Window Usage: 67%
</usage-awareness>
```

**Thresholds:**

- 70%: WARNING - consider optimization/compaction
- 90%: CRITICAL - immediate action needed

**Data Sources:**

- Usage limits: Anthropic OAuth API (`https://api.anthropic.com/api/oauth/usage`)
- Context window: Statusline temp file (`/tmp/ck-context-{session_id}.json`)

## MCP Tools

Instead of running local scripts, call the following MCP tools directly:

- `analyze_context_health(context_file_path, token_limit)`: Analyze context utilization, health status, degradation, and get recommendations.
- `calculate_context_budget(...)`: Calculate a suggested token budget allocation for system prompts, tools, docs, and history.
