# Module: Interactive Codebase Dependency Graph & Impact Analyzer

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: Dependency Graph Explorer (`/dependency-graph`)

### A. UI Elements & Action Matrix

| Element Name                    | Component Type                              | Visibility / Conditions                 | Interaction & Business Flow                                                                                                                                          |
| :------------------------------ | :------------------------------------------ | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository Selector**         | Dropdown (`Select`)                         | Always visible (Top bar)                | Switches between indexed repositories (e.g. `synapse`, external workspaces). Fetches updated AST graph data via `GET /api/indexer/graph?repo=<repo>`.                |
| **"Orphans Only" Toggle**       | Pill Toggle Button                          | Always visible                          | Filters nodes to display only isolated/orphan files (files with 0 incoming and 0 outgoing dependencies) or shows total orphan count.                                 |
| **Total Files Badge**           | Metric Badge                                | Always visible                          | Renders total count of indexed files in the selected repository.                                                                                                     |
| **Folder Tree Explorer**        | Hierarchical Tree (`FolderTree`)            | Visible on Desktop & Tree Tab (Mobile)  | Displays nested folder structure. Highlights selected file. Expands automatically when a file node is clicked in graph.                                              |
| **2D/3D Force Graph Canvas**    | Force-directed Canvas (`ForceGraphWrapper`) | Visible on Desktop & Graph Tab (Mobile) | Visualizes file nodes (color-coded by extension: TS, JS, JSON, CSS, etc.) and directed dependency links between modules.                                             |
| **Graph Search Bar**            | Search Input                                | Always visible (Overlaid on Graph)      | Filters graph nodes by file path substring. Pressing `Enter` cycles through matching nodes.                                                                          |
| **Graph Controls Overlay**      | Action Toolbar                              | Always visible (Top Right of Graph)     | Supports **Fullscreen Toggle** (`Maximize2`), **Zoom In** (`Plus`), **Zoom Out** (`Minus`), and **Reset Zoom / Fit to Screen** (`RotateCcw`).                        |
| **Selected File Details Panel** | Detail Sidebar                              | Visible when a node is selected         | Displays file name, full path, computed MD5 content hash, exported symbols list, and dynamic **Blast Radius / Impact Analysis**.                                     |
| **Blast Radius List**           | Hierarchical Item List                      | Visible in Details Panel                | Calls `GET /api/indexer/impact?file=<path>&repo=<repo>`. Traverses reverse dependency tree and displays all affected files with their topological propagation depth. |

### B. Business & User Flows

#### Flow 1.1: Blast Radius Impact Analysis

1. Developer selects a file in either the Folder Tree or the Force Graph canvas.
2. The UI triggers `handleNodeClick(nodeId)`:
   - Expands parent directories in the Folder Tree.
   - Highlights the active node in the canvas.
   - Dispatches `GET /api/indexer/impact?file=<path>&repo=<repo>`.
3. Backend performs recursive graph traversal across `IndexerDependency` relations to find all downstream files importing this target module or its exported symbols.
4. UI renders the list of impacted files along with their downstream depth (e.g. Depth 1 = Direct Consumer, Depth 2+ = Transitive Dependent).

#### Flow 1.2: Orphan File Discovery

1. Developer clicks **"Orphans Only"** toggle.
2. Canvas and Folder Tree filter out connected nodes, isolating unreferenced files, dead code candidates, or unused assets for refactoring.
