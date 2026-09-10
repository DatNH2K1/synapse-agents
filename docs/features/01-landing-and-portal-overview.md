# Module: Landing Page & Portal Overview Dashboard

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: Public Landing Page (`/`)

### A. UI Elements & Action Matrix

| Element Name                   | Component Type                      | Visibility / Conditions  | Interaction & Business Flow                                                                                                                |
| :----------------------------- | :---------------------------------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero Title & Headline**      | Typography / Gradient               | Always visible           | Renders greeting to configured `userName`, active node count, approved lesson count, pending proposal count, and tag count.                |
| **"Enter Dashboard" CTA**      | Primary Action Button               | Always visible           | Navigates user to `/(dashboard)/dashboard`.                                                                                                |
| **"Review Gate" Quick Action** | Secondary Badge Button              | Always visible           | Navigates user to `/(dashboard)/gate` with pending badge indicator.                                                                        |
| **Realtime Live Metrics**      | Interactive Stat Cards (`TiltCard`) | Always visible           | Displays 3D tilt hover effects; renders dynamic counters for Total Knowledge Nodes, Curated Lessons, Pending Updates, and Registered Tags. |
| **Agent Persona Showcase**     | 3D Card Grid (`TiltCard`)           | Always visible           | Renders preview cards of loaded Synapse agents (from manifest service); displays agent avatar seed, name, title, and capability summary.   |
| **Language Switcher**          | Dropdown / Toggle Button            | Always visible (Top Nav) | Toggles application locale between `en` (English) and `vi` (Tiếng Việt). Persists in client context.                                       |
| **Theme Switcher**             | Toggle Button                       | Always visible (Top Nav) | Toggles UI theme mode (`dark` / `light`). Updates CSS variables and canvas backgrounds.                                                    |

### B. Business & User Flows

#### Flow 1.1: Landing Page Load & Live Stats Fetching

1. User visits `/`.
2. Next.js server component executes `LandingPage()` in `force-dynamic` mode.
3. Concurrently queries Prisma database for `getNodesWithColor()`, `getPendingUpdates()`, and `getTags()`, along with `manifestService.getAgents()`.
4. Renders responsive server-rendered HTML with dynamic client hydration for 3D tilt cards.

---

## 2. Screen: Main Overview Dashboard (`/dashboard`)

### A. UI Elements & Action Matrix

| Element Name                    | Component Type                          | Visibility / Conditions | Interaction & Business Flow                                                                                                                                                                                     |
| :------------------------------ | :-------------------------------------- | :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **System Status Banner**        | Status Header                           | Always visible          | Displays system health indicator (`system_stable`), current date, and active node count summary.                                                                                                                |
| **Top Metric Cards**            | Stat Cards (`StatCard`)                 | Always visible          | 1. **Total Nodes**: Count of all approved knowledge nodes.<br>2. **Successful Lessons**: Nodes with `success_count > 0`.<br>3. **Pending Approval**: Count of pending proposals currently awaiting Gate review. |
| **Knowledge Growth Chart**      | Area / Line Chart (`OverviewCharts`)    | Always visible          | Plots cumulative knowledge acquisition over calendar dates based on `node.last_verified`.                                                                                                                       |
| **Scope Distribution Chart**    | Donut / Pie Chart (`OverviewCharts`)    | Always visible          | Shows breakdown of nodes across core tag scopes (`technology`, `project`, `agent`, `scope`).                                                                                                                    |
| **Category Distribution Chart** | Bar / Pie Chart (`OverviewCharts`)      | Always visible          | Groups nodes by section tags (`mistakes-to-avoid`, `optimized-techniques`, `specialized-conventions`, `user-personals`).                                                                                        |
| **Agent Contribution Chart**    | Horizontal Bar Chart (`OverviewCharts`) | Always visible          | Ranks agents by total knowledge memories authored/tagged.                                                                                                                                                       |
| **Knowledge Atlas Graph**       | 2D/3D Force Graph (`KnowledgeAtlas`)    | Always visible          | Interactive force-directed canvas visualizing relationships between Root Scope clusters, Tags, and individual Knowledge Nodes.                                                                                  |
| **Realtime Sync Listener**      | SSE Event Subscriber                    | Active in background    | Subscribes to `/api/updates`. On node state mutation or proposal resolution, automatically executes Next.js router refresh (`router.refresh()`).                                                                |

### B. Business & User Flows

#### Flow 2.1: Real-time Dashboard Synchronization

1. User opens `/dashboard`.
2. `RealtimeProvider` connects to SSE endpoint `/api/updates`.
3. When an agent or background worker proposes, merges, or approves a memory node, an SSE update event is emitted.
4. Dashboard catches the event and triggers `router.refresh()`, updating chart data, stat counters, and Knowledge Atlas graph nodes smoothly without full page reload.
