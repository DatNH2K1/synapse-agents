# Module: Landing Page & Portal Overview Dashboard

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: Public Landing Page & Portal Overview (`/`)

### A. Actors & Business Objectives

- **Primary Actors**: Software Engineers, Tech Leads, System Architects.
- **Business Goal**: Instantly assess system-wide knowledge health, track accumulated operational lessons, monitor pending curation queues, and review the active AI specialist roster.

### B. UI Elements & Business Action Matrix

| UI Element                 | Interaction Type         | Visibility / Conditions  | Business Behavior & Rules                                                                                                                                                                                                                                                                                                                       |
| :------------------------- | :----------------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Personalized Greeting**  | Dynamic Typography       | Always visible           | Renders greeting to the configured user alongside real-time overall system operational health.                                                                                                                                                                                                                                                  |
| **Live Metric Highlights** | Interactive Metric Cards | Always visible           | Delivers 4 critical business metrics:<br>1. **Total Knowledge**: Count of standardized and approved knowledge nodes.<br>2. **Effective Lessons**: Lessons with proven real-world successful reuse.<br>3. **Pending Curation**: Proposals requiring human expert review.<br>4. **Domain Tags**: Total registered categorization taxonomy labels. |
| **"Enter Dashboard" CTA**  | Primary Action Button    | Always visible           | Navigates user to the deep analytical overview and relationship atlas.                                                                                                                                                                                                                                                                          |
| **The Gate Quick Access**  | Status Badge Button      | Always visible           | Displays real-time counter of pending items; navigates directly to curation queue on click.                                                                                                                                                                                                                                                     |
| **AI Specialist Showcase** | Grid of Agent Cards      | Always visible           | Showcases loaded AI specialist personas along with their core domain responsibilities.                                                                                                                                                                                                                                                          |
| **Language Switcher**      | Selection Dropdown       | Always visible (Top Bar) | Toggles application language between English and Vietnamese, persisting user preference across sessions.                                                                                                                                                                                                                                        |
| **Theme Switcher**         | Toggle Button            | Always visible (Top Bar) | Toggles visual theme (Light/Dark mode) to optimize readability and working conditions.                                                                                                                                                                                                                                                          |

---

## 2. Screen: Knowledge Analytics Dashboard (`/dashboard`)

### A. UI Elements & Business Action Matrix

| UI Element                       | Interaction Type   | Visibility / Conditions | Business Behavior & Rules                                                                                                                                                                                                                                                                     |
| :------------------------------- | :----------------- | :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Growth Trend Chart**           | Trend Area Graph   | Always visible          | Visualizes the cumulative velocity of verified knowledge acquisition across milestones.                                                                                                                                                                                                       |
| **Scope Distribution Breakdown** | Proportional Chart | Always visible          | Breaks down knowledge into 3 operational scopes:<br>1. **Global**: Universal best practices across all ecosystem projects.<br>2. **Project**: Conventions specific to the currently selected workspace.<br>3. **Session**: Short-term tactical notes under evaluation before standardization. |
| **Interactive Knowledge Atlas**  | Relationship Graph | Always visible          | Graph visualizer rendering knowledge nodes as connected celestial clusters to uncover knowledge silos and rule overlaps.                                                                                                                                                                      |

### B. Business Flows & Realtime Synchronization

#### Flow 1.1: Live Metric Revalidation

1. Whenever a new lesson is proposed, approved, or rejected by any agent or engineer:
2. The system dispatches a real-time state synchronization event to all connected dashboard clients.
3. Summary metric cards, distribution charts, and the pending badge refresh instantly without requiring a full page reload.
