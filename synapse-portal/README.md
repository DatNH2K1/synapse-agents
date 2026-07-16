# Synapse Knowledge Portal (`synapse-portal`)

A premium Next.js web application and dashboard built to visualize knowledge graphs, query developer memories, manage user personas, and serve as the relational database backend for the Synapse ecosystem.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19 & TypeScript
- **Database**: PostgreSQL (containerized)
- **ORM**: Prisma ORM
- **Styling**: Tailwind CSS v4 & PostCSS
- **Visualizations**: `react-force-graph-2d` (interactive node networks) & `recharts` (analytics charts)
- **Testing**: Vitest & Testing Library

---

## 📂 Project Structure

```text
synapse-portal/
├── app/                  # Next.js App Router (pages, layout, API routes)
├── components/           # Reusable React components (UI elements, layout, visualizations)
├── prisma/               # Database configurations
│   ├── schema.prisma     # Prisma database schema definition
│   └── seed.ts           # Seeding scripts for initial database nodes & tags
├── scripts/              # Build & automation scripts
│   ├── render_config.ts  # Renders developer/agent configurations from env
│   └── build_antigravity_plugin.ts # Compiles rules, skills, and links the plugin
├── tests/                # Unit and integration test suites
├── locales/              # Translation catalogs (i18n support)
├── Dockerfile            # Container configuration for production deployment
├── docker-compose.yml    # Docker Compose setup (Portal + PostgreSQL)
└── package.json          # Node dependencies & script runners
```

---

## 🚀 Running the Portal

The simplest way to run the portal is from the project workspace root using the `Makefile` wrappers:

```bash
# Start in development mode (with hot reloading and database containers)
make dev

# Start in production mode
make up

# Stop the containers
make down
```

The server will spin up and be available at [http://localhost:3100](http://localhost:3100).

---

## 🗄️ Database Operations (Prisma)

The database runs in a PostgreSQL container. You can interact with it via the following npm scripts from within the `synapse-portal` directory:

- **Generate Prisma Client**: `npm run db:generate`
- **Run migrations**: `npm run db:migrate`
- **Seed the database**: `npm run db:seed`
- **Full Wipe & Reload**: Use `make db-refresh` from the workspace root to reset all tables and re-seed clean values.

---

## 🧪 Running Tests

To run the Vitest test suites:

```bash
# Run tests
npm run test

# Run tests silently (clean output, used by check/format pipelines)
npm run test:silent
```

---

## ⚙️ Build and Automation Scripts

Located under `synapse-portal/scripts/`:

1. **`render_config.ts`**:
   - Parses the root `.env` file.
   - Renders appropriate local or workspace configuration files for tools and agents.

2. **`build_antigravity_plugin.ts`**:
   - Compiles the Antigravity plugin configuration.
   - Merges skills and agent personas.
   - Generates the standard manifest and MCP settings.
   - Automatically links the build output to `~/.gemini/config/plugins/synapse-plugin` if run with the `--link` argument.
