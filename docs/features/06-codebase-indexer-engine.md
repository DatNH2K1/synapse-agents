# Service / Worker: Codebase AST Indexer & Dependency Engine

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Trigger & Scheduling Matrix

| Process / Job Name            | Trigger Mechanism        | Frequency / Event Source                                     | Idempotency Key / Lock               |
| :---------------------------- | :----------------------- | :----------------------------------------------------------- | :----------------------------------- |
| **Workspace Indexing**        | MCP Tool Call / HTTP API | On-demand via `index_repository` or `POST /api/indexer/sync` | Repository Name (`IndexerRepo.name`) |
| **Dependency Graph Fetch**    | HTTP API                 | `GET /api/indexer/graph?repo=<name>`                         | Repo UUID                            |
| **Blast Radius Impact Query** | HTTP API                 | `GET /api/indexer/impact?file=<path>&repo=<name>`            | Target File Path                     |

---

## 2. Business Flow & Processing Pipeline

### Process: Repository AST Parsing & Dependency Indexing

#### A. Trigger & Pre-conditions

- **Trigger**: Developer or agent invokes `index_repository(repo_path, repo_name)` or sends payload to `/api/indexer/sync`.
- **Pre-condition**: Repository directory exists and contains parseable TypeScript/JavaScript source files.

#### B. Step-by-Step Execution Flow

1. **Repository Registration**:
   - Upserts `IndexerRepo` record in PostgreSQL with current sync timestamp.
2. **File Scanning & Hash Calculation**:
   - Recursively traverses project workspace, ignoring `node_modules`, `.git`, `.next`, `dist`, and build output directories.
   - Computes MD5 content hash for each source file.
3. **AST Parsing & Symbol Extraction**:
   - Uses TypeScript AST parser to extract top-level declarations:
     - `class` declarations
     - `function` declarations
     - `variable` and `const` declarations / exports
   - Records character/line ranges (e.g. `1:0-15:20`).
4. **Import / Export Resolution & Link Construction**:
   - Analyzes `import` and `export from` AST statements.
   - Resolves relative paths (`./`, `../`) and path aliases (`@/*`).
   - Inserts directed dependency tuples into `IndexerDependency` linking `dependentFileId` $\to$ `dependencyFileId` with specific imported `symbolName` if applicable.
5. **Impact Traversal (Blast Radius)**:
   - When queried, recursively performs breadth-first / depth-first search on `IndexerDependency` where `dependencyFileId` matches the modified file.
   - Computes topological distance (Depth 1 = Direct importer, Depth 2+ = Transitive consumer).

#### C. Side Effects & External Integrations

- **Database**: Upserts `IndexerRepo`, `IndexerFile`, `IndexerSymbol`, and `IndexerDependency` records.
- **Cache**: Invalidation of cached dependency trees in memory.
