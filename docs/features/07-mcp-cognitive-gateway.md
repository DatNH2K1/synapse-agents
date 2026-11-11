# Service: MCP Cognitive Gateway

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Functional Scope & Protocol Governance

| Interface Capability       | Operational Protocol        | Transport Mode                  | Security & Session Boundary                    |
| :------------------------- | :-------------------------- | :------------------------------ | :--------------------------------------------- |
| **Cognitive MCP Tool RPC** | Model Context Protocol v1.0 | Standard JSON-RPC 2.0 Streaming | Bound to authenticated local developer session |
| **Realtime Event Channel** | Server-Sent Events          | Streaming Text Channel          | Auto-reconnect with continuous event dispatch  |

---

## 2. Functional Tool Suites & Business Capabilities

| Tool Capability              | Functional Suite | Business Purpose & Operational Value                              | Key Parameters                        |
| :--------------------------- | :--------------- | :---------------------------------------------------------------- | :------------------------------------ |
| **`query_memory`**           | Knowledge Suite  | Retrieves proven lessons and conventions relevant to current task | Query terms, project slug, tags       |
| **`propose_memory`**         | Knowledge Suite  | Submits newly discovered lessons or gotchas for Gate curation     | Title, markdown content, tags, scope  |
| **`approve_proposal`**       | Gate Curation    | Certifies candidate lesson and merges it into knowledge baseline  | Proposal identifier                   |
| **`reject_proposal`**        | Gate Curation    | Declines candidate lesson with explanatory feedback               | Proposal identifier, rejection reason |
| **`increment_efficacy`**     | Knowledge Suite  | Credits successful real-world reuse of a specific lesson          | Node identifier                       |
| **`list_nodes`**             | Knowledge Suite  | Browses active knowledge nodes filtered by domain scopes          | Tags, scope level, project slug       |
| **`index_repository`**       | Code Discovery   | Builds dependency graph and symbol map for a repository           | Working path, repository slug         |
| **`query_repository_index`** | Code Discovery   | Queries symbols and callers without loading full raw files        | Repository slug, symbol, file         |
| **`fetch_online_docs`**      | Docs Seeker      | Retrieves authoritative library documentation dynamically         | Library identifier, topic             |
| **`analyze_context_health`** | Context Analyzer | Audits token budget consumption to prevent context degradation    | Active prompt text, model limit       |
| **`generate_ai_art`**        | Design Suite     | Generates visual artwork briefs and design system specifications  | Prompt description, stylistic theme   |

---

## 3. Resilience, Idempotency & Error Handling

- **Idempotency Guarantee**: Submitting identical proposal payloads or multiple approval calls on the same node must return a safe confirmation without creating duplicate entries.
- **Protocol Compliance**: Standardized error responses provide actionable human-readable explanations when parameter validation fails.
