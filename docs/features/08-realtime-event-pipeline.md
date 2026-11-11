# Service: Realtime Event Pipeline

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Functional Scope & Channel Subscriptions

| Channel / Stream            | Transport Mechanism | Subscribed Consumers               | Connection & Heartbeat Policy        |
| :-------------------------- | :------------------ | :--------------------------------- | :----------------------------------- |
| **System Event Stream**     | Server-Sent Events  | Web UI (Gate, Dashboard, Settings) | Continuous 15s keep-alive ping       |
| **Internal Domain Emitter** | Event Emitter Bus   | Background Workers & Portal Core   | Process-scoped singleton message bus |

---

## 2. Business Event Taxonomy & Side Effects

| Event Name              | Originating Actor / Source | Business Payload Summary                      | Client / Consumer Side Effect                      |
| :---------------------- | :------------------------- | :-------------------------------------------- | :------------------------------------------------- |
| **`proposal_created`**  | Agent via `propose_memory` | New proposal identifier, title, author, scope | Increments pending counter badge in header nav     |
| **`proposal_merged`**   | Expert in The Gate         | Proposal identifier, target node, title       | Updates curation queue and refreshes metrics       |
| **`proposal_rejected`** | Expert in The Gate         | Proposal identifier, rejection justification  | Removes card from active queue without full reload |
| **`indexer_progress`**  | Repository Indexer Engine  | Repository slug, progress percentage          | Advances progress bar on Dependency Graph Explorer |
| **`sleep_cycle_done`**  | REM Sleep Cycle Worker     | Consolidated count, new crystal creations     | Dispatches toast notification on active dashboards |

---

## 3. Communication Sequence & Connection Resilience

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Browser Dashboard
    participant SSE as Event Stream Endpoint
    participant Bus as Internal Domain Event Bus
    participant Worker as Background Workers / Agents

    Client->>SSE: Open event stream connection
    SSE-->>Client: Connection established
    loop Every 15 seconds
        SSE-->>Client: Heartbeat keep-alive ping
    end
    Worker->>Bus: Emit domain event (e.g. proposal_created)
    Bus->>SSE: Forward event to active subscribers
    SSE-->>Client: Push realtime event notification
    Client->>Client: Revalidate affected view data with zero page flicker
```

- **Reconnection Policy**: If the streaming connection drops due to network fluctuations, clients automatically retry with exponential backoff.
- **Resource Cleanup**: Client disconnections instantly remove listeners from the event bus to prevent resource leakage.
