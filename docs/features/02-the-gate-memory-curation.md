# Module: The Gate (Memory Curation & Conflict Resolution)

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: The Gate (`/gate`)

### A. UI Elements & Action Matrix

| Element Name                  | Component Type                         | Visibility / Conditions                 | Interaction & Business Flow                                                                                                                    |
| :---------------------------- | :------------------------------------- | :-------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tab Switcher**              | Segmented Control                      | Always visible                          | Toggles between **Review Gate** (`pendingUpdates` queue) and **Evolution History** (`EvolutionTimeline`).                                      |
| **Pending Proposal Counter**  | Badge Indicator                        | Visible on Gate Tab                     | Shows total count of pending memory proposals awaiting human or automated review.                                                              |
| **Proposal Card**             | Interactive Container (`ProposalCard`) | Visible per pending proposal            | Displays proposal label, category section tag, date, similarity match badge, and extracted markdown content preview.                           |
| **"Approve" Action Button**   | Primary Button (Green)                 | Enabled on Proposal Card                | Calls `POST /api/gate` with `{ id, action: "APPROVE" }`. Promotes node to `APPROVED` / `BETA` tier and triggers real-time broadcast.           |
| **"Reject" Action Button**    | Secondary Button (Red)                 | Enabled on Proposal Card                | Calls `POST /api/gate` with `{ id, action: "REJECT" }`. Transitions node to `REJECTED` status.                                                 |
| **"Compare & Merge" Button**  | Action Button (Indigo)                 | Enabled when similar active nodes exist | Opens `ComparisonModal` showing side-by-side diff between proposed node and existing active knowledge nodes.                                   |
| **"Merge with Master" Flow**  | Action Modal (`MergeModal`)            | Triggered on synthesis initiation       | Calls `POST /api/gate/synthesize` to generate AI-synthesized label, unified content, and merge rationale.                                      |
| **Tag Intersection Selector** | Multi-select Pill Group                | Visible in `MergeModal`                 | Allows reviewer to customize and pick tags from the intersection/union of source nodes.                                                        |
| **"Confirm Merge" Action**    | Modal Submit Button                    | Enabled in `MergeModal`                 | Calls `POST /api/gate/merge`. Archives source nodes, creates consolidated unified node in `APPROVED` tier, and enqueues embedding calculation. |
| **Evolution Timeline Search** | Search Input                           | Visible on Evolution Tab                | Filters audit logs by label, proposal ID, or reason keyword.                                                                                   |
| **Status Filter Selector**    | Select / Pill Filter                   | Visible on Evolution Tab                | Filters timeline logs by `ALL`, `APPROVED`, `REJECTED`, or `ARCHIVE`.                                                                          |
| **"Undo" Action Button**      | Reversal Button                        | Visible on active log entries           | Calls `POST /api/gate` with `{ id, action: "UNDO", type }`. Restores previous node status and invalidates cache.                               |

### B. Business & User Flows

#### Flow 1.1: Human Approval & Synthesis Merge Flow

1. Reviewer navigates to `/gate` and views pending proposals.
2. If similarity score against active knowledge is high (e.g. $\ge 50\%$), reviewer clicks **"Compare & Merge"**.
3. System invokes `POST /api/gate/synthesize` with candidate node IDs.
4. Gemini AI model analyzes differences, consolidates overlapping advice, resolves conflicting conventions, and suggests a unified label and markdown content.
5. Reviewer validates the synthesized result in `MergeModal`, adjusts tag associations, and clicks **"Confirm Merge"**.
6. Backend transaction atomically:
   - Creates new consolidated `Node` with status `APPROVED`.
   - Links selected tags via `NodeTag`.
   - Transitions source node proposals and redundant active nodes to `ARCHIVE`.
   - Enqueues embedding vector recalculation.
   - Emits real-time SSE event to all connected dashboard clients.

#### Flow 1.2: Reversal / Undo Flow

1. Reviewer switches to **Evolution History** tab.
2. Selects an entry previously approved or rejected.
3. Clicks **"Undo"**. Backend reverses the status change in `Node` and updates audit trail logs.
