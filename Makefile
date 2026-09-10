.DEFAULT_GOAL := up

.PHONY: check format check-ts check-md format-ts format-md test up down build restart seed migrate db-refresh dev link\:antigravity unlink\:antigravity render\:config build\:antigravity manifests

# Run all code checks
check: check-ts check-md

# Format all code files (TypeScript, Markdown)
format: format-ts format-md

# TypeScript checks (Linting, Type safety, Dependencies, i18n)
check-ts:
	cd synapse-portal && npm run check

format-ts:
	cd synapse-portal && npx prettier --write .

# Markdown formatting and checking
check-md:
	npx --prefix synapse-portal prettier --check "**/*.md"

format-md:
	npx --prefix synapse-portal prettier --write "**/*.md"

# Run tests
test:
	cd synapse-portal && npm run test:silent

# Start containers in background
up:
	cd synapse-portal && docker compose up -d --build
	docker image prune -f --filter "label=com.docker.compose.project=synapse"
	@echo "⏳ Waiting for synapse-portal to start..."
	@until [ "$$(docker inspect -f '{{.State.Status}}' synapse-portal 2>/dev/null)" = "running" ]; do \
		sleep 1; \
	done
	@echo "🚀 Running database migrations and seeding..."
	$(MAKE) migrate
	$(MAKE) seed
	$(MAKE) link:antigravity

# Stop and remove containers
down:
	cd synapse-portal && docker compose down

# Rebuild images
build:
	cd synapse-portal && docker compose build

# Restart all containers
restart:
	cd synapse-portal && docker compose restart

# Run database seed
seed:
	cd synapse-portal && docker compose exec synapse-portal npx prisma db seed

# Run database migrations
migrate:
	cd synapse-portal && docker compose exec synapse-portal npx prisma migrate deploy

# Full database refresh (Wipe + Seed)
db-refresh:
	cd synapse-portal && docker compose exec synapse-portal npx prisma migrate reset --force
	cd synapse-portal && docker compose exec synapse-portal npx prisma db seed

# Run local development with hot reload
dev:
	cd synapse-portal && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
	docker image prune -f --filter "label=com.docker.compose.project=synapse"
	@echo "⏳ Waiting for synapse-portal to start in development mode..."
	@until [ "$$(docker inspect -f '{{.State.Status}}' synapse-portal 2>/dev/null)" = "running" ]; do \
		sleep 1; \
	done
	@echo "🚀 Running database migrations and seeding..."
	$(MAKE) migrate
	$(MAKE) seed
	$(MAKE) link:antigravity

# Render agent configuration from .env
render\:config:
	npx --prefix synapse-portal tsx synapse-portal/scripts/render_config.ts

# Build antigravity plugin
build\:antigravity: render\:config
	npx --prefix synapse-portal tsx synapse-portal/scripts/build_antigravity_plugin.ts

# Build and link antigravity plugin to global customizations
link\:antigravity: render\:config
	npx --prefix synapse-portal tsx synapse-portal/scripts/build_antigravity_plugin.ts --link

# Generate portal manifests (agent-manifest.csv, skill-manifest.csv, tool-manifest.csv)
manifests:
	npx --prefix synapse-portal tsx synapse-portal/scripts/generate_manifests.ts

